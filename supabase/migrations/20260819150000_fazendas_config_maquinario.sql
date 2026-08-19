-- Fazendas enriquecidas, config contabilidade, maquinário manutenção, produtos agrícolas

do $$ begin
  create type public.fazenda_regime as enum ('propria', 'arrendada', 'arrendada_a_terceiro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.modo_contabilidade as enum ('acesso_direto', 'envio_automatico');
exception when duplicate_object then null; end $$;

-- ============ FAZENDAS (campos do blueprint / call) ============
alter table public.fazendas
  add column if not exists regime public.fazenda_regime not null default 'arrendada',
  add column if not exists area_produtiva_ha numeric(12,2),
  add column if not exists area_abertura_ha numeric(12,2),
  add column if not exists custo_arrendamento numeric(16,2),
  add column if not exists venc_arrendamento date,
  add column if not exists inclui_quadro_produtivo boolean not null default true,
  add column if not exists meta_hectares numeric(12,2),
  add column if not exists observacoes text;

update public.fazendas
set area_produtiva_ha = area_hectares
where area_produtiva_ha is null and area_hectares is not null;

-- ============ CONFIGURAÇÕES DO GRUPO (singleton) ============
create table if not exists public.configuracoes_grupo (
  id uuid primary key default gen_random_uuid(),
  email_hrm text,
  modo_contabilidade public.modo_contabilidade not null default 'envio_automatico',
  dia_limite_envio integer not null default 5 check (dia_limite_envio between 1 and 28),
  meta_hectares_grupo numeric(12,2) not null default 10000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.configuracoes_grupo (id, email_hrm, modo_contabilidade, dia_limite_envio, meta_hectares_grupo)
values (
  'c0000000-0000-4000-8000-000000000001'::uuid,
  null,
  'envio_automatico',
  5,
  10000
)
on conflict (id) do nothing;

-- Garante linha única mesmo sem PK fixo em instalações antigas
create unique index if not exists configuracoes_grupo_singleton_idx on public.configuracoes_grupo ((true));

-- ============ MAQUINÁRIO — manutenção e depreciação ============
alter table public.maquinarios
  add column if not exists custo_manutencao_acumulado numeric(16,2) not null default 0,
  add column if not exists depreciacao_anual_pct numeric(5,2) default 10
    check (depreciacao_anual_pct is null or (depreciacao_anual_pct >= 0 and depreciacao_anual_pct <= 100));

-- ============ PRODUTOS AGRÍCOLAS (culturas da operação) ============
create table if not exists public.produtos_agricolas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  tipo text not null default 'cultura',
  cor_token text,
  ativo boolean not null default true,
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.produtos_agricolas (codigo, nome, tipo, cor_token, ordem) values
  ('soja', 'Soja', 'cultura', 'accent-verde-claro', 1),
  ('milho', 'Milho', 'cultura', 'accent-dourado', 2),
  ('sorgo', 'Sorgo', 'cultura', 'accent-terracota', 3),
  ('milheto', 'Milheto', 'cultura', 'accent-marrom-terra', 4)
on conflict (codigo) do nothing;

-- ============ TRIGGERS ============
drop trigger if exists configuracoes_grupo_updated_at on public.configuracoes_grupo;
create trigger configuracoes_grupo_updated_at before update on public.configuracoes_grupo
  for each row execute function public.update_updated_at_column();

drop trigger if exists produtos_agricolas_updated_at on public.produtos_agricolas;
create trigger produtos_agricolas_updated_at before update on public.produtos_agricolas
  for each row execute function public.update_updated_at_column();

-- ============ GRANTS & RLS ============
grant select, update on public.configuracoes_grupo to authenticated;
grant all on public.configuracoes_grupo to service_role;
alter table public.configuracoes_grupo enable row level security;

drop policy if exists "config_grupo_select_autenticado" on public.configuracoes_grupo;
create policy "config_grupo_select_autenticado" on public.configuracoes_grupo
  for select to authenticated using (true);
drop policy if exists "config_grupo_update_admin" on public.configuracoes_grupo;
create policy "config_grupo_update_admin" on public.configuracoes_grupo
  for update to authenticated
  using (public.has_role(auth.uid(), 'administrador'))
  with check (public.has_role(auth.uid(), 'administrador'));

grant select on public.produtos_agricolas to authenticated;
grant all on public.produtos_agricolas to service_role;
alter table public.produtos_agricolas enable row level security;

drop policy if exists "produtos_agricolas_select_autenticado" on public.produtos_agricolas;
create policy "produtos_agricolas_select_autenticado" on public.produtos_agricolas
  for select to authenticated using (true);
