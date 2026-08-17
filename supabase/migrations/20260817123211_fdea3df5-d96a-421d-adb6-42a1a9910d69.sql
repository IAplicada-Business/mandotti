-- ============ ENUMS ============
create type public.app_role as enum ('administrador','gestor','operador','visualizador');
create type public.tipo_certificado as enum ('A1','A3');

-- ============ FUNÇÕES UTILITÁRIAS ============
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============ PERFIS ============
create table public.perfis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  nome text not null default '',
  email text,
  telefone text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.perfis to authenticated;
grant all on public.perfis to service_role;
alter table public.perfis enable row level security;

-- ============ PAPEIS ============
create table public.papeis_usuario (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.papeis_usuario to authenticated;
grant all on public.papeis_usuario to service_role;
alter table public.papeis_usuario enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.papeis_usuario
    where user_id = _user_id and role = _role
  )
$$;

create or replace function public.pode_editar(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.papeis_usuario
    where user_id = _user_id and role in ('administrador','gestor')
  )
$$;

-- Políticas perfis
create policy "perfis_select_proprio_ou_admin" on public.perfis
  for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(),'administrador'));
create policy "perfis_update_proprio_ou_admin" on public.perfis
  for update to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(),'administrador'))
  with check (auth.uid() = user_id or public.has_role(auth.uid(),'administrador'));
create policy "perfis_insert_proprio" on public.perfis
  for insert to authenticated
  with check (auth.uid() = user_id);

-- Políticas papeis
create policy "papeis_select_proprio_ou_admin" on public.papeis_usuario
  for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(),'administrador'));
create policy "papeis_admin_all" on public.papeis_usuario
  for all to authenticated
  using (public.has_role(auth.uid(),'administrador'))
  with check (public.has_role(auth.uid(),'administrador'));

-- ============ EMISSORES ============
create table public.emissores (
  id uuid primary key default gen_random_uuid(),
  razao_social text not null,
  nome_fantasia text,
  cnpj text not null,
  inscricao_estadual text,
  endereco text,
  cidade text,
  uf text,
  cep text,
  telefone text,
  email text,
  ativo boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index emissores_cnpj_unico on public.emissores (cnpj) where deleted_at is null;

grant select, insert, update, delete on public.emissores to authenticated;
grant all on public.emissores to service_role;
alter table public.emissores enable row level security;

create policy "emissores_select_autenticado" on public.emissores
  for select to authenticated using (true);
create policy "emissores_insert_editor" on public.emissores
  for insert to authenticated with check (public.pode_editar(auth.uid()));
create policy "emissores_update_editor" on public.emissores
  for update to authenticated
  using (public.pode_editar(auth.uid()))
  with check (public.pode_editar(auth.uid()));
create policy "emissores_delete_admin" on public.emissores
  for delete to authenticated using (public.has_role(auth.uid(),'administrador'));

-- ============ FAZENDAS ============
create table public.fazendas (
  id uuid primary key default gen_random_uuid(),
  emissor_id uuid not null references public.emissores(id) on delete restrict,
  nome text not null,
  codigo text,
  inscricao_estadual text,
  car text,
  area_hectares numeric(12,2),
  municipio text,
  uf text,
  ativo boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index fazendas_emissor_idx on public.fazendas (emissor_id);

grant select, insert, update, delete on public.fazendas to authenticated;
grant all on public.fazendas to service_role;
alter table public.fazendas enable row level security;

create policy "fazendas_select_autenticado" on public.fazendas
  for select to authenticated using (true);
create policy "fazendas_insert_editor" on public.fazendas
  for insert to authenticated with check (public.pode_editar(auth.uid()));
create policy "fazendas_update_editor" on public.fazendas
  for update to authenticated
  using (public.pode_editar(auth.uid()))
  with check (public.pode_editar(auth.uid()));
create policy "fazendas_delete_admin" on public.fazendas
  for delete to authenticated using (public.has_role(auth.uid(),'administrador'));

-- ============ CERTIFICADOS ============
create table public.certificados (
  id uuid primary key default gen_random_uuid(),
  emissor_id uuid not null references public.emissores(id) on delete restrict,
  nome text not null,
  tipo tipo_certificado not null default 'A1',
  titular text,
  cnpj text,
  validade date,
  senha_referencia text,
  ativo boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index certificados_emissor_idx on public.certificados (emissor_id);

grant select, insert, update, delete on public.certificados to authenticated;
grant all on public.certificados to service_role;
alter table public.certificados enable row level security;

create policy "certificados_select_autenticado" on public.certificados
  for select to authenticated using (true);
create policy "certificados_insert_editor" on public.certificados
  for insert to authenticated with check (public.pode_editar(auth.uid()));
create policy "certificados_update_editor" on public.certificados
  for update to authenticated
  using (public.pode_editar(auth.uid()))
  with check (public.pode_editar(auth.uid()));
create policy "certificados_delete_admin" on public.certificados
  for delete to authenticated using (public.has_role(auth.uid(),'administrador'));

-- ============ TRIGGERS updated_at ============
create trigger perfis_updated_at before update on public.perfis
  for each row execute function public.update_updated_at_column();
create trigger emissores_updated_at before update on public.emissores
  for each row execute function public.update_updated_at_column();
create trigger fazendas_updated_at before update on public.fazendas
  for each row execute function public.update_updated_at_column();
create trigger certificados_updated_at before update on public.certificados
  for each row execute function public.update_updated_at_column();

-- ============ NOVO USUÁRIO ============
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (user_id, nome, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.raw_user_meta_data->>'full_name', ''), new.email)
  on conflict (user_id) do nothing;

  insert into public.papeis_usuario (user_id, role)
  values (new.id, 'visualizador')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();