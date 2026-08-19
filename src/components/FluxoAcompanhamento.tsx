import { ArrowRight, FileSpreadsheet, Landmark, Scale, Sprout, Wallet } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { SectionCard } from "@/components/design-system";

const ETAPAS = [
  {
    ordem: 1,
    titulo: "Importar XML",
    descricao: "Notas dos 4 emissores entram categorizadas (combustível, químicos, peças).",
    rota: "/financeiro/xml",
    icon: FileSpreadsheet,
  },
  {
    ordem: 2,
    titulo: "Painel financeiro",
    descricao: "Despesas fixas/variáveis e balanço parametrizável entre CPFs na hora da compra.",
    rota: "/financeiro",
    icon: Wallet,
  },
  {
    ordem: 3,
    titulo: "Conciliação",
    descricao: "Cruza NF com extrato (Pix/transferência) e compõe o fluxo de caixa.",
    rota: "/financeiro/conciliacao",
    icon: Landmark,
  },
  {
    ordem: 4,
    titulo: "Passivos · SCR",
    descricao: "Dívidas do Bacen com cronograma anual até 2027–2028.",
    rota: "/passivos",
    icon: Scale,
  },
  {
    ordem: 5,
    titulo: "Fazendas & áreas",
    descricao: "Área produtiva, abertura, arrendamento e meta de expansão (10.000 ha).",
    rota: "/fazendas",
    icon: Sprout,
  },
] as const;

export function FluxoAcompanhamento() {
  return (
    <SectionCard
      title="Fluxo de acompanhamento"
      description="Prioridade #1 da call — financeiro e fiscal inteligente. Siga esta ordem no dia a dia."
    >
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {ETAPAS.map((etapa) => (
          <li key={etapa.ordem}>
            <Link
              to={etapa.rota}
              className="group flex h-full flex-col rounded-xl border border-border/80 bg-surface-soft p-4 transition-colors hover:border-primary/30 hover:bg-card"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <etapa.icon className="size-4" />
                </span>
                <span className="font-mono-nums text-xs font-bold text-muted-foreground">
                  {String(etapa.ordem).padStart(2, "0")}
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground">{etapa.titulo}</p>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">
                {etapa.descricao}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-80 group-hover:opacity-100">
                Abrir
                <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}
