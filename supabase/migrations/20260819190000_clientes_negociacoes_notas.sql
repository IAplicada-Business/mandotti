-- Clientes/compradores, negociações comerciais e estrutura de notas fiscais

do $$ begin
  create type public.negociacao_status as enum (
    'cadastrado', 'negociando', 'firmado', 'entregue', 'pagamento_validado', 'faturado'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.nota_fiscal_status as enum ('pendente', 'emitida', 'cancelada');
exception when duplicate_object then null; end $$;

-- Compradores = destinos da produção já em grupo_contatos; status comercial
update public.grupo_contatos
set status = 'ativo'
where categoria = 'destino_producao' and status = 'cadastrado';

create table if not exists public.negociacoes_comerciais (
  id uuid primary key default gen_random_uuid(),
  comprador_id uuid not null references public.grupo_contatos(id) on delete restrict,
  emissor_id uuid references public.emissores(id) on delete set null,
  cultura_codigo text not null references public.produtos_agricolas(codigo) on delete restrict,
  safra text not null,
  volume_sc numeric(14,2),
  preco_saca numeric(14,2),
  status public.negociacao_status not null default 'negociando',
  observacoes text,
  origem text not null default 'planilha',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists negociacoes_comprador_idx on public.negociacoes_comerciais (comprador_id)
  where deleted_at is null;
create index if not exists negociacoes_safra_idx on public.negociacoes_comerciais (safra)
  where deleted_at is null;

create table if not exists public.notas_fiscais (
  id uuid primary key default gen_random_uuid(),
  negociacao_id uuid references public.negociacoes_comerciais(id) on delete set null,
  emissor_id uuid not null references public.emissores(id) on delete restrict,
  comprador_id uuid not null references public.grupo_contatos(id) on delete restrict,
  numero text,
  serie text,
  chave_acesso text,
  valor numeric(16,2),
  cultura_codigo text references public.produtos_agricolas(codigo) on delete set null,
  volume_sc numeric(14,2),
  status public.nota_fiscal_status not null default 'pendente',
  data_emissao date,
  observacoes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notas_fiscais_comprador_idx on public.notas_fiscais (comprador_id)
  where deleted_at is null;
create index if not exists notas_fiscais_negociacao_idx on public.notas_fiscais (negociacao_id)
  where deleted_at is null;

drop trigger if exists negociacoes_comerciais_updated_at on public.negociacoes_comerciais;
create trigger negociacoes_comerciais_updated_at before update on public.negociacoes_comerciais
  for each row execute function public.update_updated_at_column();

drop trigger if exists notas_fiscais_updated_at on public.notas_fiscais;
create trigger notas_fiscais_updated_at before update on public.notas_fiscais
  for each row execute function public.update_updated_at_column();

grant select on public.negociacoes_comerciais to authenticated;
grant select, insert, update on public.negociacoes_comerciais to authenticated;
grant select on public.notas_fiscais to authenticated;
grant select, insert, update on public.notas_fiscais to authenticated;
grant all on public.negociacoes_comerciais to service_role;
grant all on public.notas_fiscais to service_role;

alter table public.negociacoes_comerciais enable row level security;
alter table public.notas_fiscais enable row level security;

drop policy if exists "negociacoes_select" on public.negociacoes_comerciais;
create policy "negociacoes_select" on public.negociacoes_comerciais
  for select to authenticated using (deleted_at is null);

drop policy if exists "negociacoes_write_editor" on public.negociacoes_comerciais;
create policy "negociacoes_write_editor" on public.negociacoes_comerciais
  for all to authenticated
  using (public.pode_editar(auth.uid()))
  with check (public.pode_editar(auth.uid()));

drop policy if exists "notas_select" on public.notas_fiscais;
create policy "notas_select" on public.notas_fiscais
  for select to authenticated using (deleted_at is null);

drop policy if exists "notas_write_editor" on public.notas_fiscais;
create policy "notas_write_editor" on public.notas_fiscais
  for all to authenticated
  using (public.pode_editar(auth.uid()))
  with check (public.pode_editar(auth.uid()));
