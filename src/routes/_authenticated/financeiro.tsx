import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, FileText, Landmark, List, Plus, Scale, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/AppShell";
import {
  DonutDistribution,
  RankedBarList,
  TimelineBarChart,
} from "@/components/charts/MandottiCharts";
import { KpiCard, SectionCard } from "@/components/design-system";
import { TabelaPreview } from "@/components/TabelaPreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePerfil, useSession } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, formatDateBR, formatPctDecimal } from "@/lib/format";
import { useEmissor } from "@/lib/emissor-context";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({
    meta: [{ title: "Financeiro | Sistema Grupo Mandotti" }],
  }),
  component: FinanceiroPage,
});

const CRONOGRAMA = [
  { key: "cronograma_ate_jun26", label: "Até jun/26" },
  { key: "cronograma_jul26_jun27", label: "Jul/26–jun/27" },
  { key: "cronograma_jul27_jun28", label: "Jul/27–jun/28" },
  { key: "cronograma_jul28_jun29", label: "Jul/28–jun/29" },
  { key: "cronograma_jul29_jun30", label: "Jul/29–jun/30" },
  { key: "cronograma_apos_jun30", label: "Após jun/30" },
] as const;

function KpiSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-2xl" />
      ))}
    </div>
  );
}

function FinanceiroPage() {
  const qc = useQueryClient();
  const { user } = useSession();
  const { pode } = usePerfil(user);
  const { emissores, emissorIds } = useEmissor();
  const podeEditar = pode("/financeiro", "editar");
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({
    emissor_id: "",
    categoria_id: "",
    tipo: "despesa" as "despesa" | "receita" | "transferencia",
    descricao: "",
    valor: "",
    data_competencia: new Date().toISOString().slice(0, 10),
    fornecedor: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["financeiro-painel", emissorIds],
    enabled: emissorIds.length > 0,
    queryFn: async () => {
      const [resumo, inst, passivos, categorias, lancamentos] = await Promise.all([
        supabase.from("resumo_patrimonial").select("*").limit(1).maybeSingle(),
        supabase
          .from("passivo_por_instituicao")
          .select("*")
          .order("saldo_devedor", { ascending: false }),
        supabase
          .from("passivos")
          .select("*")
          .is("deleted_at", null)
          .in("emissor_id", emissorIds)
          .order("saldo_devedor", { ascending: false }),
        supabase.from("categorias_financeiras").select("*").eq("ativo", true).order("nome"),
        supabase
          .from("lancamentos")
          .select("*")
          .is("deleted_at", null)
          .in("emissor_id", emissorIds)
          .order("data_competencia", { ascending: false })
          .limit(200),
      ]);
      if (resumo.error) throw resumo.error;
      if (inst.error) throw inst.error;
      if (passivos.error) throw passivos.error;
      if (categorias.error) throw categorias.error;
      if (lancamentos.error) throw lancamentos.error;

      return {
        resumo: resumo.data,
        inst: inst.data ?? [],
        passivos: passivos.data ?? [],
        categorias: categorias.data ?? [],
        lancamentos: lancamentos.data ?? [],
      };
    },
  });

  const resumo = data?.resumo;
  const passivos = data?.passivos ?? [];
  const instituicoes = data?.inst ?? [];
  const categorias = data?.categorias ?? [];
  const lancamentos = data?.lancamentos ?? [];

  const saldoPassivos = passivos.reduce((acc, p) => acc + (p.saldo_devedor ?? 0), 0);
  const jurosProjetados = passivos.reduce((acc, p) => acc + (p.total_projetado ?? 0), 0);

  const instituicoesChart = useMemo(
    () =>
      instituicoes.map((row, i) => ({
        label: row.instituicao,
        value: row.saldo_devedor ?? 0,
        color: `var(--chart-${(i % 5) + 1})`,
      })),
    [instituicoes],
  );

  const cronogramaChart = useMemo(
    () =>
      CRONOGRAMA.map((c) => ({
        label: c.label,
        value: Number(resumo?.[c.key] ?? 0),
      })),
    [resumo],
  );

  const porTitularChart = useMemo(() => {
    if (!resumo) return [];
    return [
      { label: "Eder Mandotti", value: resumo.passivo_eder ?? 0, color: "var(--emissor-eder)" },
      { label: "Nagyla Pollyanna", value: resumo.passivo_nagyla ?? 0, color: "var(--emissor-nagyla)" },
    ].filter((d) => d.value > 0);
  }, [resumo]);

  const despesas = lancamentos.filter((l) => l.tipo === "despesa");
  const receitas = lancamentos.filter((l) => l.tipo === "receita");
  const totalDespesas = despesas.reduce((a, l) => a + Number(l.valor), 0);
  const totalReceitas = receitas.reduce((a, l) => a + Number(l.valor), 0);

  const criar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("lancamentos").insert({
        emissor_id: form.emissor_id,
        categoria_id: form.categoria_id || null,
        tipo: form.tipo,
        descricao: form.descricao,
        valor: Number(form.valor),
        data_competencia: form.data_competencia,
        fornecedor: form.fornecedor || null,
        origem: "manual",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lançamento criado");
      setAberto(false);
      qc.invalidateQueries({ queryKey: ["financeiro-painel"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!emissorIds.length) {
    return (
      <div>
        <PageHeader
          title="Painel financeiro"
          description="Endividamento, cronograma SCR e passivos da ficha cadastral — mais lançamentos operacionais (XML/manual)."
        />
        <SectionCard title="Selecione emissores">
          <p className="py-8 text-center text-sm text-muted-foreground">
            Selecione ao menos um emissor no topo.
          </p>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Painel financeiro"
        description="Endividamento, cronograma SCR e passivos da ficha cadastral — mais lançamentos operacionais (XML/manual)."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to="/passivos">
                Passivos · SCR <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/importacao-xml">Importar XML</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/conciliacao">Conciliação</Link>
            </Button>
            {podeEditar ? (
              <Button
                onClick={() => {
                  setForm((f) => ({ ...f, emissor_id: emissorIds[0] ?? "" }));
                  setAberto(true);
                }}
              >
                <Plus className="size-4" /> Lançamento
              </Button>
            ) : null}
          </div>
        }
      />

      {isLoading ? (
        <KpiSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Passivo total"
            value={formatBRL(resumo?.passivo_total ?? saldoPassivos)}
            icon={Scale}
            tone="warning"
          />
          <KpiCard
            label="Patrimônio líquido"
            value={formatBRL(resumo?.patrimonio_liquido)}
            icon={Landmark}
            tone="success"
          />
          <KpiCard
            label="Endividamento"
            value={resumo ? formatPctDecimal(resumo.endividamento_pct) : "—"}
            icon={TrendingDown}
          />
          <KpiCard
            label="Contratos SCR"
            value={passivos.length}
            icon={FileText}
            hint={jurosProjetados > 0 ? `Juros proj. ${formatBRL(jurosProjetados)}` : undefined}
          />
        </div>
      )}

      {/* Visão analítica — endividamento */}
      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard
          title="Passivo por instituição"
          description="Ranking de saldo devedor por banco · Resumo Executivo"
        >
          {isLoading ? (
            <Skeleton className="h-[280px] w-full rounded-xl" />
          ) : (
            <RankedBarList items={instituicoesChart} emptyLabel="Sem dados de passivo por instituição." />
          )}
        </SectionCard>

        <SectionCard
          title="Passivo por titular"
          description="Distribuição Eder × Nagyla · SCR consolidado"
        >
          {isLoading ? (
            <Skeleton className="h-[280px] w-full rounded-xl" />
          ) : (
            <DonutDistribution
              items={porTitularChart}
              centerLabel="Passivo"
              emptyLabel="Dados de titular indisponíveis no resumo."
            />
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Cronograma de amortização"
        description="Vencimentos projetados do endividamento · visão temporal"
      >
        {isLoading ? (
          <Skeleton className="h-[260px] w-full rounded-xl" />
        ) : (
          <TimelineBarChart
            items={cronogramaChart}
            color="var(--chart-2)"
            emptyLabel="Cronograma não disponível no resumo."
          />
        )}
      </SectionCard>

      <SectionCard
        title="Contratos SCR"
        description={`${passivos.length} contrato(s) nos emissores selecionados.`}
        action={
          <Button variant="ghost" size="sm" asChild>
            <Link to="/passivos">Ver todos</Link>
          </Button>
        }
      >
        {isLoading ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : passivos.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhum contrato para os emissores selecionados.
          </p>
        ) : (
          <TabelaPreview rows={passivos}>
            {(visiveis) => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titular</TableHead>
                <TableHead>Banco</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="text-right">Taxa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiveis.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    {emissores.find((e) => e.id === p.emissor_id)?.nome_fantasia ||
                      emissores.find((e) => e.id === p.emissor_id)?.razao_social}
                  </TableCell>
                  <TableCell>{p.instituicao}</TableCell>
                  <TableCell className="max-w-[220px] truncate">{p.contrato_finalidade}</TableCell>
                  <TableCell>{p.vencimento_final ? formatDateBR(p.vencimento_final) : "—"}</TableCell>
                  <TableCell className="text-right font-mono-nums">
                    {formatBRL(p.saldo_devedor)}
                  </TableCell>
                  <TableCell className="text-right font-mono-nums">
                    {p.taxa_juros != null ? formatPctDecimal(p.taxa_juros) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
            )}
          </TabelaPreview>
        )}
      </SectionCard>

      <SectionCard
        title="Lançamentos operacionais"
        description=""
      >
        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          <KpiCard label="Receitas" value={formatBRL(totalReceitas)} icon={TrendingUp} tone="success" />
          <KpiCard label="Despesas" value={formatBRL(totalDespesas)} icon={TrendingDown} tone="warning" />
          <KpiCard label="Lançamentos" value={lancamentos.length} icon={List} />
        </div>
        {isLoading ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : lancamentos.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum lançamento operacional ainda. Use importação XML ou cadastro manual acima.
          </p>
        ) : (
          <TabelaPreview rows={lancamentos}>
            {(visiveis) => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Emissor</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiveis.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{formatDateBR(l.data_competencia)}</TableCell>
                  <TableCell>
                    {emissores.find((e) => e.id === l.emissor_id)?.nome_fantasia ||
                      emissores.find((e) => e.id === l.emissor_id)?.razao_social}
                  </TableCell>
                  <TableCell className="max-w-[240px] truncate">{l.descricao}</TableCell>
                  <TableCell>
                    {categorias.find((c) => c.id === l.categoria_id)?.nome ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="muted">{l.origem}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono-nums">
                    {l.tipo === "despesa" ? "−" : "+"}
                    {formatBRL(l.valor)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
            )}
          </TabelaPreview>
        )}
      </SectionCard>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo lançamento</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>Emissor</Label>
              <Select
                value={form.emissor_id}
                onValueChange={(v) => setForm((f) => ({ ...f, emissor_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {emissores
                    .filter((e) => emissorIds.includes(e.id))
                    .map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nome_fantasia || e.razao_social}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={form.tipo}
                  onValueChange={(v) => setForm((f) => ({ ...f, tipo: v as typeof form.tipo }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="despesa">Despesa</SelectItem>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={form.categoria_id}
                  onValueChange={(v) => setForm((f) => ({ ...f, categoria_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.valor}
                  onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={form.data_competencia}
                  onChange={(e) => setForm((f) => ({ ...f, data_competencia: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fornecedor</Label>
              <Input
                value={form.fornecedor}
                onChange={(e) => setForm((f) => ({ ...f, fornecedor: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!form.emissor_id || !form.descricao || !form.valor || criar.isPending}
              onClick={() => criar.mutate()}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
