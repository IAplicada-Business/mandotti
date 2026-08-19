-- aba Dados Cadastrais (referências, fornecedores, destinos)
delete from public.grupo_contatos where origem = 'planilha';
insert into public.grupo_contatos (categoria, nome, cidade, contato_nome, agencia, email, telefone, endereco, ordem) values
  ('referencia_bancaria', 'BRASIL', null, 'MARCELO', '1595', null, null, null, 1),
  ('referencia_bancaria', 'BRASIL', null, 'GUSTAVO', '1595', null, null, null, 2),
  ('referencia_comercial', 'MAQCAMPO JOHN DEERE', null, null, null, null, null, null, 3),
  ('referencia_comercial', 'AUTO POSTO MENEGUETTI', null, null, null, null, null, null, 4),
  ('referencia_comercial', 'TRR GRUPO DECIO', null, null, null, null, null, null, 5),
  ('referencia_pessoal', 'FABIANO FIGUEIRA', null, null, null, null, null, null, 6),
  ('fornecedor', 'SYNGENTA PROT. E CULTIVOS', 'PALMAS / TO', null, null, null, null, null, 7),
  ('fornecedor', 'ADM', 'PALMAS / TO', null, null, null, null, null, 8),
  ('destino_producao', 'ADM', 'PALMAS', null, null, null, null, null, 9),
  ('destino_producao', 'AGRONORTE', 'PEDRO AFONSO -  TO', null, null, null, null, null, 10),
  ('destino_producao', 'ADM', 'PALMAS', null, null, null, null, null, 11)
;
