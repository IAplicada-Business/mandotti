import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  ChevronDown,
  ChevronUp,
  Home,
  Landmark,
  Scale,
  Tractor,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/AppShell";
import {
  CompositionDonut,
  RankedBarList,
  TimelineBarChart,
} from "@/components/charts/MandottiCharts";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, formatPctDecimal } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/patrimonio")({
  head: () => ({
    meta: [
      { title: "Patrimônio | Sistema Grupo Mandotti" },
      {
        name: "description",
        content: "Composição patrimonial, bens e passivos do Grupo Mandotti.",
      },
    ],
  }),
  component: PatrimonioPage,
});

const CRONOGRAMA = [
  { key: "cronograma_ate_jun26", label: "Até jun/26" },
  { key: "cronograma_jul26_jun27", label: "Jul/26–jun/27" },
  { key: "cronograma_jul27_jun28", label: "Jul/27–jun/28" },
  { key: "cronograma_jul28_jun29", label: "Jul/28–jun/29" },
  { key: "cronograma_jul29_jun30", label: "Jul/29–jun/30" },
  { key: "cronograma_apos_jun30", label: "Após jun/30" },
] as const;

const LIMITE_LINHAS = 5;

function PatrimonioPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["patrimonio"],
    queryFn: async () => {
      const [resumo, bens, passivoInst, maquinarios] = await Promise.all([
        supabase.from("resumo_patrimonial").select("*").limit(1).maybeSingle(),
        supabase.from("patrimonio_bens").select("*").order("ordem"),
        supabase.from("passivo_por_instituicao").select("*").order("saldo_devedor", { ascending: false }),
        supabase
          .from("maquinarios")
          .select("id, nome, categoria, valor_aquisicao, ordem")
          .is("deleted_at", null)
          .order("ordem"),
      ]);
      if (resumo.error) throw resumo.error;
      if (bens.error) throw bens.error;
      if (passivoInst.error) throw passivoInst.error;
      if (maquinarios.error) throw maquinarios.error;
      return {
        resumo: resumo.data,
        bens: bens.data ?? [],
        passivoInst: passivoInst.data ?? [],
        maquinarios: maquinarios.data ?? [],
      };
    },
  });

  const r = data?.resumo;
  const imoveis = data?.bens.filter((b) => b.tipo === "imovel") ?? [];

  const composicaoChart = useMemo(() => {
    if (!r) return [];
    return [
      { label: "Imóveis", value: r.imoveis },
      { label: "Maquinários", value: r.maquinarios_veiculos },
      { label: "Participações", value: r.participacoes_societarias },
      { label: "Animais", value: r.animais },
      { label: "Outros", value: r.outros_bens },
    ].filter((x) => x.value > 0);
  }, [r]);

  const cronogramaChart = useMemo(
    () =>
      CRONOGRAMA.map((p) => ({
        label: p.label,
        value: Number(r?.[p.key] ?? 0),
      })),
    [r],
  );

  const passivoInstChart = useMemo(
    () =>
      (data?.passivoInst ?? []).map((row, i) => ({
        label: row.instituicao,
        value: row.saldo_devedor ?? 0,
        color: `var(--chart-${(i % 5) + 1})`,
      })),
    [data?.passivoInst],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Visão geral · Patrimônio"
        title="Patrimônio · Grupo"
        description="Composição patrimonial da ficha cadastral. Detalhes operacionais ficam em Maquinário, Fazendas e Passivos · SCR."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Patrimônio total" value={formatBRL(r?.patrimonio_total)} icon={Landmark} tone="info" />
        <KpiCard label="Patrimônio líquido" value={formatBRL(r?.patrimonio_liquido)} icon={Building2} tone="success" />
        <KpiCard
          label="Endividamento"
          value={formatPctDecimal(r?.endividamento_pct)}
          icon={Scale}
          tone="warning"
          hint={`Passivo ${formatBRL(r?.passivo_total)}`}
        />
        <KpiCard label="Imóveis" value={formatBRL(r?.imoveis)} icon={Home} hint={`${imoveis.length} bens cadastrados`} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          to="/maquinario"
          className="flex items-center justify-between rounded-xl border border-border/80 bg-surface-soft px-4 py-3 text-sm transition-colors hover:border-primary/30 hover:bg-card"
        >
          <span className="inline-flex items-center gap-2 font-semibold">
            <Tractor className="size-4 text-primary" />
            Maquinários · {formatBRL(r?.maquinarios_veiculos)}
          </span>
          <ArrowRight className="size-4 text-muted-foreground" />
        </Link>
        <Link
          to="/passivos"
          className="flex items-center justify-between rounded-xl border border-border/80 bg-surface-soft px-4 py-3 text-sm transition-colors hover:border-primary/30 hover:bg-card"
        >
          <span className="inline-flex items-center gap-2 font-semibold">
            <Scale className="size-4 text-primary" />
            Passivos · SCR · {formatBRL(r?.passivo_total)}
          </span>
          <ArrowRight className="size-4 text-muted-foreground" />
        </Link>
        <Link
          to="/contratos"
          className="flex items-center justify-between rounded-xl border border-border/80 bg-surface-soft px-4 py-3 text-sm transition-colors hover:border-primary/30 hover:bg-card"
        >
          <span className="inline-flex items-center gap-2 font-semibold">
            <Users className="size-4 text-primary" />
            Contratos · Tradings
          </span>
          <ArrowRight className="size-4 text-muted-foreground" />
        </Link>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard
          title="Composição do patrimônio"
          description="Distribuição dos bens · resumo executivo Mandotti"
        >
          <CompositionDonut
            items={composicaoChart}
            total={r?.patrimonio_total ?? undefined}
            emptyLabel="Sem dados patrimoniais"
          />
        </SectionCard>

        <SectionCard
          title="Cronograma de amortização (grupo)"
          description="Vencimentos projetados · detalhe por contrato em Passivos · SCR"
        >
          <TimelineBarChart
            items={cronogramaChart}
            color="var(--chart-3)"
            height={280}
            emptyLabel="Cronograma não disponível no resumo."
          />
        </SectionCard>
      </div>

      <Tabs defaultValue="imoveis">
        <TabsList>
          <TabsTrigger value="imoveis">Imóveis ({imoveis.length})</TabsTrigger>
          <TabsTrigger value="ativos">Ativos · equipamentos ({data?.maquinarios.length ?? 0})</TabsTrigger>
          <TabsTrigger value="passivo-inst">Passivo por banco ({data?.passivoInst.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="imoveis">
          <SectionCard title="Bens imóveis" description="Glebas, residências e lotes fora do quadro operacional de fazendas">
            <TabelaBens rows={imoveis} loading={isLoading} showMunicipio />
          </SectionCard>
        </TabsContent>

        <TabsContent value="ativos">
          <SectionCard
            title="Ativos · equipamentos"
            description="Maquinários e veículos do grupo — detalhe operacional em Maquinário"
          >
            <TabelaAtivos rows={data?.maquinarios ?? []} loading={isLoading} />
          </SectionCard>
        </TabsContent>

        <TabsContent value="passivo-inst">
          <SectionCard
            title="Saldo por instituição"
            description="Ranking consolidado · contratos individuais em Passivos · SCR"
          >
            <RankedBarList
              items={passivoInstChart}
              emptyLabel="Sem dados de passivo por instituição."
            />
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function VerMais({
  total,
  expandido,
  onToggle,
}: {
  total: number;
  expandido: boolean;
  onToggle: () => void;
}) {
  if (total <= LIMITE_LINHAS) return null;
  return (
    <div className="mt-4 flex justify-center border-t border-border/60 pt-4">
      <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-primary" onClick={onToggle}>
        {expandido ? (
          <>
            <ChevronUp className="size-4" />
            Ver menos
          </>
        ) : (
          <>
            <ChevronDown className="size-4" />
            Ver mais ({total - LIMITE_LINHAS} restantes)
          </>
        )}
      </Button>
    </div>
  );
}

function TabelaBens({
  rows,
  loading,
  showMunicipio,
}: {
  rows: { id: string; descricao: string; municipio: string | null; ordem: number }[];
  loading: boolean;
  showMunicipio?: boolean;
}) {
  const [expandido, setExpandido] = useState(false);
  const visiveis = expandido ? rows : rows.slice(0, LIMITE_LINHAS);

  if (loading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>;
  }
  if (!rows.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Nenhum registro</p>;
  }
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Descrição</TableHead>
            {showMunicipio && <TableHead>Município</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {visiveis.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-mono-nums text-muted-foreground">{row.ordem}</TableCell>
              <TableCell>{row.descricao}</TableCell>
              {showMunicipio && <TableCell className="text-muted-foreground">{row.municipio ?? "—"}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <VerMais total={rows.length} expandido={expandido} onToggle={() => setExpandido((v) => !v)} />
    </>
  );
}

function TabelaAtivos({
  rows,
  loading,
}: {
  rows: { id: string; nome: string; categoria: string; valor_aquisicao: number | null; ordem: number }[];
  loading: boolean;
}) {
  const [expandido, setExpandido] = useState(false);
  const visiveis = expandido ? rows : rows.slice(0, LIMITE_LINHAS);

  if (loading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>;
  }
  if (!rows.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Nenhum registro</p>;
  }
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Equipamento</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visiveis.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-mono-nums text-muted-foreground">{row.ordem}</TableCell>
              <TableCell className="font-medium">{row.nome}</TableCell>
              <TableCell className="text-muted-foreground">{row.categoria}</TableCell>
              <TableCell className="text-right font-mono-nums">{formatBRL(row.valor_aquisicao)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <VerMais total={rows.length} expandido={expandido} onToggle={() => setExpandido((v) => !v)} />
    </>
  );
}
