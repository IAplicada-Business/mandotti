import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Landmark, Scale, Tractor } from "lucide-react";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader } from "@/components/AppShell";
import { CompositionDonut } from "@/components/charts/MandottiCharts";
import { KpiCard, SectionCard } from "@/components/design-system";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useEmissor } from "@/lib/emissor-context";
import { formatBRL, formatPctDecimal } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | Sistema Grupo Mandotti" },
      {
        name: "description",
        content: "Panorama patrimonial e operacional do Grupo Mandotti.",
      },
      { property: "og:title", content: "Dashboard | Sistema Grupo Mandotti" },
      {
        property: "og:description",
        content: "Panorama patrimonial e operacional do Grupo Mandotti.",
      },
    ],
  }),
  component: Dashboard,
});

const EMPTY_TREND = [
  { mes: "Mar", valor: 0 },
  { mes: "Abr", valor: 0 },
  { mes: "Mai", valor: 0 },
  { mes: "Jun", valor: 0 },
  { mes: "Jul", valor: 0 },
  { mes: "Ago", valor: 0 },
];

const EMPTY_BARS = [
  { nome: "Combustível", valor: 0 },
  { nome: "Químicos", valor: 0 },
  { nome: "Peças", valor: 0 },
  { nome: "Manutenção", valor: 0 },
  { nome: "Folha", valor: 0 },
];

const EMPTY_PIE = [
  { name: "Eder", value: 1, color: "var(--emissor-eder)" },
  { name: "Nagyla", value: 1, color: "var(--emissor-nagyla)" },
  { name: "Mandotti", value: 1, color: "var(--emissor-mandotti)" },
  { name: "Tractor", value: 1, color: "var(--emissor-tractor)" },
];

const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function Dashboard() {
  const { emissorIds } = useEmissor();

  const { data } = useQuery({
    queryKey: ["dashboard-patrimonio"],
    enabled: emissorIds.length > 0,
    queryFn: async () => {
      const { data: resumo, error } = await supabase
        .from("resumo_patrimonial")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return resumo;
    },
  });

  const composicaoPatrimonio = useMemo(() => {
    if (!data) return [];
    return [
      { label: "Imóveis", value: data.imoveis },
      { label: "Maquinários", value: data.maquinarios_veiculos },
      { label: "Participações", value: data.participacoes_societarias },
      { label: "Animais", value: data.animais },
      { label: "Outros", value: data.outros_bens },
    ].filter((x) => x.value > 0);
  }, [data]);

  if (!emissorIds.length) {
    return (
      <div>
        <PageHeader
          title="Dashboard"
          description="Panorama patrimonial e operacional do Grupo Mandotti."
        />
        <SectionCard title="Sem visão selecionada">
          <div className="py-10 text-center text-sm text-muted-foreground">
            Selecione ao menos um emissor no topo da tela.
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Panorama patrimonial e operacional do Grupo Mandotti."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Patrimônio total"
          value={formatBRL(data?.patrimonio_total)}
          icon={Landmark}
          tone="info"
        />
        <KpiCard
          label="Patrimônio líquido"
          value={formatBRL(data?.patrimonio_liquido)}
          icon={Landmark}
          tone="success"
        />
        <KpiCard
          label="Endividamento"
          value={formatPctDecimal(data?.endividamento_pct)}
          icon={Scale}
          tone="warning"
          hint={`Passivo ${formatBRL(data?.passivo_total)}`}
        />
        <KpiCard
          label="Maquinários"
          value={formatBRL(data?.maquinarios_veiculos)}
          icon={Tractor}
          tone="default"
          hint={
            <Link to="/maquinario" className="text-primary hover:underline">
              Ver frota →
            </Link>
          }
        />
      </div>

      <SectionCard
        title="Gestão visual · Composição patrimonial"
        description="Distribuição dos bens do grupo — ficha cadastral Mandotti"
      >
        <CompositionDonut
          items={composicaoPatrimonio}
          total={data?.patrimonio_total ?? undefined}
          emptyLabel="Sem dados patrimoniais"
        />
        <Link
          to="/patrimonio"
          className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
        >
          Detalhar patrimônio →
        </Link>
      </SectionCard>

      <Tabs defaultValue="visao">
        <TabsList>
          <TabsTrigger value="visao">Esta safra</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="fiscal">Fiscal</TabsTrigger>
        </TabsList>

        <TabsContent value="visao" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-5">
            <SectionCard
              className="xl:col-span-3"
              title="Movimentação (encaixe)"
              description="Será preenchida pelo módulo Financeiro — estado vazio real."
            >
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={EMPTY_TREND}>
                    <defs>
                      <linearGradient id="fillTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 16,
                        border: "1px solid var(--border)",
                        boxShadow: "var(--shadow-sm-token)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="valor"
                      stroke="var(--primary)"
                      fill="url(#fillTrend)"
                      strokeWidth={2.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard
              className="xl:col-span-2"
              title="Balanço por emissor"
              description="Proporção 50/50 entra no módulo Financeiro."
            >
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={EMPTY_PIE}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={82}
                      paddingAngle={3}
                    >
                      {EMPTY_PIE.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} opacity={0.35} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {EMPTY_PIE.map((e) => (
                  <span key={e.name} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <i className="size-2.5 rounded-sm" style={{ background: e.color }} />
                    {e.name}
                  </span>
                ))}
              </div>
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="financeiro">
          <SectionCard
            title="Despesas por categoria"
            description="Aguardando importação de XML — layout já no padrão do design system."
          >
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={EMPTY_BARS} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="nome" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 16,
                      border: "1px solid var(--border)",
                    }}
                  />
                  <Bar dataKey="valor" fill="var(--primary)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="fiscal">
          <SectionCard title="Fila fiscal">
            <div className="rounded-xl border border-dashed border-border bg-surface-soft px-6 py-14 text-center">
              <p className="text-base font-bold text-foreground">Sem lançamentos ainda</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                XMLs, notas e conciliação vão aparecer aqui. A navegação e o visual já estão
                preparados para o MVP Financeiro & Fiscal.
              </p>
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
