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

const STORAGE_KEY = "mandotti.emissor_ids";

type Ctx = {
  emissores: Emissor[];
  emissorIds: string[];
  setEmissorIds: (ids: string[]) => void;
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

export function resumoEmissores(selecionados: Emissor[], total: number): string {
  if (selecionados.length === 0) return "Nenhum emissor selecionado";
  if (total > 0 && selecionados.length === total) return "Todos os emissores";
  if (selecionados.length === 1) {
    const e = selecionados[0]!;
    return e.nome_fantasia || e.razao_social;
  }
  if (selecionados.length === 2) {
    const [a, b] = selecionados as [Emissor, Emissor];
    return `${a.nome_fantasia || a.razao_social} + ${b.nome_fantasia || b.razao_social}`;
  }
  return `${selecionados.length} selecionados`;
}

export function EmissorProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useEmissores();
  const emissores = useMemo(() => data ?? [], [data]);
  const [emissorIds, setEmissorIdsState] = useState<string[] | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (raw !== null) {
      try {
        const parsed = JSON.parse(raw);
        setEmissorIdsState(Array.isArray(parsed) ? parsed : []);
      } catch {
        setEmissorIdsState([]);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (isLoading || !hydrated) return;
    setEmissorIdsState((current) => {
      if (current === null) return emissores.map((e) => e.id);
      if (current.length === 0) return current;
      const validos = current.filter((id) => emissores.some((e) => e.id === id));
      if (validos.length === 0) return emissores.map((e) => e.id);
      return validos;
    });
  }, [emissores, isLoading, hydrated]);

  const setEmissorIds = (ids: string[]) => {
    setEmissorIdsState(ids);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    }
  };

  const value: Ctx = {
    emissores,
    emissorIds: emissorIds ?? [],
    setEmissorIds,
    loading: isLoading || emissorIds === null,
  };

  return <EmissorContext.Provider value={value}>{children}</EmissorContext.Provider>;
}

export function useEmissor() {
  const ctx = useContext(EmissorContext);
  if (!ctx) throw new Error("useEmissor deve ser usado dentro de EmissorProvider");
  return ctx;
}
