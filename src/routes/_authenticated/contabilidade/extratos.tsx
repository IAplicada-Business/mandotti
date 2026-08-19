import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";

import { PageHeader } from "@/components/AppShell";
import { KpiCard, SectionCard } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
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
import { formatBRL, formatDateBR } from "@/lib/format";
import { useEmissor } from "@/lib/emissor-context";

export const Route = createFileRoute("/_authenticated/contabilidade/extratos")({
  head: () => ({
    meta: [{ title: "Extratos | Contabilidade | Sistema Grupo Mandotti" }],
  }),
  component: ExtratosContabilidadePage,
});

function ExtratosContabilidadePage() {
  const { emissorIds, emissores } = useEmissor();

  const { data, isLoading } = useQuery({
    queryKey: ["contabilidade-extratos", emissorIds],
    queryFn: () => fetchDadosContabilidade(emissorIds),
  });

  const exportMovimentos = () => {
    downloadCsv(
      "mandotti-extratos-movimentos.csv",
      ["Data", "Descrição", "Valor", "Tipo", "Arquivo extrato", "Banco"],
      (data?.movimentos ?? []).map((m) => {
        const extrato = data?.extratos.find((e) => e.id === m.extrato_id);
        return [
          m.data_movimento as string,
          m.descricao as string,
          m.valor as number,
          m.tipo as string,
          extrato?.nome_arquivo,
          extrato?.banco,
        ];
      }),
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Extratos bancários"
        description="Somente leitura. Extratos são importados pelo time Mandotti em Gestão → Conciliação."
        action={
          <Button variant="outline" onClick={exportMovimentos} disabled={!data?.movimentos.length}>
            <Download className="mr-2 size-4" /> Exportar movimentos
          </Button>
        }
      />

      <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm">
        <span className="font-semibold">Consumo, não input:</span> a contabilidade não faz upload de
        extratos aqui. Solicite ao time Mandotti ou aguarde o envio automático até o dia 5 de cada mês.
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Extratos" value={data?.extratos.length ?? 0} />
        <KpiCard label="Movimentos" value={data?.movimentos.length ?? 0} />
        <KpiCard
          label="Emissores"
          value={emissorIds.length}
          hint={emissores.map((e) => e.nome_fantasia).filter(Boolean).join(", ")}
        />
      </div>

      <SectionCard title="Arquivos importados (gestão)">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : (data?.extratos.length ?? 0) === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhum extrato importado ainda pela gestão.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Banco</TableHead>
                <TableHead>Arquivo</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Importado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.extratos.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{e.banco}</TableCell>
                  <TableCell className="font-medium">{e.nome_arquivo}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateBR(e.periodo_inicio)} — {formatDateBR(e.periodo_fim)}
                  </TableCell>
                  <TableCell>{formatDateBR(e.created_at.slice(0, 10))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>

      <SectionCard title="Movimentos recentes">
        {(data?.movimentos.length ?? 0) === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Sem movimentos.</p>
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
              {data?.movimentos.slice(0, 30).map((m) => (
                <TableRow key={m.id as string}>
                  <TableCell>{formatDateBR(m.data_movimento as string)}</TableCell>
                  <TableCell className="max-w-[280px] truncate">{m.descricao as string}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{m.tipo as string}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono-nums">{formatBRL(m.valor as number)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>
    </div>
  );
}
