import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  Home,
  Landmark,
  Scale,
  Tractor,
  Users,
} from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { PageHeader } from "@/components/AppShell";
import { KpiCard, SectionCard } from "@/components/design-system";
import { TabelaPreview } from "@/components/TabelaPreview";
import { Badge } from "@/components/ui/badge";
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
import { formatBRL, formatDateBR, formatPctDecimal } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/patrimonio")({
  head: () => ({
    meta: [
      { title: "Patrimônio | Sistema Grupo Mandotti" },
      {
        name: "description",
        content: "Composição patrimonial, bens e cadastro do Grupo Mandotti.",
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

function PatrimonioPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["patrimonio"],
    queryFn: async () => {
      const [resumo, bens, pessoas, passivoInst] = await Promise.all([
        supabase.from("resumo_patrimonial").select("*").limit(1).maybeSingle(),
        supabase.from("patrimonio_bens").select("*").order("ordem"),
        supabase.from("cadastro_pessoas").select("*").order("ordem"),
        supabase.from("passivo_por_instituicao").select("*").order("saldo_devedor", { ascending: false }),
      ]);
      if (resumo.error) throw resumo.error;
      if (bens.error) throw bens.error;
      if (pessoas.error) throw pessoas.error;
      if (passivoInst.error) throw passivoInst.error;
      return {
        resumo: resumo.data,
        bens: bens.data ?? [],
        pessoas: pessoas.data ?? [],
        passivoInst: passivoInst.data ?? [],
      };
    },
  });

  const r = data?.resumo;
  const participacoes = data?.bens.filter((b) => b.tipo === "participacao") ?? [];
  const imoveis = data?.bens.filter((b) => b.tipo === "imovel") ?? [];

  const composicao = r
    ? [
        { name: "Imóveis", value: r.imoveis },
        { name: "Maquinários", value: r.maquinarios_veiculos },
        { name: "Participações", value: r.participacoes_societarias },
        { name: "Animais", value: r.animais },
        { name: "Outros", value: r.outros_bens },
      ].filter((x) => x.value > 0)
    : [];

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
          <div className="h-[220px]">
            {composicao.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={composicao} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={2}>
                    {composicao.map((entry, i) => (
                      <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatBRL(v)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">Sem dados</p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          className="xl:col-span-3"
          title="Cronograma de amortização (grupo)"
          description="Totais consolidados — detalhe por contrato em Passivos · SCR"
        >
          <TabelaPreview rows={CRONOGRAMA}>
            {(visiveis) => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiveis.map((p) => (
                <TableRow key={p.key}>
                  <TableCell>{p.label}</TableCell>
                  <TableCell className="text-right font-mono-nums">
                    {formatBRL(r?.[p.key as keyof typeof r] as number | null | undefined)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
            )}
          </TabelaPreview>
        </SectionCard>
      </div>

      <Tabs defaultValue="participacoes">
        <TabsList>
          <TabsTrigger value="participacoes">Participações ({participacoes.length})</TabsTrigger>
          <TabsTrigger value="imoveis">Imóveis ({imoveis.length})</TabsTrigger>
          <TabsTrigger value="cadastro">Cadastro ({data?.pessoas.length ?? 0})</TabsTrigger>
          <TabsTrigger value="passivo-inst">Passivo por banco ({data?.passivoInst.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="participacoes">
          <SectionCard title="Participações societárias" description="Aba Dados Patrimoniais">
            <TabelaBens rows={participacoes} loading={isLoading} />
          </SectionCard>
        </TabsContent>

        <TabsContent value="imoveis">
          <SectionCard title="Bens imóveis" description="Glebas, residências e lotes fora do quadro operacional de fazendas">
            <TabelaBens rows={imoveis} loading={isLoading} showMunicipio />
          </SectionCard>
        </TabsContent>

        <TabsContent value="cadastro">
          <SectionCard title="Dados cadastrais" description="Titular, cônjuge e correspondência — importados da ficha">
            {isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {data?.pessoas.map((p) => (
                  <div key={p.id} className="rounded-xl border border-border/80 bg-surface-soft p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="secondary">{labelTipo(p.tipo)}</Badge>
                    </div>
                    <p className="font-semibold text-foreground">{p.nome}</p>
                    <dl className="mt-3 space-y-1.5 text-sm">
                      {p.email && (
                        <div>
                          <dt className="text-muted-foreground">E-mail</dt>
                          <dd>{p.email}</dd>
                        </div>
                      )}
                      {p.telefone && (
                        <div>
                          <dt className="text-muted-foreground">Telefone</dt>
                          <dd>{p.telefone}</dd>
                        </div>
                      )}
                      {p.endereco && (
                        <div>
                          <dt className="text-muted-foreground">Endereço</dt>
                          <dd>{p.endereco}</dd>
                        </div>
                      )}
                      {(p.cidade || p.cep) && (
                        <div>
                          <dt className="text-muted-foreground">Cidade / CEP</dt>
                          <dd>
                            {[p.cidade, p.uf, p.cep].filter(Boolean).join(" · ")}
                          </dd>
                        </div>
                      )}
                      {p.profissao && (
                        <div>
                          <dt className="text-muted-foreground">Profissão</dt>
                          <dd>{p.profissao}</dd>
                        </div>
                      )}
                      {p.data_nascimento && (
                        <div>
                          <dt className="text-muted-foreground">Nascimento</dt>
                          <dd>{formatDateBR(p.data_nascimento)}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="passivo-inst">
          <SectionCard
            title="Saldo por instituição"
            description="Consolidado do resumo executivo — contratos individuais em Passivos · SCR"
          >
            <TabelaPreview rows={data?.passivoInst ?? []}>
              {(visiveis) => (
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
              )}
            </TabelaPreview>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function labelTipo(tipo: string) {
  if (tipo === "titular") return "Titular";
  if (tipo === "conjuge") return "Cônjuge";
  return "Correspondência";
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
  if (loading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>;
  }
  if (!rows.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Nenhum registro</p>;
  }
  return (
    <TabelaPreview rows={rows}>
      {(visiveis) => (
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
      )}
    </TabelaPreview>
  );
}
