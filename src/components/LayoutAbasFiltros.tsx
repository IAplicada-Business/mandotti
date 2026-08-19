import { ChevronRight, SlidersHorizontal } from "lucide-react";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type AbaLateral = {
  id: string;
  label: string;
};

type LayoutAbasFiltrosProps = {
  /** Sub-abas verticais à esquerda (opcional) */
  abas?: AbaLateral[];
  abaAtiva?: string;
  onAbaChange?: (id: string) => void;
  /** Campos de filtro (Selects) exibidos ao expandir o painel direito */
  filtros: ReactNode;
  children: ReactNode;
};

/**
 * Layout padrão: sub-abas à esquerda, conteúdo no centro, painel "Filtros"
 * colapsável à direita (clique abre os dropdowns de seleção).
 */
export function LayoutAbasFiltros({
  abas,
  abaAtiva,
  onAbaChange,
  filtros,
  children,
}: LayoutAbasFiltrosProps) {
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  return (
    <div className="flex min-h-[280px] overflow-hidden rounded-xl border border-border/80">
      {abas?.length ? (
        <nav
          aria-label="Sub-abas"
          className="flex w-[9.5rem] shrink-0 flex-col gap-1 border-r border-border/80 bg-surface-soft p-2"
        >
          {abas.map((aba) => (
            <button
              key={aba.id}
              type="button"
              onClick={() => onAbaChange?.(aba.id)}
              className={cn(
                "rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors",
                abaAtiva === aba.id
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-card/70 hover:text-foreground",
              )}
            >
              {aba.label}
            </button>
          ))}
        </nav>
      ) : null}

      <div className="min-w-0 flex-1">{children}</div>

      <aside
        className={cn(
          "shrink-0 border-l border-border/80 bg-surface-soft transition-[width] duration-200",
          filtrosAbertos ? "w-52" : "w-11",
        )}
      >
        {filtrosAbertos ? (
          <div className="flex h-full flex-col p-3">
            <button
              type="button"
              onClick={() => setFiltrosAbertos(false)}
              className="mb-3 flex w-full items-center justify-between rounded-lg px-1 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-primary transition-colors hover:bg-card/70"
            >
              Filtros
              <ChevronRight className="size-4 rotate-180 opacity-70" aria-hidden />
            </button>
            <div className="space-y-3 overflow-y-auto overflow-x-hidden pb-1">{filtros}</div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setFiltrosAbertos(true)}
            aria-label="Abrir filtros"
            aria-expanded={false}
            className="flex h-full min-h-[12rem] w-full flex-col items-center justify-center gap-2 py-6 text-muted-foreground transition-colors hover:bg-card/50 hover:text-primary"
          >
            <SlidersHorizontal className="size-4 shrink-0 opacity-70" aria-hidden />
            <span
              className="text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ writingMode: "vertical-rl" }}
            >
              Filtros
            </span>
          </button>
        )}
      </aside>
    </div>
  );
}
