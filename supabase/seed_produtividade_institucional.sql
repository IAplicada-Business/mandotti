-- aba Institucional (benchmarks produtividade)
insert into public.produtividade_institucional (safra, cultura_codigo, produtividade_sc_ha) values
  ('2025/26', 'soja', 60.0),
  ('2026/27', 'milho', 100.0),
  ('2024/25', 'soja', 69.0),
  ('2025/26', 'milho', 101.0),
  ('2023/24', 'soja', 62.0),
  ('2024/25', 'milho', 90.0)
on conflict (safra, cultura_codigo) do update set
  produtividade_sc_ha = excluded.produtividade_sc_ha, updated_at = now();
