-- Carga: aba Resumo Executivo
-- Gerado por scripts/import_ficha_cadastral.py

insert into public.resumo_patrimonial (
  id, participacoes_societarias, imoveis, maquinarios_veiculos, animais,
  outros_bens, patrimonio_total, passivo_total, patrimonio_liquido,
  endividamento_pct, total_projetado_juros, passivo_eder, passivo_nagyla, referencia,
  cronograma_ate_jun26, cronograma_jul26_jun27, cronograma_jul27_jun28,
  cronograma_jul28_jun29, cronograma_jul29_jun30, cronograma_apos_jun30
) values (
  'd0000000-0000-4000-8000-000000000001'::uuid,
  350000.0,
  123480000.0,
  35745818.18,
  2500000.0,
  0.0,
  162075818.2,
  54446867.11,
  107628951.1,
  0.3359345504,
  72612611.61,
  33323572.46,
  21123294.65,
  '2026-08-19'::date,
  4032029.111,
  14359265.57,
  13435210.27,
  8730023.776,
  10016133.97,
  22039948.91
)
on conflict (id) do update set
  participacoes_societarias = excluded.participacoes_societarias,
  imoveis = excluded.imoveis,
  maquinarios_veiculos = excluded.maquinarios_veiculos,
  animais = excluded.animais,
  outros_bens = excluded.outros_bens,
  patrimonio_total = excluded.patrimonio_total,
  passivo_total = excluded.passivo_total,
  patrimonio_liquido = excluded.patrimonio_liquido,
  endividamento_pct = excluded.endividamento_pct,
  total_projetado_juros = excluded.total_projetado_juros,
  passivo_eder = excluded.passivo_eder,
  passivo_nagyla = excluded.passivo_nagyla,
  referencia = excluded.referencia,
  cronograma_ate_jun26 = excluded.cronograma_ate_jun26,
  cronograma_jul26_jun27 = excluded.cronograma_jul26_jun27,
  cronograma_jul27_jun28 = excluded.cronograma_jul27_jun28,
  cronograma_jul28_jun29 = excluded.cronograma_jul28_jun29,
  cronograma_jul29_jun30 = excluded.cronograma_jul29_jun30,
  cronograma_apos_jun30 = excluded.cronograma_apos_jun30,
  updated_at = now();

-- passivo por instituição (Resumo Executivo)
insert into public.passivo_por_instituicao (instituicao, saldo_devedor) values
  ('Banco Do Brasil', 45872009.53),
  ('Banco John Deere', 5023116.48),
  ('Bradesco', 3387298.33),
  ('Banco Da Amazônia', 164442.77)
on conflict (instituicao) do update set saldo_devedor = excluded.saldo_devedor, updated_at = now();
