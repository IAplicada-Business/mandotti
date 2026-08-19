-- aba Dados Cadastrais (referências, fornecedores, destinos)
delete from public.grupo_contatos where origem = 'planilha';
insert into public.grupo_contatos (categoria, nome, cidade, contato_nome, agencia, ordem) values
  ('referencia_comercial', 'MAQCAMPO JOHN DEERE', null, null, null, 1),
  ('referencia_comercial', 'AUTO POSTO MENEGUETTI', null, null, null, 2),
  ('referencia_comercial', 'TRR GRUPO DECIO', null, null, null, 3),
  ('referencia_pessoal', 'FABIANO FIGUEIRA', null, null, null, 4),
  ('fornecedor', 'SYNGENTA PROT. E CULTIVOS', null, null, null, 5),
  ('fornecedor', 'ADM', null, null, null, 6),
  ('destino_producao', 'ADM', null, null, null, 7),
  ('destino_producao', 'AGRONORTE', null, null, null, 8),
  ('destino_producao', 'ADM', null, null, null, 9)
;
