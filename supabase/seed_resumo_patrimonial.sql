-- Carga: aba Resumo Executivo
-- Gerado por scripts/import_ficha_cadastral.py

insert into public.resumo_patrimonial (
  id, participacoes_societarias, imoveis, maquinarios_veiculos, animais,
  outros_bens, patrimonio_total, passivo_total, patrimonio_liquido,
  endividamento_pct, total_projetado_juros, passivo_eder, passivo_nagyla, referencia
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
  '2026-08-19'::date
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
  updated_at = now();
