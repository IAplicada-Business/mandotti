import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/AppShell";
import {
  DonutDistribution,
  HorizontalBarChart,
  RankedBarList,
  TimelineBarChart,
} from "@/components/charts/MandottiCharts";
import { KpiCard, SectionCard } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, formatDateBR, formatPctDecimal } from "@/lib/format";
import { useEmissor } from "@/lib/emissor-context";

export const Route = createFileRoute("/_authenticated/passivos")({
  head: () => ({
    meta: [
      { title: "Passivos · SCR | Sistema Grupo Mandotti" },
      {
        name: "description",
        content: "Contratos, saldos e cronograma de vencimentos do Grupo Mandotti.",
      },
    ],
  }),
  component: PassivosPage,
});

const PERIODOS = [
  { key: "ate_jun_2026", label: "Até jun/26" },
  { key: "jul26_jun27", label: "Jul/26–jun/27" },
  { key: "jul27_jun28", label: "Jul/27–jun/28" },
  { key: "jul28_jun29", label: "Jul/28–jun/29" },
  { key: "jul29_jun30", label: "Jul/29–jun/30" },
  { key: "apos_jun_2030", label: "Após jun/30" },
  { key: "sem_cronograma", label: "Sem cronograma" },
] as const;

function PassivosPage() {
  const { emissores, emissorIds } = useEmissor();
  const [banco, setBanco] = useState<string>("todos");

  const { data = [], isLoading } = useQuery({
    queryKey: ["passivos", emissorIds],
    enabled: emissorIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("passivos")
        .select("*")
        .is("deleted_at", null)
        .in("emissor_id", emissorIds)
        .order("saldo_devedor", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const bancos = useMemo(
    () => [...new Set(data.map((p) => p.instituicao).filter(Boolean))].sort(),
    [data],
  );

  const filtrados = useMemo(
    () => (banco === "todos" ? data : data.filter((p) => p.instituicao === banco)),
    [data, banco],
  );

  const saldoTotal = filtrados.reduce((acc, p) => acc + (p.saldo_devedor ?? 0), 0);
  const projetado = filtrados.reduce((acc, p) => acc + (p.total_projetado ?? 0), 0);

  const porTitular = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of filtrados) {
      const nome =
        emissores.find((e) => e.id === p.emissor_id)?.nome_fantasia ||
        emissores.find((e) => e.id === p.emissor_id)?.razao_social ||
        "—";
      map.set(nome, (map.get(nome) ?? 0) + (p.saldo_devedor ?? 0));
    }
    return [...map.entries()].map(([nome, valor]) => ({ nome, valor }));
  }, [filtrados, emissores]);

  const porBanco = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of filtrados) {
      map.set(p.instituicao, (map.get(p.instituicao) ?? 0) + (p.saldo_devedor ?? 0));
    }
    return [...map.entries()]
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor);
  }, [filtrados]);

  const porTitularChart = useMemo(
    () =>
      porTitular.map((row, i) => ({
        label: row.nome,
        value: row.valor,
        color: `var(--chart-${(i % 5) + 1})`,
      })),
    [porTitular],
  );

  const porBancoChart = useMemo(
    () =>
      porBanco.map((row, i) => ({
        label: row.nome,
        value: row.valor,
        color: `var(--chart-${(i % 5) + 1})`,
      })),
    [porBanco],
  );

  const cronogramaChart = useMemo(
    () =>
      PERIODOS.map((p) => ({
        label: p.label,
        value: filtrados.reduce((acc, row) => acc + Number(row[p.key] ?? 0), 0),
      })),
    [filtrados],
  );

  if (!emissorIds.length) {
    return (
      <div>
        <PageHeader breadcrumb="Financeiro" title="Passivos · SCR" />
        <SectionCard title="Selecione emissores">
          <p className="py-8 text-center text-sm text-muted-foreground">
            Selecione ao menos um emissor no topo para ver os contratos.
          </p>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Financeiro · SCR"
        title="Passivos · SCR"
        description="Contratos da ficha cadastral — visão por titular, banco e ano."
        action={
          <Select value={banco} onValueChange={setBanco}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Banco" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os bancos</SelectItem>
              {bancos.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Contratos" value={filtrados.length} />
        <KpiCard label="Saldo devedor" value={formatBRL(saldoTotal)} tone="warning" />
        <KpiCard label="Projetado c/ juros" value={formatBRL(projetado)} tone="danger" />
        <KpiCard
          label="Instituições"
          value={porBanco.length}
          hint="No filtro atual"
          tone="info"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Saldo por titular" description="Participação de cada emissor no passivo filtrado.">
          <DonutDistribution items={porTitularChart} centerLabel="Saldo" emptyLabel="Sem dados por titular." />
        </SectionCard>

        <SectionCard title="Saldo por banco" description="Ranking das instituições no filtro atual.">
          <RankedBarList items={porBancoChart} emptyLabel="Sem dados por banco." />
        </SectionCard>
      </div>

      <SectionCard title="Cronograma de vencimentos" description="Alocação por período · planilha SCR">
        <TimelineBarChart items={cronogramaChart} color="var(--chart-3)" emptyLabel="Sem vencimentos no filtro." />
      </SectionCard>

      <SectionCard title="Contratos" description={`${filtrados.length} registros`}>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titular</TableHead>
                <TableHead>Instituição</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead>Taxa</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="text-right">Projetado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((p) => {
                const titular =
                  emissores.find((e) => e.id === p.emissor_id)?.nome_fantasia ||
                  emissores.find((e) => e.id === p.emissor_id)?.razao_social ||
                  "—";
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Badge variant="default">{titular}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{p.instituicao}</TableCell>
                    <TableCell className="max-w-[280px] truncate">{p.contrato_finalidade}</TableCell>
                    <TableCell className="font-mono-nums">{formatPctDecimal(p.taxa_juros)}</TableCell>
                    <TableCell>{formatDateBR(p.vencimento_final)}</TableCell>
                    <TableCell className="text-right font-mono-nums">
                      {formatBRL(p.saldo_devedor)}
                    </TableCell>
                    <TableCell className="text-right font-mono-nums">
                      {formatBRL(p.total_projetado)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        <div className="mt-6 border-t border-border/60 pt-5">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Resumo por banco
          </p>
          <HorizontalBarChart items={porBancoChart} height={Math.max(160, porBancoChart.length * 48)} />
        </div>
      </SectionCard>
    </div>
  );
}
