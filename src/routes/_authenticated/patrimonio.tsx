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
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

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

const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

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

  const composicao = useMemo(() => {
    if (!r) return [];
    return [
      { name: "Imóveis", value: r.imoveis, color: PIE_COLORS[0] },
      { name: "Maquinários", value: r.maquinarios_veiculos, color: PIE_COLORS[1] },
      { name: "Participações", value: r.participacoes_societarias, color: PIE_COLORS[2] },
      { name: "Animais", value: r.animais, color: PIE_COLORS[3] },
      { name: "Outros", value: r.outros_bens, color: PIE_COLORS[4] },
    ].filter((x) => x.value > 0);
  }, [r]);

  const totalPatrimonio = r?.patrimonio_total ?? 0;

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

      <div className="grid gap-4 xl:grid-cols-5">
        <SectionCard
          className="xl:col-span-2"
          title="Composição do patrimônio"
          description="Resumo executivo · planilha Mandotti"
        >
          {composicao.length ? (
            <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
              <div className="h-[220px] min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={composicao}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={2}
                      cursor="pointer"
                    >
                      {composicao.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} stroke="var(--card)" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      cursor={{ fill: "var(--surface-soft)" }}
                      formatter={(value: number, name: string) => {
                        const pct =
                          totalPatrimonio > 0
                            ? ((value / totalPatrimonio) * 100).toFixed(1)
                            : "0";
                        return [`${formatBRL(value)} (${pct}%)`, name];
                      }}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid var(--border)",
                        background: "var(--card)",
                        boxShadow: "var(--shadow-sm-token)",
                        fontSize: 13,
                      }}
                      itemStyle={{ color: "var(--foreground)" }}
                      labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-2" aria-label="Legenda da composição patrimonial">
                {composicao.map((item) => {
                  const pct =
                    totalPatrimonio > 0 ? ((item.value / totalPatrimonio) * 100).toFixed(1) : "0";
                  return (
                    <li
                      key={item.name}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-surface-soft px-3 py-2.5"
                    >
                      <span className="inline-flex min-w-0 items-center gap-2 text-sm font-medium">
                        <span
                          className="size-3 shrink-0 rounded-sm"
                          style={{ background: item.color }}
                          aria-hidden
                        />
                        <span className="truncate">{item.name}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block font-mono-nums text-sm font-bold">{formatBRL(item.value)}</span>
                        <span className="text-xs text-muted-foreground">{pct}%</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-muted-foreground">Sem dados</p>
          )}
        </SectionCard>

        <SectionCard
          className="xl:col-span-3"
          title="Cronograma de amortização (grupo)"
          description="Totais consolidados — detalhe por contrato em Passivos · SCR"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CRONOGRAMA.map((p) => (
                <TableRow key={p.key}>
                  <TableCell>{p.label}</TableCell>
                  <TableCell className="text-right font-mono-nums">
                    {formatBRL(r?.[p.key as keyof typeof r] as number | null | undefined)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
            description="Consolidado do resumo executivo — contratos individuais em Passivos · SCR"
          >
            <TabelaPassivoInst rows={data?.passivoInst ?? []} loading={isLoading} />
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

function TabelaPassivoInst({
  rows,
  loading,
}: {
  rows: { id: string; instituicao: string; saldo_devedor: number }[];
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
            <TableHead>Instituição</TableHead>
            <TableHead className="text-right">Saldo devedor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visiveis.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.instituicao}</TableCell>
              <TableCell className="text-right font-mono-nums">{formatBRL(row.saldo_devedor)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <VerMais total={rows.length} expandido={expandido} onToggle={() => setExpandido((v) => !v)} />
    </>
  );
}
