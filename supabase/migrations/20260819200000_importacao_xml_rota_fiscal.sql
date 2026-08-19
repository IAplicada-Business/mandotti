-- Migra permissões das rotas legadas para as novas rotas planas.
UPDATE public.perfis_acesso
SET rota = '/importacao-xml'
WHERE rota = '/financeiro/xml';

UPDATE public.perfis_acesso
SET rota = '/conciliacao'
WHERE rota = '/financeiro/conciliacao';

-- Funcionários com acesso ao financeiro também enxergam importação fiscal (leitura).
INSERT INTO public.perfis_acesso (user_id, rota, pode_ver, pode_editar)
SELECT pa.user_id, '/importacao-xml', pa.pode_ver, pa.pode_editar
FROM public.perfis_acesso pa
WHERE pa.rota = '/financeiro'
  AND pa.pode_ver = true
  AND NOT EXISTS (
    SELECT 1
    FROM public.perfis_acesso x
    WHERE x.user_id = pa.user_id AND x.rota = '/importacao-xml'
  );

INSERT INTO public.perfis_acesso (user_id, rota, pode_ver, pode_editar)
SELECT pa.user_id, '/conciliacao', pa.pode_ver, pa.pode_editar
FROM public.perfis_acesso pa
WHERE pa.rota = '/financeiro'
  AND pa.pode_ver = true
  AND NOT EXISTS (
    SELECT 1
    FROM public.perfis_acesso x
    WHERE x.user_id = pa.user_id AND x.rota = '/conciliacao'
  );
