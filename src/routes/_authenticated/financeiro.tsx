import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
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
import { KpiCard, SectionCard } from "@/components/design-system";
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
import { formatBRL, formatDateBR } from "@/lib/format";
import { useEmissor } from "@/lib/emissor-context";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({
    meta: [{ title: "Financeiro | Sistema Grupo Mandotti" }],
  }),
  component: FinanceiroPage,
});

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

  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias_financeiras"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias_financeiras")
        .select("*")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: proporcao } = useQuery({
    queryKey: ["proporcoes_emissores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proporcoes_emissores")
        .select("*")
        .is("deleted_at", null)
        .eq("ativo", true)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: lancamentos = [], isLoading } = useQuery({
    queryKey: ["lancamentos", emissorIds],
    enabled: emissorIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lancamentos")
        .select("*")
        .is("deleted_at", null)
        .in("emissor_id", emissorIds)
        .order("data_competencia", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const despesas = lancamentos.filter((l) => l.tipo === "despesa");
  const receitas = lancamentos.filter((l) => l.tipo === "receita");
  const totalDespesas = despesas.reduce((a, l) => a + Number(l.valor), 0);
  const totalReceitas = receitas.reduce((a, l) => a + Number(l.valor), 0);

  const porCategoria = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of despesas) {
      const nome = categorias.find((c) => c.id === l.categoria_id)?.nome ?? "Sem categoria";
      map.set(nome, (map.get(nome) ?? 0) + Number(l.valor));
    }
    return [...map.entries()].map(([nome, valor]) => ({ nome, valor }));
  }, [despesas, categorias]);

  const balanco = useMemo(() => {
    if (!proporcao) return null;
    const aId = proporcao.emissor_a_id;
    const bId = proporcao.emissor_b_id;
    const alvoA = Number(proporcao.percentual_a);
    const alvoB = 100 - alvoA;
    const somaA = despesas
      .filter((l) => l.emissor_id === aId)
      .reduce((acc, l) => acc + Number(l.valor), 0);
    const somaB = despesas
      .filter((l) => l.emissor_id === bId)
      .reduce((acc, l) => acc + Number(l.valor), 0);
    const total = somaA + somaB;
    const realA = total > 0 ? (somaA / total) * 100 : alvoA;
    const realB = total > 0 ? (somaB / total) * 100 : alvoB;
    const nomeA =
      emissores.find((e) => e.id === aId)?.nome_fantasia ||
      emissores.find((e) => e.id === aId)?.razao_social ||
      "Emissor A";
    const nomeB =
      emissores.find((e) => e.id === bId)?.nome_fantasia ||
      emissores.find((e) => e.id === bId)?.razao_social ||
      "Emissor B";
    const recomendar = realA > alvoA + 2 ? nomeB : realB > alvoB + 2 ? nomeA : "Equilibrado";
    return { nomeA, nomeB, alvoA, alvoB, realA, realB, somaA, somaB, recomendar, total };
  }, [proporcao, despesas, emissores]);

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
      qc.invalidateQueries({ queryKey: ["lancamentos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!emissorIds.length) {
    return (
      <div>
        <PageHeader breadcrumb="Financeiro" title="Painel financeiro" />
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
        breadcrumb="Financeiro"
        title="Painel financeiro"
        description="Lançamentos, categorias e balanço parametrizável entre emissores."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to="/financeiro/xml">Importar XML</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/financeiro/conciliacao">Conciliação</Link>
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Receitas" value={formatBRL(totalReceitas)} tone="success" />
        <KpiCard label="Despesas" value={formatBRL(totalDespesas)} tone="warning" />
        <KpiCard label="Resultado" value={formatBRL(totalReceitas - totalDespesas)} />
        <KpiCard label="Lançamentos" value={lancamentos.length} />
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <SectionCard
          className="xl:col-span-3"
          title="Despesas por categoria"
          description="Baseado nos lançamentos do filtro atual."
        >
          <div className="h-[260px]">
            {porCategoria.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porCategoria} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="nome" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v: number) => formatBRL(v)} />
                  <Bar dataKey="valor" fill="var(--primary)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">
                Sem despesas ainda — importe XML ou lance manualmente.
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          className="xl:col-span-2"
          title="Balanço parametrizável"
          description={
            proporcao
              ? `Meta ${proporcao.percentual_a.toFixed(0)}/${(100 - Number(proporcao.percentual_a)).toFixed(0)}`
              : "Configure um par de emissores"
          }
        >
          {balanco && balanco.total > 0 ? (
            <>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: balanco.nomeA, value: balanco.somaA, color: "var(--emissor-eder)" },
                        { name: balanco.nomeB, value: balanco.somaB, color: "var(--emissor-nagyla)" },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={72}
                      paddingAngle={3}
                    >
                      <Cell fill="var(--emissor-eder)" />
                      <Cell fill="var(--emissor-nagyla)" />
                    </Pie>
                    <Tooltip formatter={(v: number) => formatBRL(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 text-sm">
                <p>
                  {balanco.nomeA}:{" "}
                  <strong className="font-mono-nums">{balanco.realA.toFixed(1)}%</strong> (meta{" "}
                  {balanco.alvoA}%)
                </p>
                <p>
                  {balanco.nomeB}:{" "}
                  <strong className="font-mono-nums">{balanco.realB.toFixed(1)}%</strong> (meta{" "}
                  {balanco.alvoB}%)
                </p>
                <Badge variant={balanco.recomendar === "Equilibrado" ? "success" : "warning"}>
                  {balanco.recomendar === "Equilibrado"
                    ? "Proporção equilibrada"
                    : `Emitir próxima nota em: ${balanco.recomendar}`}
                </Badge>
              </div>
            </>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              O balanço aparece quando houver despesas nos dois emissores do par (hoje: Eder ×
              Nagyla, 50/50 parametrizável).
            </p>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Últimos lançamentos">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : lancamentos.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhum lançamento. Use importação XML ou cadastro manual.
          </p>
        ) : (
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
              {lancamentos.map((l) => (
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
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, tipo: v as typeof form.tipo }))
                  }
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
