import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet } from "lucide-react";

import { PageHeader } from "@/components/AppShell";
import { SectionCard } from "@/components/design-system";
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

function RelatoriosContabilidadePage() {
  const { emissorIds, emissores } = useEmissor();

  const { data, isLoading } = useQuery({
    queryKey: ["contabilidade-relatorios", emissorIds],
    queryFn: () => fetchDadosContabilidade(emissorIds),
  });

  const pacotes = [
    {
      titulo: "Resumo patrimonial",
      desc: "Totais, passivo, PL e endividamento — ficha cadastral",
      disabled: !data?.resumo,
      onExport: () => {
        const r = data!.resumo!;
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
      titulo: "Passivos · SCR",
      desc: `${data?.passivos.length ?? 0} contratos bancários`,
      disabled: !data?.passivos.length,
      onExport: () =>
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
      titulo: "Passivo por banco",
      desc: "Consolidado por instituição",
      disabled: !data?.inst.length,
      onExport: () =>
        downloadCsv(
          "mandotti-passivo-instituicao.csv",
          ["Instituição", "Saldo devedor"],
          (data?.inst ?? []).map((i) => [i.instituicao, i.saldo_devedor]),
        ),
    },
    {
      titulo: "Lançamentos",
      desc: "Despesas/receitas importadas (XML e manual)",
      disabled: !data?.lancamentos.length,
      onExport: () =>
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
      titulo: "Documentos fiscais (XML)",
      desc: "Histórico de importações",
      disabled: !data?.xmls.length,
      onExport: () =>
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
      titulo: "Extratos · movimentos",
      desc: "Importados pela gestão — somente exportação",
      disabled: !data?.movimentos.length,
      onExport: () =>
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
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios mensais"
        description="Exportação CSV para o escritório. Dados espelham gestão — sem reentrada."
      />

      <div className="rounded-xl border border-border/80 bg-surface-soft px-4 py-3 text-sm text-muted-foreground">
        Gere os pacotes abaixo e envie ao escritório. Quando o modo automático estiver ativo
        (Parâmetros → envio até dia 5), estes mesmos dados podem ser enviados por e-mail.
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando dados…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {pacotes.map((p) => (
            <SectionCard key={p.titulo} title={p.titulo} description={p.desc}>
              <Button variant="outline" disabled={p.disabled} onClick={p.onExport}>
                <Download className="mr-2 size-4" />
                Exportar CSV
              </Button>
            </SectionCard>
          ))}
        </div>
      )}

      <SectionCard
        title="Pacote completo"
        description="Exporte os arquivos acima em sequência para fechar o mês contábil"
      >
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <FileSpreadsheet className="size-5 shrink-0 text-primary" />
          <p>
            Recomendado: Resumo → SCR → Lançamentos → XML → Extratos. Todos refletem a mesma base de
            dados da gestão Mandotti.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
