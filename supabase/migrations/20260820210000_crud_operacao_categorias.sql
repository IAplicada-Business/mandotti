-- Libera cadastro/edição nas tabelas que o MVP importou só para leitura.
-- Também cria baixa manual de passivo e a categoria "Outros" combinada na call.

grant select, insert, update, delete on public.producao_grupo_safra to authenticated;
grant select, insert, update, delete on public.producao_fazenda_safra to authenticated;
grant select, insert, update, delete on public.produtos_agricolas to authenticated;
grant select, insert, update, delete on public.grupo_contatos to authenticated;

drop policy if exists "producao_grupo_write_editor" on public.producao_grupo_safra;
create policy "producao_grupo_write_editor" on public.producao_grupo_safra
  for all to authenticated
  using (public.pode_editar(auth.uid()))
  with check (public.pode_editar(auth.uid()));

drop policy if exists "producao_fazenda_write_editor" on public.producao_fazenda_safra;
create policy "producao_fazenda_write_editor" on public.producao_fazenda_safra
  for all to authenticated
  using (public.pode_editar(auth.uid()))
  with check (public.pode_editar(auth.uid()));

drop policy if exists "produtos_agricolas_write_editor" on public.produtos_agricolas;
create policy "produtos_agricolas_write_editor" on public.produtos_agricolas
  for all to authenticated
  using (public.pode_editar(auth.uid()))
  with check (public.pode_editar(auth.uid()));

drop policy if exists "grupo_contatos_write_editor" on public.grupo_contatos;
create policy "grupo_contatos_write_editor" on public.grupo_contatos
  for all to authenticated
  using (public.pode_editar(auth.uid()))
  with check (public.pode_editar(auth.uid()));

alter table public.passivos
  add column if not exists status text not null default 'aberto',
  add column if not exists pago_em date;

update public.passivos
set status = 'aberto'
where status is null or status = '';

insert into public.categorias_financeiras (codigo, nome, tipo, ativo)
values ('outros', 'Outros', 'outros', true)
on conflict (codigo) do nothing;
