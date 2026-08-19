import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

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
import { formatBRL } from "@/lib/format";
import { useEmissor } from "@/lib/emissor-context";
import {
  STATUS_MANUTENCAO_LABEL,
  statusManutencao,
  type StatusManutencao,
} from "@/lib/maquinario-alerts";

export const Route = createFileRoute("/_authenticated/maquinario")({
  head: () => ({
    meta: [{ title: "Maquinário | Sistema Grupo Mandotti" }],
  }),
  component: MaquinarioPage,
});

const VAZIO = {
  emissor_id: "",
  nome: "",
  categoria: "Máquina",
  fazenda_nome: "",
  marca: "",
  modelo: "",
  ano: "",
  valor_aquisicao: "",
  custo_manutencao_acumulado: "",
  depreciacao_anual_pct: "10",
  cor: "",
  chassi_serie: "",
};

const STATUS_BADGE: Record<StatusManutencao, "default" | "secondary" | "destructive"> = {
  saudavel: "default",
  atencao: "secondary",
  avaliar_troca: "destructive",
};

type Ordenacao = "valor" | "status";

type MaquinarioRow = {
  id: string;
  emissor_id: string;
  nome: string;
  categoria: string;
  fazenda_nome: string | null;
  marca: string | null;
  modelo: string | null;
  ano: number | null;
  valor_aquisicao: number | null;
  custo_manutencao_acumulado: number;
  depreciacao_anual_pct: number | null;
  chassi_serie: string | null;
  ordem: number;
};

const STATUS_ORDEM: Record<StatusManutencao, number> = {
  avaliar_troca: 0,
  atencao: 1,
  saudavel: 2,
};

function statusDoAtivo(m: MaquinarioRow): StatusManutencao {
  return statusManutencao(m.valor_aquisicao, m.custo_manutencao_acumulado, m.depreciacao_anual_pct);
}

function ordenarMaquinarios(rows: MaquinarioRow[], ordem: Ordenacao): MaquinarioRow[] {
  const copia = [...rows];
  if (ordem === "valor") {
    return copia.sort((a, b) => (b.valor_aquisicao ?? 0) - (a.valor_aquisicao ?? 0));
  }
  return copia.sort((a, b) => {
    const diff = STATUS_ORDEM[statusDoAtivo(a)] - STATUS_ORDEM[statusDoAtivo(b)];
    if (diff !== 0) return diff;
    return (b.valor_aquisicao ?? 0) - (a.valor_aquisicao ?? 0);
  });
}

