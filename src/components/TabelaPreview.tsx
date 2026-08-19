import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const LINHAS_PREVIEW = 5;

export function useTabelaPreview<T>(rows: T[], limit = LINHAS_PREVIEW) {
  const [aberto, setAberto] = useState(false);
  return {
    visiveis: aberto ? rows : rows.slice(0, limit),
    aberto,
    toggle: () => setAberto((v) => !v),
    mostrarBotao: rows.length > limit,
    total: rows.length,
    ocultos: Math.max(0, rows.length - limit),
  };
}

export function VerMais({
  total,
  limit = LINHAS_PREVIEW,
  aberto,
  onToggle,
}: {
  total: number;
  limit?: number;
  aberto: boolean;
  onToggle: () => void;
}) {
  if (total <= limit) return null;
  const restantes = total - limit;
  return (
    <div className="mt-4 flex justify-center border-t border-border/60 pt-4">
      <Button type="button" variant="outline" size="sm" onClick={onToggle}>
        {aberto ? (
          <>
            Ver menos
            <ChevronUp className="size-4" />
          </>
        ) : (
          <>
            Ver mais
            <span className="tabular-nums text-muted-foreground">({restantes})</span>
            <ChevronDown className="size-4" />
          </>
        )}
      </Button>
    </div>
  );
}

/** Envolve o conteúdo da tabela e exibe no máximo 5 linhas até clicar em Ver mais. */
export function TabelaPreview<T>({
  rows,
  limit = LINHAS_PREVIEW,
  children,
}: {
  rows: T[];
  limit?: number;
  children: (visiveis: T[]) => ReactNode;
}) {
  const preview = useTabelaPreview(rows, limit);
  return (
    <>
      {children(preview.visiveis)}
      <VerMais
        total={preview.total}
        limit={limit}
        aberto={preview.aberto}
        onToggle={preview.toggle}
      />
    </>
  );
}

export type DirecaoOrdem = "asc" | "desc";

export function CabecalhoOrdenavel({
  label,
  ativo,
  direcao,
  onClick,
  align = "left",
}: {
  label: string;
  ativo: boolean;
  direcao: DirecaoOrdem;
  onClick: () => void;
  align?: "left" | "right";
}) {
  return (
    <TableHead className={align === "right" ? "text-right" : undefined}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1 font-medium transition-colors hover:text-foreground",
          align === "right" && "ml-auto",
          ativo ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        {ativo ? (
          direcao === "asc" ? (
            <ChevronUp className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )
        ) : (
          <ChevronsUpDown className="size-3.5 opacity-40" />
        )}
      </button>
    </TableHead>
  );
}
