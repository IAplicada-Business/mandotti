import { supabase } from "@/integrations/supabase/client";

/** Dados financeiros já imputados em Gestão — contabilidade só consome e exporta. */
export async function fetchDadosContabilidade(emissorIds: string[]) {
  const [resumo, inst, passivos, lancamentos, xmls, extratosMeta] = await Promise.all([
    supabase.from("resumo_patrimonial").select("*").limit(1).maybeSingle(),
    supabase.from("passivo_por_instituicao").select("*").order("saldo_devedor", { ascending: false }),
    emissorIds.length
      ? supabase
          .from("passivos")
          .select("*")
          .is("deleted_at", null)
          .in("emissor_id", emissorIds)
          .order("saldo_devedor", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    emissorIds.length
      ? supabase
          .from("lancamentos")
          .select("*")
          .is("deleted_at", null)
          .in("emissor_id", emissorIds)
          .order("data_competencia", { ascending: false })
          .limit(500)
      : Promise.resolve({ data: [], error: null }),
    emissorIds.length
      ? supabase
          .from("xml_importacoes")
          .select("*")
          .is("deleted_at", null)
          .in("emissor_id", emissorIds)
          .order("created_at", { ascending: false })
          .limit(200)
      : Promise.resolve({ data: [], error: null }),
    emissorIds.length
      ? supabase
          .from("extratos_bancarios")
          .select("id, emissor_id, banco, conta_mascara, periodo_inicio, periodo_fim, nome_arquivo, created_at")
          .is("deleted_at", null)
          .in("emissor_id", emissorIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (resumo.error) throw resumo.error;
  if (inst.error) throw inst.error;
  if (passivos.error) throw passivos.error;
  if (lancamentos.error) throw lancamentos.error;
  if (xmls.error) throw xmls.error;
  if (extratosMeta.error) throw extratosMeta.error;

  const extratoIds = (extratosMeta.data ?? []).map((e) => e.id);
  let movimentos: Record<string, unknown>[] = [];
  if (extratoIds.length) {
    const { data, error } = await supabase
      .from("extrato_movimentos")
      .select("*")
      .is("deleted_at", null)
      .in("extrato_id", extratoIds)
      .order("data_movimento", { ascending: false })
      .limit(500);
    if (error) throw error;
    movimentos = data ?? [];
  }

  return {
    resumo: resumo.data,
    inst: inst.data ?? [],
    passivos: passivos.data ?? [],
    lancamentos: lancamentos.data ?? [],
    xmls: xmls.data ?? [],
    extratos: extratosMeta.data ?? [],
    movimentos,
  };
}
