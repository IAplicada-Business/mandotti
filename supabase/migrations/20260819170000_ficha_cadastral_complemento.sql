-- Complemento ficha cadastral: patrimônio detalhado, contatos, benchmarks institucionais, cronograma

alter table public.configuracoes_grupo
  add column if not exists tempo_agricultura_anos integer,
  add column if not exists perfil_grupo text,
  add column if not exists fonte_bancario_pct numeric(5,2),
  add column if not exists fonte_proprio_pct numeric(5,2),
  add column if not exists fonte_principal_banco text;

alter table public.resumo_patrimonial
  add column if not exists cronograma_ate_jun26 numeric(16,2),
  add column if not exists cronograma_jul26_jun27 numeric(16,2),
  add column if not exists cronograma_jul27_jun28 numeric(16,2),
  add column if not exists cronograma_jul28_jun29 numeric(16,2),
  add column if not exists cronograma_jul29_jun30 numeric(16,2),
  add column if not exists cronograma_apos_jun30 numeric(16,2);

create table if not exists public.patrimonio_bens (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('participacao', 'imovel', 'benfeitoria')),
  descricao text not null,
  municipio text,
  ordem integer not null default 0,
  origem text not null default 'planilha',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.grupo_contatos (
  id uuid primary key default gen_random_uuid(),
  categoria text not null check (categoria in (
    'referencia_bancaria', 'referencia_comercial', 'referencia_pessoal',
    'fornecedor', 'destino_producao'
  )),
  nome text not null,
  cidade text,
  contato_nome text,
  agencia text,
  ordem integer not null default 0,
  origem text not null default 'planilha',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.passivo_por_instituicao (
  id uuid primary key default gen_random_uuid(),
  instituicao text not null unique,
  saldo_devedor numeric(16,2) not null default 0,
  origem text not null default 'planilha',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.produtividade_institucional (
  id uuid primary key default gen_random_uuid(),
  safra text not null,
  cultura_codigo text not null references public.produtos_agricolas(codigo) on delete restrict,
  produtividade_sc_ha numeric(10,2),
  origem text not null default 'planilha',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (safra, cultura_codigo)
);

drop trigger if exists patrimonio_bens_updated_at on public.patrimonio_bens;
create trigger patrimonio_bens_updated_at before update on public.patrimonio_bens
  for each row execute function public.update_updated_at_column();

drop trigger if exists grupo_contatos_updated_at on public.grupo_contatos;
create trigger grupo_contatos_updated_at before update on public.grupo_contatos
  for each row execute function public.update_updated_at_column();

drop trigger if exists passivo_por_instituicao_updated_at on public.passivo_por_instituicao;
create trigger passivo_por_instituicao_updated_at before update on public.passivo_por_instituicao
  for each row execute function public.update_updated_at_column();

drop trigger if exists produtividade_institucional_updated_at on public.produtividade_institucional;
create trigger produtividade_institucional_updated_at before update on public.produtividade_institucional
  for each row execute function public.update_updated_at_column();

grant select on public.patrimonio_bens to authenticated;
grant select on public.grupo_contatos to authenticated;
grant select on public.passivo_por_instituicao to authenticated;
grant select on public.produtividade_institucional to authenticated;
grant all on public.patrimonio_bens to service_role;
grant all on public.grupo_contatos to service_role;
grant all on public.passivo_por_instituicao to service_role;
grant all on public.produtividade_institucional to service_role;

alter table public.patrimonio_bens enable row level security;
alter table public.grupo_contatos enable row level security;
alter table public.passivo_por_instituicao enable row level security;
alter table public.produtividade_institucional enable row level security;

drop policy if exists "patrimonio_bens_select" on public.patrimonio_bens;
create policy "patrimonio_bens_select" on public.patrimonio_bens for select to authenticated using (true);
drop policy if exists "grupo_contatos_select" on public.grupo_contatos;
create policy "grupo_contatos_select" on public.grupo_contatos for select to authenticated using (true);
drop policy if exists "passivo_inst_select" on public.passivo_por_instituicao;
create policy "passivo_inst_select" on public.passivo_por_instituicao for select to authenticated using (true);
drop policy if exists "prod_inst_select" on public.produtividade_institucional;
create policy "prod_inst_select" on public.produtividade_institucional for select to authenticated using (true);
