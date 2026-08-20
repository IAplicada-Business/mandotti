import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Download,
  FileSpreadsheet,
  FileText,
  Landmark,
  List,
  Scale,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/AppShell";
import { Callout, SectionCard } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchDadosContabilidade } from "@/lib/contabilidade-data";
import { downloadCsv } from "@/lib/export-csv";
import { formatPctDecimal } from "@/lib/format";
import { useEmissor } from "@/lib/emissor-context";

export const Route = createFileRoute("/_authenticated/contabilidade/relatorios")({
  head: () => ({
    meta: [{ title: "Relatórios | Contabilidade | Sistema Grupo Mandotti" }],
  }),
  component: RelatoriosContabilidadePage,
});

type ArquivoRelatorio = {
  id: string;
  titulo: string;
  detalhe: string;
  disponivel: boolean;
  icon: LucideIcon;
  exportar: () => void;
};

type GrupoRelatorio = {
  titulo: string;
  arquivos: ArquivoRelatorio[];
};

async function baixarEmSequencia(arquivos: ArquivoRelatorio[]) {
  for (let i = 0; i < arquivos.length; i++) {
    arquivos[i].exportar();
    if (i < arquivos.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 280));
    }
  }
}

function RelatoriosContabilidadePage() {
  const { emissorIds, emissores } = useEmissor();
  const [exportando, setExportando] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["contabilidade-relatorios", emissorIds],
    queryFn: () => fetchDadosContabilidade(emissorIds),
  });

  const grupos: GrupoRelatorio[] = useMemo(() => {
    const r = data?.resumo;
    return [
      {
        titulo: "Patrimônio e passivos",
        arquivos: [
          {
            id: "resumo",
            titulo: "Resumo patrimonial",
            detalhe: "Totais, passivo, PL e endividamento",
            disponivel: Boolean(r),
            icon: Landmark,
            exportar: () => {
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
                  ["Cronograma até jun/26", r.cronograma_ate_jun26],
                  ["Cronograma jul/26–jun/27", r.cronograma_jul26_jun27],
                ],
              );
            },
          },
          {
            id: "scr",
            titulo: "Passivos · SCR",
            detalhe: `${data?.passivos.length ?? 0} contratos bancários`,
            disponivel: Boolean(data?.passivos.length),
            icon: Scale,
            exportar: () =>
              downloadCsv(
                "mandotti-passivos-scr.csv",
                ["Banco", "Contrato", "Saldo", "Vencimento", "Taxa", "Titular"],
                (data?.passivos ?? []).map((p) => [
                  p.instituicao,
                  p.contrato_finalidade,
                  p.saldo_devedor,
                  p.vencimento_final,
                  p.taxa_juros,
                  emissores.find((e) => e.id === p.emissor_id)?.nome_fantasia ?? "",
                ]),
              ),
          },
          {
            id: "banco",
            titulo: "Passivo por banco",
            detalhe: `${data?.inst.length ?? 0} instituições`,
            disponivel: Boolean(data?.inst.length),
            icon: Building2,
            exportar: () =>
              downloadCsv(
                "mandotti-passivo-instituicao.csv",
                ["Instituição", "Saldo devedor"],
                (data?.inst ?? []).map((i) => [i.instituicao, i.saldo_devedor]),
              ),
          },
        ],
      },
      {
        titulo: "Movimentação e fiscal",
        arquivos: [
          {
            id: "lancamentos",
            titulo: "Lançamentos",
            detalhe: `${data?.lancamentos.length ?? 0} despesas e receitas`,
            disponivel: Boolean(data?.lancamentos.length),
            icon: List,
            exportar: () =>
              downloadCsv(
                "mandotti-lancamentos.csv",
                ["Data", "Tipo", "Descrição", "Valor", "Origem", "Fornecedor"],
                (data?.lancamentos ?? []).map((l) => [
                  l.data_competencia,
                  l.tipo,
                  l.descricao,
                  l.valor,
                  l.origem,
                  l.fornecedor,
                ]),
              ),
          },
          {
            id: "xml",
            titulo: "Documentos fiscais (XML)",
            detalhe: `${data?.xmls.length ?? 0} importações`,
            disponivel: Boolean(data?.xmls.length),
            icon: FileText,
            exportar: () =>
              downloadCsv(
                "mandotti-xml-importacoes.csv",
                ["Arquivo", "Emitente", "Status", "Valor", "Categoria", "Data"],
                (data?.xmls ?? []).map((x) => [
                  x.nome_arquivo,
                  x.emitente,
                  x.status,
                  x.valor_total,
                  x.categoria_sugerida,
                  x.created_at.slice(0, 10),
                ]),
              ),
          },
          {
            id: "extratos",
            titulo: "Extratos · movimentos",
            detalhe: `${data?.movimentos.length ?? 0} linhas importadas pela gestão`,
            disponivel: Boolean(data?.movimentos.length),
            icon: Wallet,
            exportar: () =>
              downloadCsv(
                "mandotti-extratos.csv",
                ["Data", "Descrição", "Valor", "Tipo"],
                (data?.movimentos ?? []).map((m) => [
                  m.data_movimento,
                  m.descricao,
                  m.valor,
                  m.tipo,
                ]),
              ),
          },
        ],
      },
    ];
  }, [data, emissores]);

  const todos = grupos.flatMap((g) => g.arquivos);
  const disponiveis = todos.filter((a) => a.disponivel);

  const exportarPacote = async () => {
    if (!disponiveis.length || exportando) return;
    setExportando(true);
    try {
      await baixarEmSequencia(disponiveis);
      toast.success(
        disponiveis.length === 1
          ? "1 arquivo baixado"
          : `${disponiveis.length} arquivos baixados para o escritório`,
      );
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios mensais"
        description="Um pacote para o escritório. Os dados vêm da gestão — sem reentrada."
      />

      <Callout>
        O envio automático por e-mail (até o dia 5) é configurado em Parâmetros. Aqui você baixa o
        mesmo conteúdo, na hora.
      </Callout>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando dados…</p>
      ) : (
        <>
          <SectionCard
            title="Pacote do mês"
            description="Baixa os CSVs disponíveis de uma vez, na ordem do fechamento contábil."
            action={
              <Button onClick={exportarPacote} disabled={!disponiveis.length || exportando}>
                <Download className="size-4" />
                {exportando
                  ? "Baixando…"
                  : disponiveis.length
                    ? `Exportar pacote (${disponiveis.length})`
                    : "Sem dados"}
              </Button>
            }
          >
            <div className="flex items-start gap-3 rounded-[1.25rem] bg-surface-soft px-4 py-3.5">
              <FileSpreadsheet className="mt-0.5 size-5 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">
                Ordem: Resumo → SCR → bancos → lançamentos → XML → extratos. Arquivos sem dados
                ficam de fora.
              </p>
            </div>
          </SectionCard>

          <div className="grid gap-4 xl:grid-cols-2">
            {grupos.map((grupo) => (
              <SectionCard key={grupo.titulo} title={grupo.titulo}>
                <ul className="space-y-2">
                  {grupo.arquivos.map((arquivo) => {
                    const Icon = arquivo.icon;
                    return (
                      <li
                        key={arquivo.id}
                        className="flex items-center gap-3 rounded-[1.25rem] bg-surface-soft px-3 py-3"
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-card text-primary">
                          <Icon className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{arquivo.titulo}</p>
                          <p className="truncate text-xs text-muted-foreground">{arquivo.detalhe}</p>
                        </div>
                        {arquivo.disponivel ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={arquivo.exportar}
                            aria-label={`Exportar ${arquivo.titulo}`}
                          >
                            <Download className="size-4" />
                            CSV
                          </Button>
                        ) : (
                          <Badge variant="muted">Vazio</Badge>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </SectionCard>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
