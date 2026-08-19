import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type Perfil = "admin" | "funcionario" | "contabilidade";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, loading };
}

// Espelha public.rota_e_fiscal_financeira() da migration — manter em sincronia.
function rotaEFiscalFinanceira(rota: string) {
  return (
    [
      "/financeiro",
      "/passivos",
      "/notas-fiscais",
      "/importacao-xml",
      "/conciliacao",
      "/contabilidade",
    ].includes(rota) ||
    rota.startsWith("/financeiro/") ||
    rota.startsWith("/contabilidade")
  );
}

export function usePerfil(user: User | null) {
  const perfilQuery = useQuery({
    queryKey: ["perfil", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("perfis")
        .select("perfil")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data.perfil as Perfil;
    },
  });

  const acessoQuery = useQuery({
    queryKey: ["perfis_acesso", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("perfis_acesso")
        .select("rota, pode_ver, pode_editar")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
  });

  const perfil = perfilQuery.data ?? null;
  const grants = acessoQuery.data ?? [];

  const pode = (rota: string, acao: "ver" | "editar"): boolean => {
    if (perfil === "admin") return true;
    if (acao === "ver" && perfil === "contabilidade" && rotaEFiscalFinanceira(rota)) return true;
    if (acao === "editar" && perfil === "contabilidade" && rota === "/contabilidade/documentos") {
      return true;
    }
    const g = grants.find((x) => x.rota === rota);
    return acao === "ver" ? !!g?.pode_ver : !!g?.pode_editar;
  };

  return {
    perfil,
    pode,
    loading: perfilQuery.isLoading || acessoQuery.isLoading,
  };
}
