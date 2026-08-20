import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, List, Percent, Scale } from "lucide-react";

import { PageHeader } from "@/components/AppShell";
import { KpiCard, SectionCard } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchDadosContabilidade } from "@/lib/contabilidade-data";
import { downloadCsv } from "@/lib/export-csv";
import { formatBRL, formatDateBR, formatPctDecimal } from "@/lib/format";
import { useEmissor } from "@/lib/emissor-context";

export const Route = createFileRoute("/_authenticated/contabilidade/financeiro")({
  head: () => ({
    meta: [{ title: "Dados financeiros | Contabilidade | Sistema Grupo Mandotti" }],
  }),
  component: ContabilidadeFinanceiroPage,
});

function ContabilidadeFinanceiroPage() {
  const { emissorIds, emissores } = useEmissor();

  const { data, isLoading } = useQuery({
    queryKey: ["contabilidade-financeiro", emissorIds],
    queryFn: () => fetchDadosContabilidade(emissorIds),
  });

  const exportPassivos = () => {
    downloadCsv(
      "mandotti-passivos-scr.csv",
      ["Instituição", "Contrato", "Saldo", "Vencimento", "Taxa", "Titular"],
      (data?.passivos ?? []).map((p) => [
        p.instituicao,
        p.contrato_finalidade,
        p.saldo_devedor,
        p.vencimento_final,
        p.taxa_juros,
        emissores.find((e) => e.id === p.emissor_id)?.nome_fantasia ?? p.emissor_id,
      ]),
    );
  };

  const exportLancamentos = () => {
    downloadCsv(
      "mandotti-lancamentos.csv",
      ["Data", "Tipo", "Descrição", "Valor", "Origem", "Emissor"],
      (data?.lancamentos ?? []).map((l) => [
        l.data_competencia,
        l.tipo,
        l.descricao,
        l.valor,
        l.origem,
        emissores.find((e) => e.id === l.emissor_id)?.nome_fantasia ?? l.emissor_id,
      ]),
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dados financeiros"
        description="Mesmos dados do painel de Gestão — somente leitura e exportação para o escritório."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportPassivos} disabled={!data?.passivos.length}>
              <Download className="mr-2 size-4" /> SCR
            </Button>
            <Button variant="outline" onClick={exportLancamentos} disabled={!data?.lancamentos.length}>
              <Download className="mr-2 size-4" /> Lançamentos
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Passivo total" value={formatBRL(data?.resumo?.passivo_total)} icon={Scale} tone="warning" />
        <KpiCard
          label="Endividamento"
          value={formatPctDecimal(data?.resumo?.endividamento_pct)}
          icon={Percent}
        />
        <KpiCard label="Contratos" value={data?.passivos.length ?? 0} icon={FileText} />
        <KpiCard label="Lançamentos" value={data?.lancamentos.length ?? 0} icon={List} />
      </div>

      <SectionCard
        title="Passivos · SCR"
        description={`${data?.passivos.length ?? 0} contratos — origem: gestão / ficha cadastral`}
      >
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Banco</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead>Vencimento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.passivos ?? []).slice(0, 15).map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.instituicao}</TableCell>
                  <TableCell className="max-w-[240px] truncate">{p.contrato_finalidade}</TableCell>
                  <TableCell className="text-right font-mono-nums">{formatBRL(p.saldo_devedor)}</TableCell>
                  <TableCell>{formatDateBR(p.vencimento_final)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>

      <SectionCard title="Passivo por instituição" description="Resumo executivo da planilha">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Instituição</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data?.inst ?? []).map((i) => (
              <TableRow key={i.id}>
                <TableCell>{i.instituicao}</TableCell>
                <TableCell className="text-right font-mono-nums">{formatBRL(i.saldo_devedor)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      <SectionCard title="Lançamentos operacionais" description="Importados em gestão ou via documentos fiscais">
        {(data?.lancamentos.length ?? 0) === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum lançamento ainda — quando gestão importar XML, aparece aqui automaticamente.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.lancamentos ?? []).slice(0, 20).map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{formatDateBR(l.data_competencia)}</TableCell>
                  <TableCell className="max-w-[280px] truncate">{l.descricao}</TableCell>
                  <TableCell>{l.tipo}</TableCell>
                  <TableCell className="text-right font-mono-nums">{formatBRL(l.valor)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>
    </div>
  );
}
