-- Biblioteca de documentos por fazenda (CCIR, ITR, arrendamento, etc.)

create table if not exists public.documentos (
  id uuid primary key default gen_random_uuid(),
  fazenda_id uuid references public.fazendas(id) on delete restrict,
  tipo text not null default 'outros',
  titulo text not null,
  nome_arquivo text,
  storage_path text not null,
  mime_type text,
  tamanho_bytes bigint,
  vencimento date,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists documentos_fazenda_idx on public.documentos (fazenda_id)
  where deleted_at is null;
create index if not exists documentos_tipo_idx on public.documentos (tipo)
  where deleted_at is null;
create index if not exists documentos_vencimento_idx on public.documentos (vencimento)
  where deleted_at is null;

drop trigger if exists documentos_updated_at on public.documentos;
create trigger documentos_updated_at before update on public.documentos
  for each row execute function public.update_updated_at_column();

grant select, insert, update, delete on public.documentos to authenticated;
grant all on public.documentos to service_role;

alter table public.documentos enable row level security;

drop policy if exists "documentos_select_autenticado" on public.documentos;
create policy "documentos_select_autenticado" on public.documentos
  for select to authenticated using (true);

drop policy if exists "documentos_write_editor" on public.documentos;
create policy "documentos_write_editor" on public.documentos
  for all to authenticated
  using (public.pode_editar(auth.uid()))
  with check (public.pode_editar(auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit)
values ('documentos', 'documentos', false, 20971520)
on conflict (id) do nothing;

drop policy if exists "documentos_storage_select" on storage.objects;
create policy "documentos_storage_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'documentos');

drop policy if exists "documentos_storage_insert" on storage.objects;
create policy "documentos_storage_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documentos' and public.pode_editar(auth.uid()));

drop policy if exists "documentos_storage_update" on storage.objects;
create policy "documentos_storage_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'documentos' and public.pode_editar(auth.uid()))
  with check (bucket_id = 'documentos' and public.pode_editar(auth.uid()));

drop policy if exists "documentos_storage_delete" on storage.objects;
create policy "documentos_storage_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'documentos' and public.pode_editar(auth.uid()));