function FiltrosMaquinario({
  anos,
  proprietarios,
  equipamentos,
  ano,
  proprietario,
  equipamento,
  status,
  ordenacao,
  onAno,
  onProprietario,
  onEquipamento,
  onStatus,
  onOrdenacao,
}: {
  anos: number[];
  proprietarios: { id: string; nome: string }[];
  equipamentos: string[];
  ano: string;
  proprietario: string;
  equipamento: string;
  status: string;
  ordenacao: Ordenacao;
  onAno: (v: string) => void;
  onProprietario: (v: string) => void;
  onEquipamento: (v: string) => void;
  onStatus: (v: string) => void;
  onOrdenacao: (v: Ordenacao) => void;
}) {
  return (
    <aside className="w-full shrink-0 space-y-4 rounded-2xl border border-border/80 bg-surface-soft p-4 lg:w-56">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        Filtros
      </p>
      <div className="space-y-2">
        <Label className="text-xs">Ano</Label>
        <Select value={ano} onValueChange={onAno}>
          <SelectTrigger>
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {anos.map((a) => (
              <SelectItem key={a} value={String(a)}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Proprietário</Label>
        <Select value={proprietario} onValueChange={onProprietario}>
          <SelectTrigger>
            <SelectValue placeholder="Proprietário" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {proprietarios.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Equipamento</Label>
        <Select value={equipamento} onValueChange={onEquipamento}>
          <SelectTrigger>
            <SelectValue placeholder="Equipamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {equipamentos.map((e) => (
              <SelectItem key={e} value={e}>
                {e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Status</Label>
        <Select value={status} onValueChange={onStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="saudavel">{STATUS_MANUTENCAO_LABEL.saudavel}</SelectItem>
            <SelectItem value="atencao">{STATUS_MANUTENCAO_LABEL.atencao}</SelectItem>
            <SelectItem value="avaliar_troca">{STATUS_MANUTENCAO_LABEL.avaliar_troca}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2 border-t border-border/60 pt-4">
        <Label className="text-xs">Ordenar tabela</Label>
        <Select value={ordenacao} onValueChange={(v) => onOrdenacao(v as Ordenacao)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="valor">Valor</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </aside>
  );
}

function MaquinarioPage() {
  const qc = useQueryClient();
  const { user } = useSession();
  const { pode } = usePerfil(user);
  const { emissores, emissorIds } = useEmissor();
  const podeEditar = pode("/maquinario", "editar");
  const [anoFiltro, setAnoFiltro] = useState("todos");
  const [proprietarioFiltro, setProprietarioFiltro] = useState("todos");
  const [equipamentoFiltro, setEquipamentoFiltro] = useState("todos");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("valor");
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState(VAZIO);

  const { data = [], isLoading } = useQuery({
    queryKey: ["maquinarios", emissorIds],
    enabled: emissorIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maquinarios")
        .select("*")
        .is("deleted_at", null)
        .in("emissor_id", emissorIds)
        .order("ordem", { ascending: true });
      if (error) throw error;
      return data as MaquinarioRow[];
    },
  });

  const proprietarios = useMemo(
    () =>
      emissores
        .filter((e) => emissorIds.includes(e.id))
        .map((e) => ({
          id: e.id,
          nome: e.nome_fantasia || e.razao_social || e.id,
        }))
        .sort((a, b) => a.nome.localeCompare(b.nome)),
    [emissores, emissorIds],
  );

  const anos = useMemo(
    () =>
      [...new Set(data.map((m) => m.ano).filter((a): a is number => a != null))].sort(
        (a, b) => b - a,
      ),
    [data],
  );

  const equipamentos = useMemo(
    () => [...new Set(data.map((m) => m.nome).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [data],
  );

  const filtrados = useMemo(() => {
    let rows = data;
    if (anoFiltro !== "todos") rows = rows.filter((m) => m.ano === Number(anoFiltro));
    if (proprietarioFiltro !== "todos") {
      rows = rows.filter((m) => m.emissor_id === proprietarioFiltro);
    }
    if (equipamentoFiltro !== "todos") rows = rows.filter((m) => m.nome === equipamentoFiltro);
    if (statusFiltro !== "todos") {
      rows = rows.filter((m) => statusDoAtivo(m) === statusFiltro);
    }
    return ordenarMaquinarios(rows, ordenacao);
  }, [data, anoFiltro, proprietarioFiltro, equipamentoFiltro, statusFiltro, ordenacao]);

  const valorTotal = filtrados.reduce((acc, m) => acc + (m.valor_aquisicao ?? 0), 0);
  const manutTotal = filtrados.reduce((acc, m) => acc + (m.custo_manutencao_acumulado ?? 0), 0);
  const alertas = filtrados.filter((m) => statusDoAtivo(m) === "avaliar_troca").length;

  const criar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("maquinarios").insert({
        emissor_id: form.emissor_id,
        nome: form.nome,
        categoria: form.categoria,
        fazenda_nome: form.fazenda_nome || null,
        marca: form.marca || null,
        modelo: form.modelo || null,
        ano: form.ano ? Number(form.ano) : null,
        valor_aquisicao: form.valor_aquisicao ? Number(form.valor_aquisicao) : null,
        custo_manutencao_acumulado: form.custo_manutencao_acumulado
          ? Number(form.custo_manutencao_acumulado)
          : 0,
        depreciacao_anual_pct: form.depreciacao_anual_pct ? Number(form.depreciacao_anual_pct) : 10,
        cor: form.cor || null,
        chassi_serie: form.chassi_serie || null,
        ordem: (data.length || 0) + 1,
        ativo: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ativo cadastrado");
      setAberto(false);
      setForm(VAZIO);
      qc.invalidateQueries({ queryKey: ["maquinarios"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!emissorIds.length) {
    return (
      <div>
        <PageHeader breadcrumb="Cadastros" title="Maquinário" />
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
        breadcrumb="Cadastros · Ativos"
        title="Maquinário"
        description="Frota da planilha (78 itens). Alerta quando manutenção supera depreciação ou 12% do valor."
        action={
          podeEditar ? (
            <Button
              onClick={() => {
                setForm({ ...VAZIO, emissor_id: emissorIds[0] ?? "" });
                setAberto(true);
              }}
            >
              <Plus className="size-4" /> Novo ativo
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <KpiCard label="Ativos" value={filtrados.length} />
        <KpiCard label="Valor total" value={formatBRL(valorTotal)} tone="success" />
        <KpiCard label="Manutenção acum." value={formatBRL(manutTotal)} tone="warning" />
        <KpiCard label="Alertas de troca" value={alertas} tone={alertas > 0 ? "danger" : "default"} />
      </div>

      {alertas > 0 ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <span className="font-semibold text-destructive">Ponto de atenção:</span>{" "}
          {alertas} ativo(s) com custo de manutenção elevado — avaliar troca do equipamento.
        </div>
      ) : null}

      <SectionCard title="Frota" description="Dados importados da aba Maquinários.">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            {isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Equipamento</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Proprietário</TableHead>
                    <TableHead>Fazenda</TableHead>
                    <TableHead>Marca / Modelo</TableHead>
                    <TableHead>Ano</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Manut.</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                        Nenhum ativo com os filtros atuais.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtrados.map((m) => {
                      const st = statusDoAtivo(m);
                      return (
                        <TableRow key={m.id}>
                          <TableCell className="font-mono-nums text-muted-foreground">
                            {m.ordem}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{m.nome}</div>
                            {m.chassi_serie ? (
                              <div className="font-mono-nums text-xs text-muted-foreground">
                                {m.chassi_serie}
                              </div>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{m.categoria}</Badge>
                          </TableCell>
                          <TableCell>
                            {emissores.find((e) => e.id === m.emissor_id)?.nome_fantasia ||
                              emissores.find((e) => e.id === m.emissor_id)?.razao_social}
                          </TableCell>
                          <TableCell>{m.fazenda_nome || "—"}</TableCell>
                          <TableCell>
                            {[m.marca, m.modelo].filter(Boolean).join(" · ") || "—"}
                          </TableCell>
                          <TableCell className="font-mono-nums">{m.ano ?? "—"}</TableCell>
                          <TableCell className="text-right font-mono-nums">
                            {formatBRL(m.valor_aquisicao)}
                          </TableCell>
                          <TableCell className="text-right font-mono-nums">
                            {formatBRL(m.custo_manutencao_acumulado)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={STATUS_BADGE[st]}>{STATUS_MANUTENCAO_LABEL[st]}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </div>
          <FiltrosMaquinario
            anos={anos}
            proprietarios={proprietarios}
            equipamentos={equipamentos}
            ano={anoFiltro}
            proprietario={proprietarioFiltro}
            equipamento={equipamentoFiltro}
            status={statusFiltro}
            ordenacao={ordenacao}
            onAno={setAnoFiltro}
            onProprietario={setProprietarioFiltro}
            onEquipamento={setEquipamentoFiltro}
            onStatus={setStatusFiltro}
            onOrdenacao={setOrdenacao}
          />
        </div>
      </SectionCard>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo maquinário</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>Proprietário (emissor)</Label>
              <Select
                value={form.emissor_id}
                onValueChange={(v) => setForm((f) => ({ ...f, emissor_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
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
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input
                  value={form.categoria}
                  onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Ano</Label>
                <Input
                  type="number"
                  value={form.ano}
                  onChange={(e) => setForm((f) => ({ ...f, ano: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Marca</Label>
                <Input
                  value={form.marca}
                  onChange={(e) => setForm((f) => ({ ...f, marca: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Input
                  value={form.modelo}
                  onChange={(e) => setForm((f) => ({ ...f, modelo: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fazenda</Label>
              <Input
                value={form.fazenda_nome}
                onChange={(e) => setForm((f) => ({ ...f, fazenda_nome: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Valor aquisição</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.valor_aquisicao}
                  onChange={(e) => setForm((f) => ({ ...f, valor_aquisicao: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Manutenção acumulada</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.custo_manutencao_acumulado}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, custo_manutencao_acumulado: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Depreciação anual (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.depreciacao_anual_pct}
                  onChange={(e) => setForm((f) => ({ ...f, depreciacao_anual_pct: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Chassi / Série</Label>
                <Input
                  value={form.chassi_serie}
                  onChange={(e) => setForm((f) => ({ ...f, chassi_serie: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!form.emissor_id || !form.nome || criar.isPending}
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
