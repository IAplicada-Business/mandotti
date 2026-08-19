-- Produção por safra (planilha Dados Operacionais) + resumo patrimonial (Resumo Executivo)

-- ============ FAZENDAS — matrícula (aba operacional) ============
alter table public.fazendas
  add column if not exists matricula text;

-- ============ PRODUÇÃO GRUPO (histórico + projeção agregada) ============
create table if not exists public.producao_grupo_safra (
  id uuid primary key default gen_random_uuid(),
  safra text not null,
  cultura_codigo text not null references public.produtos_agricolas(codigo) on delete restrict,
  area_plantio_ha numeric(12,2),
  produtividade_sc_ha numeric(10,2),
  preco_saca numeric(12,2),
  custo_saca numeric(12,2),
  tipo text not null default 'realizado'
    check (tipo in ('realizado', 'projecao')),
  ciclo text not null default 'safra'
    check (ciclo in ('safra', 'safrinha')),
  origem text not null default 'planilha',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (safra, cultura_codigo, tipo, ciclo)
);

create index if not exists producao_grupo_safra_safra_idx on public.producao_grupo_safra (safra);

-- ============ PRODUÇÃO POR FAZENDA (previsão 26/27+) ============
create table if not exists public.producao_fazenda_safra (
  id uuid primary key default gen_random_uuid(),
  fazenda_id uuid references public.fazendas(id) on delete set null,
  safra text not null,
  cultura_codigo text not null references public.produtos_agricolas(codigo) on delete restrict,
  area_plantio_ha numeric(12,2),
  produtividade_sc_ha numeric(10,2),
  matricula text,
  origem text not null default 'planilha',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (fazenda_id, safra, cultura_codigo)
);

create index if not exists producao_fazenda_safra_fazenda_idx on public.producao_fazenda_safra (fazenda_id);

-- ============ RESUMO PATRIMONIAL (singleton — aba Resumo Executivo) ============
create table if not exists public.resumo_patrimonial (
  id uuid primary key default gen_random_uuid(),
  participacoes_societarias numeric(16,2) not null default 0,
  imoveis numeric(16,2) not null default 0,
  maquinarios_veiculos numeric(16,2) not null default 0,
  animais numeric(16,2) not null default 0,
  outros_bens numeric(16,2) not null default 0,
  patrimonio_total numeric(16,2) not null default 0,
  passivo_total numeric(16,2) not null default 0,
  patrimonio_liquido numeric(16,2) not null default 0,
  endividamento_pct numeric(8,6) not null default 0,
  total_projetado_juros numeric(16,2),
  passivo_eder numeric(16,2),
  passivo_nagyla numeric(16,2),
  referencia date not null default current_date,
  origem text not null default 'planilha',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists resumo_patrimonial_singleton_idx on public.resumo_patrimonial ((true));

-- Chave natural da planilha de maquinários (ordem)
create unique index if not exists maquinarios_ordem_unique_idx
  on public.maquinarios (ordem) where deleted_at is null;

-- Meta safra 26/27 da planilha institucional
update public.configuracoes_grupo
set meta_hectares_grupo = 6000,
    updated_at = now()
where id = 'c0000000-0000-4000-8000-000000000001'::uuid;

-- ============ TRIGGERS ============
drop trigger if exists producao_grupo_safra_updated_at on public.producao_grupo_safra;
create trigger producao_grupo_safra_updated_at before update on public.producao_grupo_safra
  for each row execute function public.update_updated_at_column();

drop trigger if exists producao_fazenda_safra_updated_at on public.producao_fazenda_safra;
create trigger producao_fazenda_safra_updated_at before update on public.producao_fazenda_safra
  for each row execute function public.update_updated_at_column();

drop trigger if exists resumo_patrimonial_updated_at on public.resumo_patrimonial;
create trigger resumo_patrimonial_updated_at before update on public.resumo_patrimonial
  for each row execute function public.update_updated_at_column();

-- ============ GRANTS & RLS ============
grant select on public.producao_grupo_safra to authenticated;
grant select on public.producao_fazenda_safra to authenticated;
grant select on public.resumo_patrimonial to authenticated;
grant all on public.producao_grupo_safra to service_role;
grant all on public.producao_fazenda_safra to service_role;
grant all on public.resumo_patrimonial to service_role;

alter table public.producao_grupo_safra enable row level security;
alter table public.producao_fazenda_safra enable row level security;
alter table public.resumo_patrimonial enable row level security;

drop policy if exists "producao_grupo_select_autenticado" on public.producao_grupo_safra;
create policy "producao_grupo_select_autenticado" on public.producao_grupo_safra
  for select to authenticated using (true);

drop policy if exists "producao_fazenda_select_autenticado" on public.producao_fazenda_safra;
create policy "producao_fazenda_select_autenticado" on public.producao_fazenda_safra
  for select to authenticated using (true);

drop policy if exists "resumo_patrimonial_select_autenticado" on public.resumo_patrimonial;
create policy "resumo_patrimonial_select_autenticado" on public.resumo_patrimonial
  for select to authenticated using (true);
