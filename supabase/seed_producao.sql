-- Carga: aba Dados Operacionais
-- Gerado por scripts/import_ficha_cadastral.py

insert into public.producao_grupo_safra (
  safra, cultura_codigo, area_plantio_ha, produtividade_sc_ha,
  preco_saca, custo_saca, tipo, ciclo
) values
  ('2023/24', 'soja', 2800.0, 66.0, 120.0, 3950.0, 'realizado', 'safra'),
  ('2024/25', 'soja', 4000.0, 63.0, 115.0, 3980.0, 'realizado', 'safra'),
  ('2025/26', 'soja', 3000.0, 63.0, 105.0, 4200.0, 'realizado', 'safra'),
  ('2026/27', 'soja', 4600.0, null, null, null, 'projecao', 'safra'),
  ('2027/28', 'soja', 5700.0, null, null, null, 'projecao', 'safra'),
  ('2028/29', 'soja', 6000.0, null, null, null, 'projecao', 'safra'),
  ('2029/30', 'soja', 7000.0, null, null, null, 'projecao', 'safra'),
  ('2023/24', 'milho', 2800.0, 89.0, 56.5, 2800.0, 'realizado', 'safra'),
  ('2024/25', 'milho', 3000.0, 93.0, 55.0, 2450.0, 'realizado', 'safra'),
  ('2025/26', 'milho', 2500.0, 91.0, 65.0, 2450.0, 'realizado', 'safra'),
  ('2026/27', 'milho', 2500.0, 100.0, 50.0, 3200.0, 'realizado', 'safra'),
  ('2027/28', 'milho', 3200.0, null, null, null, 'projecao', 'safra'),
  ('2027/28', 'sorgo', 2000.0, null, null, null, 'projecao', 'safra'),
  ('2026/27', 'milho', 500.0, null, null, null, 'projecao', 'safrinha'),
  ('2027/28', 'milho', 650.0, null, null, null, 'projecao', 'safrinha')
on conflict (safra, cultura_codigo, tipo, ciclo) do update set
  area_plantio_ha = excluded.area_plantio_ha,
  produtividade_sc_ha = excluded.produtividade_sc_ha,
  preco_saca = excluded.preco_saca,
  custo_saca = excluded.custo_saca,
  updated_at = now();

insert into public.producao_fazenda_safra (
  fazenda_id, safra, cultura_codigo, area_plantio_ha,
  produtividade_sc_ha, matricula
) values
  ('b0000001-0000-4000-8000-000000000004'::uuid, '2026/27', 'soja', 450.0, 59.0, '2072'),
  ('b0000001-0000-4000-8000-000000000003'::uuid, '2026/27', 'soja', 450.0, 68.0, '2417'),
  ('b0000001-0000-4000-8000-000000000005'::uuid, '2026/27', 'soja', 400.0, 70.0, '167'),
  ('b0000001-0000-4000-8000-000000000006'::uuid, '2026/27', 'soja', 60.0, 75.0, null),
  ('b0000001-0000-4000-8000-000000000008'::uuid, '2026/27', 'soja', 70.0, 68.0, '6614'),
  ('b0000001-0000-4000-8000-000000000002'::uuid, '2026/27', 'soja', 1700.0, 70.0, '3843'),
  ('b0000001-0000-4000-8000-000000000001'::uuid, '2026/27', 'soja', 1430.0, 60.0, '8714'),
  ('b0000001-0000-4000-8000-000000000010'::uuid, '2026/27', 'milho', 500.0, null, null),
  ('b0000001-0000-4000-8000-000000000002'::uuid, '2027/28', 'milho', 1700.0, null, '3843'),
  ('b0000001-0000-4000-8000-000000000005'::uuid, '2027/28', 'milho', 400.0, null, '167'),
  ('b0000001-0000-4000-8000-000000000003'::uuid, '2027/28', 'milho', 450.0, null, '2417'),
  ('b0000001-0000-4000-8000-000000000009'::uuid, '2027/28', 'milho', 650.0, null, '1110'),
  ('b0000001-0000-4000-8000-000000000004'::uuid, '2027/28', 'sorgo', 450.0, null, '2072'),
  ('b0000001-0000-4000-8000-000000000001'::uuid, '2027/28', 'sorgo', 1430.0, null, '8714'),
  ('b0000001-0000-4000-8000-000000000006'::uuid, '2027/28', 'sorgo', 60.0, null, null),
  ('b0000001-0000-4000-8000-000000000004'::uuid, '2027/28', 'soja', 450.0, null, '2072'),
  ('b0000001-0000-4000-8000-000000000003'::uuid, '2027/28', 'soja', 450.0, null, '2417'),
  ('b0000001-0000-4000-8000-000000000005'::uuid, '2027/28', 'soja', 400.0, null, '167'),
  ('b0000001-0000-4000-8000-000000000006'::uuid, '2027/28', 'soja', 60.0, null, null),
  ('b0000001-0000-4000-8000-000000000008'::uuid, '2027/28', 'soja', 70.0, null, '6614'),
  ('b0000001-0000-4000-8000-000000000002'::uuid, '2027/28', 'soja', 1700.0, null, '3843'),
  ('b0000001-0000-4000-8000-000000000001'::uuid, '2027/28', 'soja', 1430.0, null, '8714'),
  ('b0000001-0000-4000-8000-000000000010'::uuid, '2027/28', 'soja', 500.0, null, null),
  ('b0000001-0000-4000-8000-000000000009'::uuid, '2027/28', 'soja', 650.0, null, '1110')
on conflict (fazenda_id, safra, cultura_codigo) do update set
  area_plantio_ha = excluded.area_plantio_ha,
  produtividade_sc_ha = excluded.produtividade_sc_ha,
  matricula = excluded.matricula,
  updated_at = now();
