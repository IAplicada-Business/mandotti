import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type Emissor = {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string;
  ativo: boolean;
};

const STORAGE_KEY = "mandotti.emissor_id";

type Ctx = {
  emissores: Emissor[];
  emissorId: string | null;
  emissor: Emissor | null;
  setEmissorId: (id: string | null) => void;
  loading: boolean;
};

const EmissorContext = createContext<Ctx | null>(null);

export function useEmissores() {
  return useQuery({
    queryKey: ["emissores", "ativos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emissores")
        .select("id, razao_social, nome_fantasia, cnpj, ativo")
        .is("deleted_at", null)
        .eq("ativo", true)
        .order("razao_social");
      if (error) throw error;
      return data as Emissor[];
    },
  });
}

export function EmissorProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useEmissores();
  const [emissorId, setEmissorIdState] = useState<string | null>(null);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (stored) setEmissorIdState(stored);
  }, []);

  const emissores = useMemo(() => data ?? [], [data]);

  useEffect(() => {
    if (!emissores.length) return;
    if (!emissorId || !emissores.some((e) => e.id === emissorId)) {
      setEmissorIdState(emissores[0]!.id);
    }
  }, [emissores, emissorId]);

  const setEmissorId = (id: string | null) => {
    setEmissorIdState(id);
    if (typeof window !== "undefined") {
      if (id) window.localStorage.setItem(STORAGE_KEY, id);
      else window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  const value: Ctx = {
    emissores,
    emissorId,
    emissor: emissores.find((e) => e.id === emissorId) ?? null,
    setEmissorId,
    loading: isLoading,
  };

  return <EmissorContext.Provider value={value}>{children}</EmissorContext.Provider>;
}

export function useEmissor() {
  const ctx = useContext(EmissorContext);
  if (!ctx) throw new Error("useEmissor deve ser usado dentro de EmissorProvider");
  return ctx;
}
