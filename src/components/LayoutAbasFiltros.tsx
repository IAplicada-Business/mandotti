import { type ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type AbaLateral = {
  id: string;
  label: string;
};

type LayoutAbasFiltrosProps = {
  /** Sub-abas em pílula, acima da tabela */
  abas?: AbaLateral[];
  abaAtiva?: string;
  onAbaChange?: (id: string) => void;
  children: ReactNode;
  /** false = conteúdo livre abaixo da barra (gráficos + tabela) */
  encapsular?: boolean;
};

/** Card compacto com um dropdown */
export function FiltroCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="w-[min(100%,9.5rem)] shrink-0 rounded-2xl border border-border/60 bg-card px-2.5 py-2 shadow-xs [&_button]:h-8 [&_button]:rounded-xl [&_button]:px-2.5 [&_button]:text-xs">
      <Label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

/** Filtros compactos sempre visíveis, em linha, acima dos cards */
export function BarraFiltros({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-start gap-2">{children}</div>;
}

/**
 * Sub-abas em pílula acima do conteúdo.
 * Os filtros ficam em `BarraFiltros`, sempre acima dos cards da página.
 */
export function LayoutAbasFiltros({
  abas,
  abaAtiva,
  onAbaChange,
  children,
  encapsular = true,
}: LayoutAbasFiltrosProps) {
  return (
    <div className="space-y-4">
      {abas?.length ? (
        <nav
          aria-label="Sub-abas"
          className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-surface-soft p-1"
        >
          {abas.map((aba) => {
            const ativa = abaAtiva === aba.id;
            return (
              <button
                key={aba.id}
                type="button"
                onClick={() => onAbaChange?.(aba.id)}
                className={cn(
                  "inline-flex shrink-0 items-center rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200",
                  ativa
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {aba.label}
              </button>
            );
          })}
        </nav>
      ) : null}

      {encapsular ? (
        <div
          key={abaAtiva ?? "conteudo"}
          className="overflow-hidden rounded-[1.35rem] border border-border/60 bg-card shadow-sm duration-300 animate-in fade-in-0"
        >
          <div className="p-4 sm:p-5">{children}</div>
        </div>
      ) : (
        <div key={abaAtiva ?? "conteudo"} className="space-y-6 duration-300 animate-in fade-in-0">
          {children}
        </div>
      )}
    </div>
  );
}
