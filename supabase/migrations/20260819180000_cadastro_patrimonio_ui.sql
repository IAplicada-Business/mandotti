-- Cadastro completo (emails, endereços) + campos comerciais para contratos/tradings

alter table public.grupo_contatos
  add column if not exists telefone text,
  add column if not exists email text,
  add column if not exists endereco text,
  add column if not exists uf text,
  add column if not exists cep text,
  add column if not exists cultura_codigo text references public.produtos_agricolas(codigo) on delete set null,
  add column if not exists safra text,
  add column if not exists volume_sc numeric(14,2),
  add column if not exists preco_saca numeric(14,2),
  add column if not exists status text not null default 'cadastrado';

create table if not exists public.cadastro_pessoas (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('titular', 'conjuge', 'correspondencia')),
  nome text not null,
  email text,
  telefone text,
  endereco text,
  cep text,
  cidade text,
  uf text,
  profissao text,
  data_nascimento date,
  sexo text,
  dependentes integer,
  tempo_residencia text,
  tipo_residencia text,
  ordem integer not null default 0,
  origem text not null default 'planilha',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists cadastro_pessoas_updated_at on public.cadastro_pessoas;
create trigger cadastro_pessoas_updated_at before update on public.cadastro_pessoas
  for each row execute function public.update_updated_at_column();

grant select on public.cadastro_pessoas to authenticated;
grant all on public.cadastro_pessoas to service_role;

alter table public.cadastro_pessoas enable row level security;

drop policy if exists "cadastro_pessoas_select" on public.cadastro_pessoas;
create policy "cadastro_pessoas_select" on public.cadastro_pessoas for select to authenticated using (true);
