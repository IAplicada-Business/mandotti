-- aba Dados Cadastrais (dados pessoais)
delete from public.cadastro_pessoas where origem = 'planilha';
insert into public.cadastro_pessoas (tipo, nome, email, telefone, endereco, cep, cidade, uf, profissao, data_nascimento, sexo, tempo_residencia, tipo_residencia, ordem) values
  ('titular', 'EDER CARLOS MANDOTTI', 'eder.mandotti@gmail.com', null, 'Rua 06, nº 283', '77.710-000', 'Pedro Afonso', 'TO', 'AGRICULTOR', '1979-12-10'::date, 'M', '15 anos', 'PRÓPRIA', 1),
  ('conjuge', 'NAGYLA POLLYANNA FERREIR CRUZ', null, null, null, null, null, null, 'AGRICULTORA', '1995-01-10'::date, null, null, null, 2),
  ('correspondencia', 'Correspondência / cobranças', 'nagyla_pollyanna@hotmail.com', null, 'Rua 06, nº 283', '77.710-000', 'Pedro Afonso', 'TO', null, null, null, null, null, 3)
;
