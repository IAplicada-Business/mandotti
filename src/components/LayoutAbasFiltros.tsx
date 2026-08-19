import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type AbaLateral = {
  id: string;
  label: string;
};

type LayoutAbasFiltrosProps = {
  /** Título à esquerda quando não há sub-abas */
  title?: string;
  /** Sub-abas em pílula, acima da tabela, à esquerda */
  abas?: AbaLateral[];
  abaAtiva?: string;
  onAbaChange?: (id: string) => void;
  /** Campos de filtro — abrem acima da tabela, à direita */
  filtros: ReactNode;
  children: ReactNode;
};

/**
 * Barra acima da tabela: sub-abas à esquerda (formato de pílula) e
 * Filtros à direita. A tabela fica abaixo, sem trilhos internos.
 */
export function LayoutAbasFiltros({
  title,
  abas,
  abaAtiva,
  onAbaChange,
  filtros,
  children,
}: LayoutAbasFiltrosProps) {
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {abas?.length ? (
          <nav
            aria-label="Sub-abas"
            className="inline-flex h-10 items-center gap-1 rounded-full bg-surface-soft p-1"
          >
            {abas.map((aba) => {
              const ativa = abaAtiva === aba.id;
              return (
                <button
                  key={aba.id}
                  type="button"
                  onClick={() => onAbaChange?.(aba.id)}
                  className={cn(
                    "inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200",
                    ativa
                      ? "bg-card text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {aba.label}
                </button>
              );
            })}
          </nav>
        ) : title ? (
          <h3 className="text-base font-bold tracking-tight">{title}</h3>
        ) : (
          <span />
        )}

        <button
          type="button"
          onClick={() => setFiltrosAbertos((v) => !v)}
          aria-expanded={filtrosAbertos}
          aria-label={filtrosAbertos ? "Fechar filtros" : "Abrir filtros"}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-4 py-2 text-sm font-semibold transition-all duration-200 hover:border-primary/30 hover:text-primary",
            filtrosAbertos && "border-primary/30 bg-surface-soft text-primary",
          )}
        >
          <SlidersHorizontal className="size-4" />
          Filtros
          <ChevronDown
            className={cn("size-4 transition-transform duration-200", filtrosAbertos && "rotate-180")}
            aria-hidden
          />
        </button>
      </div>

      {filtrosAbertos ? (
        <div className="flex justify-end duration-200 animate-in fade-in-0 slide-in-from-top-2">
          <div className="w-full max-w-xs space-y-3 rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
            {filtros}
          </div>
        </div>
      ) : null}

      <div
        key={abaAtiva ?? "conteudo"}
        className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm duration-300 animate-in fade-in-0 slide-in-from-left-2"
      >
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}
