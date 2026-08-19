-- aba Dados Patrimoniais
delete from public.patrimonio_bens where origem = 'planilha';
insert into public.patrimonio_bens (tipo, descricao, municipio, ordem) values
  ('participacao', 'MANDOTTI SERVICOS AGRICOLAS', null, 1),
  ('participacao', 'MANDOTTI SERVICOS AGRICOLAS NAGYLA', null, 2),
  ('participacao', 'NAGYLA P. F. CRUZ', null, 3),
  ('imovel', 'Gleba de Terra - Caseara + 2 km está dentro da propriedade', 'Pedro afonso', 4),
  ('imovel', 'Gleba de Terra - Tupirama', null, 5),
  ('imovel', 'Gleba de Terra - Tupirama', null, 6),
  ('imovel', 'Gleba de Terra - Tupirama', null, 7),
  ('imovel', 'Gleba de Terra - Tupirama', null, 8),
  ('imovel', 'Gleba de Terra - Tupirama', null, 9),
  ('imovel', 'Chacara Lajeado - Tocanitns', null, 10),
  ('imovel', '1 - Imovel Residencial  - Toledo - PR', null, 11),
  ('imovel', '1 - Imovel Residencial  - Guarai - TO', null, 12),
  ('imovel', '1 - Imovel Residencial  - Guarai - TO', null, 13),
  ('imovel', '1 - Imovel Residencial  - Guarai - TO', null, 14),
  ('imovel', '4 - lotes urbanos - Guarai - TO', null, 15),
  ('imovel', 'Gleba de Terra -  Santa Maria TO', null, 16),
  ('imovel', 'Gleba de Terra -  Santa Maria TO', null, 17),
  ('imovel', 'Gleba de Terra -  Santa Maria TO', null, 18)
;
