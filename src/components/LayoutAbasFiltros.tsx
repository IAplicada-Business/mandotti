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
export function FiltroCard({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-[min(100%,12rem)] shrink-0 rounded-[1.25rem] bg-card px-3.5 py-3 shadow-sm [&_button]:h-9 [&_button]:rounded-full [&_button]:border-0 [&_button]:bg-surface-soft [&_button]:px-3 [&_button]:text-xs [&_button]:shadow-none",
        className,
      )}
    >
      <Label className="mb-1.5 block text-[11px] font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

/** Filtros compactos sempre visíveis, em linha, acima dos cards */
export function BarraFiltros({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-stretch gap-2.5">{children}</div>;
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
          className="rounded-[1.5rem] bg-card p-4 shadow-sm duration-300 animate-in fade-in-0 sm:p-6"
        >
          {children}
        </div>
      ) : (
        <div key={abaAtiva ?? "conteudo"} className="space-y-6 duration-300 animate-in fade-in-0">
          {children}
        </div>
      )}
    </div>
  );
}
