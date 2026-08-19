-- Negociações iniciais: compradores da planilha × culturas/safras da produção
-- Preços de referência da última safra realizada (2025/26)

insert into public.negociacoes_comerciais (
  comprador_id, emissor_id, cultura_codigo, safra, volume_sc, preco_saca, status, observacoes, origem
)
select
  gc.id,
  'a0000000-0000-4000-8000-000000000001'::uuid,
  v.cultura,
  v.safra,
  v.volume_sc,
  v.preco_saca,
  v.status::public.negociacao_status,
  v.obs,
  'planilha'
from (values
  ('ADM', 'PALMAS', 'soja', '2026/27', null::numeric, 105.0, 'negociando', 'Destino da produção — safra 26/27'),
  ('ADM', 'PALMAS', 'milho', '2026/27', null, 50.0, 'negociando', 'Destino da produção — safra 26/27'),
  ('AGRONORTE', 'PEDRO AFONSO -  TO', 'soja', '2026/27', null, 105.0, 'cadastrado', 'Trading Pedro Afonso'),
  ('ADM', 'PALMAS', 'soja', '2027/28', null, 105.0, 'cadastrado', 'Projeção safra 27/28'),
  ('AGRONORTE', 'PEDRO AFONSO -  TO', 'sorgo', '2027/28', null, null, 'cadastrado', 'Projeção sorgo 27/28')
) as v(nome, cidade, cultura, safra, volume_sc, preco_saca, status, obs)
join public.grupo_contatos gc
  on gc.categoria = 'destino_producao'
 and gc.nome = v.nome
 and coalesce(gc.cidade, '') = v.cidade
where not exists (
  select 1 from public.negociacoes_comerciais n
  where n.deleted_at is null and n.origem = 'planilha'
  limit 1
);
