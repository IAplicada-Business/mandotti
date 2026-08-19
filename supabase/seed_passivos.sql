insert into public.passivos (
  emissor_id, instituicao, contrato_finalidade, taxa_juros, vencimento_final, saldo_devedor,
  ate_jun_2026, jul26_jun27, jul27_jun28, jul28_jun29, jul29_jun30, apos_jun_2030, sem_cronograma,
  total_projetado, origem
)
select * from (values
('a0000000-0000-4000-8000-000000000001'::uuid,'Bradesco','Caminhões | Ref. 20200009081-1',0.07,'2028-01-17'::date,61147.24,0,0,61147.24,0,0,0,0,61147.24,'planilha'),
('a0000000-0000-4000-8000-000000000001'::uuid,'Bradesco','Carretas/Vagões | Ref. 20201599313-1',0.0305,'2027-12-15'::date,143878.87,0,0,143878.87,0,0,0,0,143878.87,'planilha'),
('a0000000-0000-4000-8000-000000000001'::uuid,'Banco Da Amazônia','Caminhões | Ref. 20201688453-1',0.0448,'2029-01-10'::date,164442.77,0,0,0,164442.77,0,0,0,164442.77,'planilha'),
('a0000000-0000-4000-8000-000000000001'::uuid,'Banco Do Brasil','Reboques/Semirreboques | Ref. 20211503902-1',0.0995,'2027-04-28'::date,47142.29,0,27144.71358,0,0,0,0,0,27144.71358,'planilha'),
('a0000000-0000-4000-8000-000000000001'::uuid,'Banco Do Brasil','Máquinas e implementos | Ref. 20211784959-1',0.105,'2028-11-15'::date,99005.15,0,31571.94598,31571.94598,31571.94598,0,0,0,94715.83793,'planilha'),
('a0000000-0000-4000-8000-000000000001'::uuid,'Banco Do Brasil','Máquinas e implementos | Ref. 20220774867-1',0.2075,'2027-06-28'::date,96183.31,0,63529.18518,0,0,0,0,0,63529.18518,'planilha'),
('a0000000-0000-4000-8000-000000000001'::uuid,'Banco John Deere','Máquinas/Implementos | Ref. 20221229861-1',0.125,'2028-05-15'::date,640799.98,0,0,640799.98,0,0,0,0,640799.98,'planilha'),
('a0000000-0000-4000-8000-000000000001'::uuid,'Banco John Deere','Máquinas/Implementos | Ref. 20221450496-1',0.085,'2028-05-15'::date,857252.21,0,0,857252.21,0,0,0,0,857252.21,'planilha'),
('a0000000-0000-4000-8000-000000000001'::uuid,'Banco John Deere','Trator | Ref. 20221450496-2',0.085,'2028-05-15'::date,696762.07,0,0,696762.07,0,0,0,0,696762.07,'planilha'),
('a0000000-0000-4000-8000-000000000001'::uuid,'Banco John Deere','Colheitadeira | Ref. 20221935245-1',0.0875,'2028-05-15'::date,283975.29,0,0,283975.29,0,0,0,0,283975.29,'planilha'),
('a0000000-0000-4000-8000-000000000001'::uuid,'Banco John Deere','Colheitadeira | Ref. 20221935245-2',0.0875,'2028-05-15'::date,809462.33,0,0,809462.33,0,0,0,0,809462.33,'planilha'),
('a0000000-0000-4000-8000-000000000001'::uuid,'Banco John Deere','Máquinas/Implementos | Ref. 20231224795-1',0.125,'2030-05-15'::date,1098514.24,0,0,0,0,1098514.24,0,0,1098514.24,'planilha'),
('a0000000-0000-4000-8000-000000000001'::uuid,'Banco Do Brasil','Renegociação | Ref. 20251650128-1',0.11,'2034-06-20'::date,24927676.97,0,4501979.949,4501979.949,4501979.949,4501979.949,18007919.8,0,36015839.6,'planilha'),
('a0000000-0000-4000-8000-000000000001'::uuid,'Bradesco','Bovinos | Ref. 20251740171-1',0.229,'2027-07-05'::date,1376351.27,0,0,1376351.27,0,0,0,0,1376351.27,'planilha'),
('a0000000-0000-4000-8000-000000000001'::uuid,'Banco Do Brasil','Soja | Ref. 20260145885-1',0.1276,'2027-04-28'::date,1384628.11,0,1384628.11,0,0,0,0,0,1384628.11,'planilha'),
('a0000000-0000-4000-8000-000000000001'::uuid,'Banco John Deere','Renegociação | Ref. 20261014335-1',0.12,'2026-11-02'::date,636350.36,0,636350.36,0,0,0,0,0,636350.36,'planilha'),
('a0000000-0000-4000-8000-000000000001'::uuid,'Banco John Deere','Máquinas/Implementos | Ref. 20261073078-1',0.0821,'2032-05-15'::date,null,0,0,0,0,0,0,0,null,'planilha'),
('a0000000-0000-4000-8000-000000000001'::uuid,'Banco John Deere','Trator | Ref. 20261073078-3',0.0821,'2032-05-15'::date,null,0,0,0,0,0,0,0,null,'planilha'),
('a0000000-0000-4000-8000-000000000002'::uuid,'Bradesco','Colheitadeira | Ref. 20230678228-1',0.0737,'2030-06-17'::date,383610.67,0,0,0,0,383610.67,0,0,383610.67,'planilha'),
('a0000000-0000-4000-8000-000000000002'::uuid,'Bradesco','Bovinos | Ref. 20241574078-1',0.12,'2026-09-22'::date,482473.27,0,482473.27,0,0,0,0,0,482473.27,'planilha'),
('a0000000-0000-4000-8000-000000000002'::uuid,'Banco Do Brasil','Renegociação | Ref. 20251852403-1',0.11,'2030-10-28'::date,17057651.78,4032029.111,4032029.111,4032029.111,4032029.111,4032029.111,4032029.111,0,24192174.66,'planilha'),
('a0000000-0000-4000-8000-000000000002'::uuid,'Banco Do Brasil','Soja | Ref. 20260334306-1',0.11,'2027-04-28'::date,2259721.92,0,2259721.92,0,0,0,0,0,2259721.92,'planilha'),
('a0000000-0000-4000-8000-000000000002'::uuid,'Bradesco','Soja | Ref. 20260857281-1',0.14,'2027-04-15'::date,939837.01,0,939837.01,0,0,0,0,0,939837.01,'planilha')
) as v(
  emissor_id uuid, instituicao text, contrato_finalidade text, taxa_juros numeric, vencimento_final date, saldo_devedor numeric,
  ate_jun_2026 numeric, jul26_jun27 numeric, jul27_jun28 numeric, jul28_jun29 numeric, jul29_jun30 numeric, apos_jun_2030 numeric, sem_cronograma numeric,
  total_projetado numeric, origem text
)
where not exists (select 1 from public.passivos where deleted_at is null limit 1);
