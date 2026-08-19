import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Landmark,
  Scale,
  ShieldCheck,
  Sprout,
  TriangleAlert,
} from "lucide-react";
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
import { KpiCard, RingStat, SectionCard } from "@/components/design-system";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { resumoEmissores, useEmissor } from "@/lib/emissor-context";
import { formatBRL, formatPctDecimal } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | Sistema Grupo Mandotti" },
      {
        name: "description",
        content: "Panorama de emissores, fazendas e certificados do Grupo Mandotti.",
      },
      { property: "og:title", content: "Dashboard | Sistema Grupo Mandotti" },
      {
        property: "og:description",
        content: "Panorama de emissores, fazendas e certificados do Grupo Mandotti.",
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
  const { emissores, emissorIds } = useEmissor();

  const { data } = useQuery({
    queryKey: ["dashboard", emissorIds],
    enabled: emissorIds.length > 0,
    queryFn: async () => {
      const [fazendas, certificados, resumo, config, producao] = await Promise.all([
        supabase
          .from("fazendas")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .in("emissor_id", emissorIds),
        supabase
          .from("certificados")
          .select("validade")
          .is("deleted_at", null)
          .in("emissor_id", emissorIds),
        supabase.from("resumo_patrimonial").select("*").limit(1).maybeSingle(),
        supabase.from("configuracoes_grupo").select("meta_hectares_grupo").limit(1).maybeSingle(),
        supabase
          .from("producao_grupo_safra")
          .select("area_plantio_ha")
          .eq("safra", "2026/27")
          .eq("cultura_codigo", "soja")
          .eq("ciclo", "safra")
          .maybeSingle(),
      ]);

      const hoje = new Date();
      const limite = new Date(hoje.getTime() + 30 * 86400000);
      const vencendo = (certificados.data ?? []).filter(
        (c) => c.validade && new Date(c.validade) <= limite,
      ).length;

      return {
        fazendas: fazendas.count ?? 0,
        certificados: certificados.data?.length ?? 0,
        vencendo,
        resumo: resumo.data,
        metaHa: config.data?.meta_hectares_grupo ?? 6000,
        areaSafra2627: producao.data?.area_plantio_ha ?? 0,
      };
    },
  });

  if (!emissorIds.length) {
    return (
      <div>
        <PageHeader
          breadcrumb="Operação · Visão geral"
          title="Dashboard"
          description="Selecione ao menos um emissor para ver os indicadores."
        />
        <SectionCard title="Sem visão selecionada">
          <div className="py-10 text-center text-sm text-muted-foreground">
            Selecione ao menos um emissor no topo da tela.
          </div>
        </SectionCard>
      </div>
    );
  }

  const certTotal = data?.certificados ?? 0;
  const certOk = Math.max(0, certTotal - (data?.vencendo ?? 0);

  const composicaoPatrimonio = useMemo(() => {
    const r = data?.resumo;
    if (!r) return [];
    return [
      { name: "Imóveis", value: r.imoveis },
      { name: "Maquinários", value: r.maquinarios_veiculos },
      { name: "Participações", value: r.participacoes_societarias },
      { name: "Animais", value: r.animais },
      { name: "Outros", value: r.outros_bens },
    ].filter((x) => x.value > 0);
  }, [data?.resumo]);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Operação · Visão geral"
        title="Painel central"
        description={resumoEmissores(
          emissores.filter((e) => emissorIds.includes(e.id)),
          emissores.length,
        )}
      />

      <div className="grid gap-4 xl:grid-cols-5">
        <SectionCard
          className="xl:col-span-3"
          title="Gestão visual · Patrimônio"
          description="Composição consolidada do grupo — dados da ficha cadastral"
        >
          <div className="grid gap-6 md:grid-cols-2 md:items-center">
            <div className="h-[220px]">
              {composicaoPatrimonio.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={composicaoPatrimonio}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={2}
                    >
                      {composicaoPatrimonio.map((entry, i) => (
                        <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatBRL(v)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Sem dados patrimoniais
                </p>
              )}
            </div>
            <div className="space-y-3">
              {composicaoPatrimonio.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
                  <span className="inline-flex items-center gap-2">
                    <i
                      className="size-2.5 rounded-sm"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    {item.name}
                  </span>
                  <span className="font-mono-nums font-semibold">{formatBRL(item.value)}</span>
                </div>
              ))}
              <Link
                to="/patrimonio"
                className="inline-block pt-2 text-sm font-semibold text-primary hover:underline"
              >
                Ver patrimônio completo →
              </Link>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          className="xl:col-span-2"
          title="Indicadores-chave"
          description="Safra 26/27 e estrutura do grupo"
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <RingStat
              label="Área soja 26/27"
              value={data?.areaSafra2627 ?? 0}
              total={data?.metaHa ?? 6000}
              color="var(--chart-2)"
            />
            <RingStat
              label="Endividamento"
              value={Math.round((data?.resumo?.endividamento_pct ?? 0) * 100)}
              total={100}
              color="var(--chart-4)"
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl border border-border/80 bg-surface-soft px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Fazendas
              </p>
              <p className="mt-1 text-2xl font-extrabold">{data?.fazendas ?? 0}</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-surface-soft px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Patrimônio líquido
              </p>
              <p className="mt-1 text-sm font-extrabold leading-tight">
                {formatBRL(data?.resumo?.patrimonio_liquido)}
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Patrimônio total"
          value={formatBRL(data?.resumo?.patrimonio_total)}
          icon={Landmark}
          tone="info"
          hint={
            <Link to="/patrimonio" className="text-primary hover:underline">
              Ver composição →
            </Link>
          }
        />
        <KpiCard
          label="Endividamento"
          value={formatPctDecimal(data?.resumo?.endividamento_pct)}
          icon={Scale}
          tone="warning"
          hint={`Passivo ${formatBRL(data?.resumo?.passivo_total)}`}
        />
        <KpiCard
          label="Fazendas"
          value={data?.fazendas ?? 0}
          icon={Sprout}
          tone="success"
          hint="Cadastro ativo"
        />
        <KpiCard
          label="Certificados · 30d"
          value={data?.vencendo ?? 0}
          icon={TriangleAlert}
          tone={data?.vencendo ? "warning" : "default"}
          hint={`${certTotal} no total`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Emissores"
          value={emissorIds.length}
          icon={Building2}
          hint="Visão filtrada no seletor"
        />
        <KpiCard
          label="Certificados"
          value={certTotal}
          icon={ShieldCheck}
          tone="info"
          hint="Vinculados aos emissores"
        />
        <KpiCard
          label="Patrimônio líquido"
          value={formatBRL(data?.resumo?.patrimonio_liquido)}
          icon={Landmark}
          hint="Planilha Mandotti"
        />
        <KpiCard
          label="Maquinários"
          value={formatBRL(data?.resumo?.maquinarios_veiculos)}
          icon={Building2}
          hint="79 itens na planilha"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <RingStat label="Certificados ok" value={certOk} total={Math.max(certTotal, 1)} />
        <RingStat
          label="Área soja 26/27"
          value={data?.areaSafra2627 ?? 0}
          total={data?.metaHa ?? 6000}
          color="var(--chart-2)"
        />
        <RingStat
          label="Emissores ativos"
          value={emissorIds.length}
          total={Math.max(emissores.length, 1)}
          color="var(--chart-3)"
        />
        <RingStat
          label="Alertas"
          value={data?.vencendo ?? 0}
          total={Math.max(certTotal, 1)}
          color="var(--chart-4)"
        />
      </div>

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
                        borderRadius: 12,
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
                      borderRadius: 12,
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
