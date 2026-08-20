import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet, FileText, Landmark, List, Scale, Wallet } from "lucide-react";

import { PageHeader } from "@/components/AppShell";
import { Callout, KpiCard, SectionCard } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { fetchDadosContabilidade } from "@/lib/contabilidade-data";
import { downloadCsv } from "@/lib/export-csv";
import { formatBRL, formatPctDecimal } from "@/lib/format";
import { useEmissor } from "@/lib/emissor-context";

export const Route = createFileRoute("/_authenticated/contabilidade/")({
  head: () => ({
    meta: [{ title: "Contabilidade | Sistema Grupo Mandotti" }],
  }),
  component: ContabilidadeDashboard,
});

function ContabilidadeDashboard() {
  const { emissorIds } = useEmissor();

  const { data, isLoading } = useQuery({
    queryKey: ["contabilidade-dashboard", emissorIds],
    queryFn: () => fetchDadosContabilidade(emissorIds),
  });

  const exportResumo = () => {
    const r = data?.resumo;
    if (!r) return;
    downloadCsv(
      "mandotti-resumo-patrimonial.csv",
      ["Campo", "Valor"],
      [
        ["Patrimônio total", r.patrimonio_total],
        ["Passivo total", r.passivo_total],
        ["Patrimônio líquido", r.patrimonio_liquido],
        ["Endividamento", formatPctDecimal(r.endividamento_pct)],
        ["Passivo Eder", r.passivo_eder],
        ["Passivo Nagyla", r.passivo_nagyla],
        ["Referência", r.referencia],
      ],
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visão para exportação e consumo. Os dados vêm do módulo Gestão — sem retrabalho de lançamento."
        action={
          <Button variant="outline" onClick={exportResumo} disabled={!data?.resumo}>
            <Download className="mr-2 size-4" />
            Exportar resumo
          </Button>
        }
      />

      <Callout tone="info">
        <span className="font-semibold">Como funciona:</span> o time Mandotti alimenta gestão
        (passivos, produção, conciliação bancária). A contabilidade{" "}
        <strong>consome, valida e exporta</strong> — importa documentos fiscais e extrai relatórios.
        Extratos bancários são importados pela gestão.
      </Callout>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Passivo total"
          value={isLoading ? "…" : formatBRL(data?.resumo?.passivo_total)}
          icon={Scale}
          tone="warning"
        />
        <KpiCard
          label="Patrimônio líquido"
          value={isLoading ? "…" : formatBRL(data?.resumo?.patrimonio_liquido)}
          icon={Landmark}
          tone="success"
        />
        <KpiCard
          label="Contratos SCR"
          value={isLoading ? "…" : (data?.passivos.length ?? 0)}
          icon={FileText}
        />
        <KpiCard
          label="Lançamentos"
          value={isLoading ? "…" : (data?.lancamentos.length ?? 0)}
          icon={List}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Atalho
          to="/contabilidade/financeiro"
          icon={Wallet}
          titulo="Dados financeiros"
          desc="Passivos, cronograma e lançamentos para exportar"
        />
        <Atalho
          to="/contabilidade/documentos"
          icon={FileText}
          titulo="Documentos fiscais"
          desc="Importar XML e consultar notas processadas"
        />
        <Atalho
          to="/contabilidade/relatorios"
          icon={FileSpreadsheet}
          titulo="Relatórios"
          desc="Pacotes CSV mensais para o escritório"
        />
        <Atalho
          to="/contabilidade/extratos"
          icon={Landmark}
          titulo="Extratos bancários"
          desc="Somente leitura — importados pela gestão"
        />
      </div>

      <SectionCard title="Origem dos dados" description="Tudo reflete o que já está em Gestão">
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Resumo e SCR</strong> — ficha cadastral / passivos
            (gestão)
          </li>
          <li>
            <strong className="text-foreground">Lançamentos e XML</strong> — importação financeira
            (gestão ou contabilidade via documentos fiscais)
          </li>
          <li>
            <strong className="text-foreground">Extratos</strong> — upload pelo time Mandotti em
            conciliação (gestão); contabilidade apenas visualiza
          </li>
        </ul>
      </SectionCard>
    </div>
  );
}

function Atalho({
  to,
  icon: Icon,
  titulo,
  desc,
}: {
  to: string;
  icon: typeof Wallet;
  titulo: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col gap-3 rounded-[1.5rem] bg-card p-5 shadow-sm transition-colors hover:bg-surface-soft"
    >
      <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="font-bold">{titulo}</p>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </div>
    </Link>
  );
}
