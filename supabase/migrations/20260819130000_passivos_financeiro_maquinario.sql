-- Passivos (SCR), Financeiro MVP, Maquinário
-- Padrões: uuid PK, created_at/updated_at, soft delete, RLS, FK por emissores.id

-- ============ ENUMS ============
do $$ begin
  create type public.categoria_tipo as enum ('despesa','receita','folha','outros');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lancamento_tipo as enum ('despesa','receita','transferencia');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lancamento_origem as enum ('manual','xml','extrato','romaneio');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.xml_status as enum ('pendente','processado','erro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.movimento_tipo as enum ('credito','debito');
exception when duplicate_object then null; end $$;

-- ============ PASSIVOS ============
create table if not exists public.passivos (
  id uuid primary key default gen_random_uuid(),
  emissor_id uuid not null references public.emissores(id) on delete restrict,
  instituicao text not null,
  contrato_finalidade text not null,
  taxa_juros numeric(10,6),
  vencimento_final date,
  saldo_devedor numeric(16,2),
  ate_jun_2026 numeric(16,2) not null default 0,
  jul26_jun27 numeric(16,2) not null default 0,
  jul27_jun28 numeric(16,2) not null default 0,
  jul28_jun29 numeric(16,2) not null default 0,
  jul29_jun30 numeric(16,2) not null default 0,
  apos_jun_2030 numeric(16,2) not null default 0,
  sem_cronograma numeric(16,2) not null default 0,
  total_projetado numeric(16,2),
  origem text not null default 'planilha',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists passivos_emissor_idx on public.passivos (emissor_id) where deleted_at is null;
create index if not exists passivos_instituicao_idx on public.passivos (instituicao) where deleted_at is null;

-- ============ CATEGORIAS / PROPORÇÕES / LANÇAMENTOS ============
create table if not exists public.categorias_financeiras (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  tipo public.categoria_tipo not null default 'despesa',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.proporcoes_emissores (
  id uuid primary key default gen_random_uuid(),
  emissor_a_id uuid not null references public.emissores(id) on delete restrict,
  emissor_b_id uuid not null references public.emissores(id) on delete restrict,
  percentual_a numeric(5,2) not null default 50 check (percentual_a >= 0 and percentual_a <= 100),
  ativo boolean not null default true,
  vigente_desde date not null default current_date,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (emissor_a_id <> emissor_b_id)
);

create table if not exists public.extratos_bancarios (
  id uuid primary key default gen_random_uuid(),
  emissor_id uuid not null references public.emissores(id) on delete restrict,
  banco text not null default '',
  conta_mascara text,
  periodo_inicio date,
  periodo_fim date,
  nome_arquivo text not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  emissor_id uuid not null references public.emissores(id) on delete restrict,
  categoria_id uuid references public.categorias_financeiras(id) on delete set null,
  tipo public.lancamento_tipo not null default 'despesa',
  descricao text not null default '',
  valor numeric(16,2) not null check (valor >= 0),
  data_competencia date not null default current_date,
  data_pagamento date,
  origem public.lancamento_origem not null default 'manual',
  xml_chave text,
  fornecedor text,
  conciliado boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists lancamentos_emissor_idx on public.lancamentos (emissor_id) where deleted_at is null;
create index if not exists lancamentos_data_idx on public.lancamentos (data_competencia) where deleted_at is null;

create table if not exists public.xml_importacoes (
  id uuid primary key default gen_random_uuid(),
  emissor_id uuid not null references public.emissores(id) on delete restrict,
  nome_arquivo text not null,
  chave_nfe text,
  status public.xml_status not null default 'pendente',
  valor_total numeric(16,2),
  emitente text,
  categoria_sugerida text,
  payload_resumo jsonb,
  erro text,
  lancamento_id uuid references public.lancamentos(id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.extrato_movimentos (
  id uuid primary key default gen_random_uuid(),
  extrato_id uuid not null references public.extratos_bancarios(id) on delete cascade,
  data_movimento date not null,
  descricao text not null default '',
  valor numeric(16,2) not null,
  tipo public.movimento_tipo not null,
  conciliado boolean not null default false,
  lancamento_id uuid references public.lancamentos(id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists extrato_movimentos_extrato_idx on public.extrato_movimentos (extrato_id) where deleted_at is null;

-- ============ MAQUINÁRIOS ============
create table if not exists public.maquinarios (
  id uuid primary key default gen_random_uuid(),
  emissor_id uuid not null references public.emissores(id) on delete restrict,
  fazenda_id uuid references public.fazendas(id) on delete set null,
  nome text not null,
  categoria text not null default 'Outros',
  fazenda_nome text,
  marca text,
  modelo text,
  ano integer,
  valor_aquisicao numeric(16,2),
  cor text,
  chassi_serie text,
  ordem integer not null default 0,
  ativo boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists maquinarios_emissor_idx on public.maquinarios (emissor_id) where deleted_at is null;

-- ============ TRIGGERS ============
drop trigger if exists passivos_updated_at on public.passivos;
create trigger passivos_updated_at before update on public.passivos
  for each row execute function public.update_updated_at_column();

drop trigger if exists categorias_financeiras_updated_at on public.categorias_financeiras;
create trigger categorias_financeiras_updated_at before update on public.categorias_financeiras
  for each row execute function public.update_updated_at_column();

drop trigger if exists proporcoes_emissores_updated_at on public.proporcoes_emissores;
create trigger proporcoes_emissores_updated_at before update on public.proporcoes_emissores
  for each row execute function public.update_updated_at_column();

drop trigger if exists lancamentos_updated_at on public.lancamentos;
create trigger lancamentos_updated_at before update on public.lancamentos
  for each row execute function public.update_updated_at_column();

drop trigger if exists xml_importacoes_updated_at on public.xml_importacoes;
create trigger xml_importacoes_updated_at before update on public.xml_importacoes
  for each row execute function public.update_updated_at_column();

drop trigger if exists extratos_bancarios_updated_at on public.extratos_bancarios;
create trigger extratos_bancarios_updated_at before update on public.extratos_bancarios
  for each row execute function public.update_updated_at_column();

drop trigger if exists extrato_movimentos_updated_at on public.extrato_movimentos;
create trigger extrato_movimentos_updated_at before update on public.extrato_movimentos
  for each row execute function public.update_updated_at_column();

drop trigger if exists maquinarios_updated_at on public.maquinarios;
create trigger maquinarios_updated_at before update on public.maquinarios
  for each row execute function public.update_updated_at_column();

-- ============ GRANTS ============
grant select, insert, update, delete on public.passivos to authenticated;
grant select, insert, update, delete on public.categorias_financeiras to authenticated;
grant select, insert, update, delete on public.proporcoes_emissores to authenticated;
grant select, insert, update, delete on public.lancamentos to authenticated;
grant select, insert, update, delete on public.xml_importacoes to authenticated;
grant select, insert, update, delete on public.extratos_bancarios to authenticated;
grant select, insert, update, delete on public.extrato_movimentos to authenticated;
grant select, insert, update, delete on public.maquinarios to authenticated;

grant all on public.passivos to service_role;
grant all on public.categorias_financeiras to service_role;
grant all on public.proporcoes_emissores to service_role;
grant all on public.lancamentos to service_role;
grant all on public.xml_importacoes to service_role;
grant all on public.extratos_bancarios to service_role;
grant all on public.extrato_movimentos to service_role;
grant all on public.maquinarios to service_role;

-- ============ RLS ============
alter table public.passivos enable row level security;
alter table public.categorias_financeiras enable row level security;
alter table public.proporcoes_emissores enable row level security;
alter table public.lancamentos enable row level security;
alter table public.xml_importacoes enable row level security;
alter table public.extratos_bancarios enable row level security;
alter table public.extrato_movimentos enable row level security;
alter table public.maquinarios enable row level security;

-- Helpers already exist: pode_editar(uuid), is_admin if present — use pode_editar + authenticated select

drop policy if exists "passivos_select_autenticado" on public.passivos;
create policy "passivos_select_autenticado" on public.passivos for select to authenticated using (true);
drop policy if exists "passivos_insert_editor" on public.passivos;
create policy "passivos_insert_editor" on public.passivos for insert to authenticated with check (public.pode_editar(auth.uid()));
drop policy if exists "passivos_update_editor" on public.passivos;
create policy "passivos_update_editor" on public.passivos for update to authenticated using (public.pode_editar(auth.uid())) with check (public.pode_editar(auth.uid()));
drop policy if exists "passivos_delete_admin" on public.passivos;
create policy "passivos_delete_admin" on public.passivos for delete to authenticated using (public.has_role(auth.uid(),'administrador'));

drop policy if exists "categorias_select_autenticado" on public.categorias_financeiras;
create policy "categorias_select_autenticado" on public.categorias_financeiras for select to authenticated using (true);
drop policy if exists "categorias_write_editor" on public.categorias_financeiras;
create policy "categorias_write_editor" on public.categorias_financeiras for all to authenticated using (public.pode_editar(auth.uid())) with check (public.pode_editar(auth.uid()));

drop policy if exists "proporcoes_select_autenticado" on public.proporcoes_emissores;
create policy "proporcoes_select_autenticado" on public.proporcoes_emissores for select to authenticated using (true);
drop policy if exists "proporcoes_write_editor" on public.proporcoes_emissores;
create policy "proporcoes_write_editor" on public.proporcoes_emissores for all to authenticated using (public.pode_editar(auth.uid())) with check (public.pode_editar(auth.uid()));

drop policy if exists "lancamentos_select_autenticado" on public.lancamentos;
create policy "lancamentos_select_autenticado" on public.lancamentos for select to authenticated using (true);
drop policy if exists "lancamentos_insert_editor" on public.lancamentos;
create policy "lancamentos_insert_editor" on public.lancamentos for insert to authenticated with check (public.pode_editar(auth.uid()));
drop policy if exists "lancamentos_update_editor" on public.lancamentos;
create policy "lancamentos_update_editor" on public.lancamentos for update to authenticated using (public.pode_editar(auth.uid())) with check (public.pode_editar(auth.uid()));
drop policy if exists "lancamentos_delete_admin" on public.lancamentos;
create policy "lancamentos_delete_admin" on public.lancamentos for delete to authenticated using (public.has_role(auth.uid(),'administrador'));

drop policy if exists "xml_select_autenticado" on public.xml_importacoes;
create policy "xml_select_autenticado" on public.xml_importacoes for select to authenticated using (true);
drop policy if exists "xml_write_editor" on public.xml_importacoes;
create policy "xml_write_editor" on public.xml_importacoes for all to authenticated using (public.pode_editar(auth.uid())) with check (public.pode_editar(auth.uid()));

drop policy if exists "extratos_select_autenticado" on public.extratos_bancarios;
create policy "extratos_select_autenticado" on public.extratos_bancarios for select to authenticated using (true);
drop policy if exists "extratos_write_editor" on public.extratos_bancarios;
create policy "extratos_write_editor" on public.extratos_bancarios for all to authenticated using (public.pode_editar(auth.uid())) with check (public.pode_editar(auth.uid()));

drop policy if exists "extrato_mov_select_autenticado" on public.extrato_movimentos;
create policy "extrato_mov_select_autenticado" on public.extrato_movimentos for select to authenticated using (true);
drop policy if exists "extrato_mov_write_editor" on public.extrato_movimentos;
create policy "extrato_mov_write_editor" on public.extrato_movimentos for all to authenticated using (public.pode_editar(auth.uid())) with check (public.pode_editar(auth.uid()));

drop policy if exists "maquinarios_select_autenticado" on public.maquinarios;
create policy "maquinarios_select_autenticado" on public.maquinarios for select to authenticated using (true);
drop policy if exists "maquinarios_insert_editor" on public.maquinarios;
create policy "maquinarios_insert_editor" on public.maquinarios for insert to authenticated with check (public.pode_editar(auth.uid()));
drop policy if exists "maquinarios_update_editor" on public.maquinarios;
create policy "maquinarios_update_editor" on public.maquinarios for update to authenticated using (public.pode_editar(auth.uid())) with check (public.pode_editar(auth.uid()));
drop policy if exists "maquinarios_delete_admin" on public.maquinarios;
create policy "maquinarios_delete_admin" on public.maquinarios for delete to authenticated using (public.has_role(auth.uid(),'administrador'));
