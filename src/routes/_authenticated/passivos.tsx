import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, FileText, Landmark, Plus, TrendingDown } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AcoesCadastro } from "@/components/AcoesCadastro";
import { PageHeader } from "@/components/AppShell";
import {
  DonutDistribution,
  HorizontalBarChart,
  RankedBarList,
  TimelineBarChart,
} from "@/components/charts/MandottiCharts";
import { KpiCard, SectionCard } from "@/components/design-system";
import { BarraFiltros, FiltroCard } from "@/components/LayoutAbasFiltros";
import {
  CabecalhoOrdenavel,
  TabelaPreview,
  type DirecaoOrdem,
} from "@/components/TabelaPreview";
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
import { emptyToNull, formatBRL, formatDateBR, formatPctDecimal, numOrNull } from "@/lib/format";
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

type PassivoRow = {
  id: string;
  emissor_id: string;
  instituicao: string;
  contrato_finalidade: string;
  taxa_juros: number | null;
  vencimento_final: string | null;
  saldo_devedor: number | null;
  total_projetado: number | null;
  status: string;
  pago_em: string | null;
  ate_jun_2026: number;
  jul26_jun27: number;
  jul27_jun28: number;
  jul28_jun29: number;
  jul29_jun30: number;
  apos_jun_2030: number;
  sem_cronograma: number;
};

type FormPassivo = {
  id?: string;
  emissor_id: string;
  instituicao: string;
  contrato_finalidade: string;
  taxa_juros: string;
  vencimento_final: string;
  saldo_devedor: string;
  total_projetado: string;
};

const VAZIO_PASSIVO: FormPassivo = {
  emissor_id: "",
  instituicao: "",
  contrato_finalidade: "",
  taxa_juros: "",
  vencimento_final: "",
  saldo_devedor: "",
  total_projetado: "",
};

type Ordenacao = "saldo" | "projetado" | "vencimento" | "instituicao" | "titular" | "taxa";

function PassivosPage() {
  const qc = useQueryClient();
  const { user } = useSession();
  const { pode } = usePerfil(user);
  const { emissores, emissorIds } = useEmissor();
  const podeEditar = pode("/passivos", "editar");
  const [banco, setBanco] = useState("todos");
  const [titular, setTitular] = useState("todos");
  const [situacao, setSituacao] = useState("abertos");
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("saldo");
  const [direcao, setDirecao] = useState<DirecaoOrdem>("desc");
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<FormPassivo>(VAZIO_PASSIVO);

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
      return data as PassivoRow[];
    },
  });

  const nomeTitular = (emissorId: string) =>
    emissores.find((e) => e.id === emissorId)?.nome_fantasia ||
    emissores.find((e) => e.id === emissorId)?.razao_social ||
    "—";

  const bancos = useMemo(
    () => [...new Set(data.map((p) => p.instituicao).filter(Boolean))].sort(),
    [data],
  );

  const titulares = useMemo(
    () =>
      emissores
        .filter((e) => emissorIds.includes(e.id) && data.some((p) => p.emissor_id === e.id))
        .map((e) => ({
          id: e.id,
          nome: e.nome_fantasia || e.razao_social || e.id,
        }))
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [data, emissores, emissorIds],
  );

  const salvar = useMutation({
    mutationFn: async (f: FormPassivo) => {
      if (!f.emissor_id || !f.instituicao.trim() || !f.contrato_finalidade.trim()) {
        throw new Error("Informe titular, instituição e contrato");
      }
      const payload = {
        emissor_id: f.emissor_id,
        instituicao: f.instituicao.trim(),
        contrato_finalidade: f.contrato_finalidade.trim(),
        taxa_juros: numOrNull(f.taxa_juros),
        vencimento_final: emptyToNull(f.vencimento_final),
        saldo_devedor: numOrNull(f.saldo_devedor),
        total_projetado: numOrNull(f.total_projetado),
        origem: "manual",
        status: "aberto",
      };
      const res = f.id
        ? await supabase.from("passivos").update(payload).eq("id", f.id)
        : await supabase.from("passivos").insert(payload);
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      toast.success("Contrato salvo");
      setAberto(false);
      setForm(VAZIO_PASSIVO);
      qc.invalidateQueries({ queryKey: ["passivos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const darBaixa = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("passivos")
        .update({ status: "pago", pago_em: new Date().toISOString().slice(0, 10) })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Baixa registrada como pago");
      qc.invalidateQueries({ queryKey: ["passivos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const arquivar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("passivos")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contrato excluído");
      qc.invalidateQueries({ queryKey: ["passivos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtrados = useMemo(() => {
    let rows = data;
    if (banco !== "todos") rows = rows.filter((p) => p.instituicao === banco);
    if (titular !== "todos") rows = rows.filter((p) => p.emissor_id === titular);
    if (situacao === "abertos") rows = rows.filter((p) => (p.status ?? "aberto") !== "pago");
    if (situacao === "pagos") rows = rows.filter((p) => p.status === "pago");

    const copia = [...rows];
    const fator = direcao === "asc" ? 1 : -1;
    copia.sort((a, b) => {
      switch (ordenacao) {
        case "saldo":
          return fator * ((a.saldo_devedor ?? 0) - (b.saldo_devedor ?? 0));
        case "projetado":
          return fator * ((a.total_projetado ?? 0) - (b.total_projetado ?? 0));
        case "taxa":
          return fator * ((a.taxa_juros ?? 0) - (b.taxa_juros ?? 0));
        case "vencimento": {
          const da = a.vencimento_final ?? "";
          const db = b.vencimento_final ?? "";
          return fator * da.localeCompare(db);
        }
        case "instituicao":
          return fator * a.instituicao.localeCompare(b.instituicao, "pt-BR");
        case "titular":
          return fator * nomeTitular(a.emissor_id).localeCompare(nomeTitular(b.emissor_id), "pt-BR");
        default:
          return 0;
      }
    });
    return copia;
  }, [data, banco, titular, situacao, ordenacao, direcao, emissores]);

  const ordenarPor = (campo: Ordenacao) => {
    if (ordenacao === campo) {
      setDirecao((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setOrdenacao(campo);
    setDirecao(campo === "instituicao" || campo === "titular" ? "asc" : "desc");
  };

  const saldoTotal = filtrados.reduce((acc, p) => acc + (p.saldo_devedor ?? 0), 0);
  const projetado = filtrados.reduce((acc, p) => acc + (p.total_projetado ?? 0), 0);

  const porTitular = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of filtrados) {
      const nome = nomeTitular(p.emissor_id);
      map.set(nome, (map.get(nome) ?? 0) + (p.saldo_devedor ?? 0));
    }
    return [...map.entries()]
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor);
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
        <PageHeader
          title="Passivos · SCR"
          description="Contratos da ficha cadastral — visão por titular, banco e ano."
        />
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
        title="Passivos · SCR"
        description="Cadastre contratos, filtre por banco/titular e dê baixa manual como pago."
        action={
          podeEditar ? (
            <Button
              onClick={() => {
                setForm({ ...VAZIO_PASSIVO, emissor_id: emissorIds[0] ?? "" });
                setAberto(true);
              }}
            >
              <Plus className="mr-2 size-4" />
              Novo contrato
            </Button>
          ) : null
        }
      />

      <BarraFiltros>
        <FiltroCard label="Titular">
          <Select value={titular} onValueChange={setTitular}>
            <SelectTrigger>
              <SelectValue placeholder="Titular" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {titulares.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FiltroCard>
        <FiltroCard label="Instituição">
          <Select value={banco} onValueChange={setBanco}>
            <SelectTrigger>
              <SelectValue placeholder="Banco" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas</SelectItem>
              {bancos.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FiltroCard>
        <FiltroCard label="Situação">
          <Select value={situacao} onValueChange={setSituacao}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="abertos">Em aberto</SelectItem>
              <SelectItem value="pagos">Pagos</SelectItem>
              <SelectItem value="todos">Todos</SelectItem>
            </SelectContent>
          </Select>
        </FiltroCard>
        <FiltroCard label="Ordenar">
          <Select
            value={ordenacao}
            onValueChange={(v) => {
              setOrdenacao(v as Ordenacao);
              setDirecao(v === "instituicao" || v === "titular" ? "asc" : "desc");
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="saldo">Saldo devedor</SelectItem>
              <SelectItem value="projetado">Projetado</SelectItem>
              <SelectItem value="vencimento">Vencimento</SelectItem>
              <SelectItem value="instituicao">Instituição</SelectItem>
              <SelectItem value="titular">Titular</SelectItem>
              <SelectItem value="taxa">Taxa</SelectItem>
            </SelectContent>
          </Select>
        </FiltroCard>
        <FiltroCard label="Direção">
          <Select value={direcao} onValueChange={(v) => setDirecao(v as DirecaoOrdem)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Maior → menor</SelectItem>
              <SelectItem value="asc">Menor → maior</SelectItem>
            </SelectContent>
          </Select>
        </FiltroCard>
      </BarraFiltros>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Contratos" value={filtrados.length} icon={FileText} />
        <KpiCard label="Saldo devedor" value={formatBRL(saldoTotal)} icon={Landmark} tone="warning" />
        <KpiCard label="Projetado c/ juros" value={formatBRL(projetado)} icon={TrendingDown} tone="danger" />
        <KpiCard
          label="Instituições"
          value={porBanco.length}
          icon={Building2}
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
          ) : filtrados.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhum contrato com os filtros atuais.
            </p>
          ) : (
            <TabelaPreview rows={filtrados}>
              {(visiveis) => (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <CabecalhoOrdenavel
                        label="Titular"
                        ativo={ordenacao === "titular"}
                        direcao={direcao}
                        onClick={() => ordenarPor("titular")}
                      />
                      <CabecalhoOrdenavel
                        label="Instituição"
                        ativo={ordenacao === "instituicao"}
                        direcao={direcao}
                        onClick={() => ordenarPor("instituicao")}
                      />
                      <TableHead>Contrato</TableHead>
                      <CabecalhoOrdenavel
                        label="Taxa"
                        ativo={ordenacao === "taxa"}
                        direcao={direcao}
                        onClick={() => ordenarPor("taxa")}
                      />
                      <CabecalhoOrdenavel
                        label="Vencimento"
                        ativo={ordenacao === "vencimento"}
                        direcao={direcao}
                        onClick={() => ordenarPor("vencimento")}
                      />
                      <CabecalhoOrdenavel
                        label="Saldo"
                        ativo={ordenacao === "saldo"}
                        direcao={direcao}
                        onClick={() => ordenarPor("saldo")}
                        align="right"
                      />
                      <CabecalhoOrdenavel
                        label="Projetado"
                        ativo={ordenacao === "projetado"}
                        direcao={direcao}
                        onClick={() => ordenarPor("projetado")}
                        align="right"
                      />
                      <TableHead>Situação</TableHead>
                      <TableHead className="w-32" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visiveis.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Badge variant="default">{nomeTitular(p.emissor_id)}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{p.instituicao}</TableCell>
                        <TableCell className="max-w-[280px] truncate">
                          {p.contrato_finalidade}
                        </TableCell>
                        <TableCell className="font-mono-nums">
                          {formatPctDecimal(p.taxa_juros)}
                        </TableCell>
                        <TableCell>{formatDateBR(p.vencimento_final)}</TableCell>
                        <TableCell className="text-right font-mono-nums">
                          {formatBRL(p.saldo_devedor)}
                        </TableCell>
                        <TableCell className="text-right font-mono-nums">
                          {formatBRL(p.total_projetado)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.status === "pago" ? "secondary" : "default"}>
                            {p.status === "pago"
                              ? `Pago${p.pago_em ? ` · ${formatDateBR(p.pago_em)}` : ""}`
                              : "Aberto"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {podeEditar ? (
                            <AcoesCadastro
                              onPago={
                                p.status !== "pago"
                                  ? () => {
                                      if (window.confirm("Marcar este contrato como pago?")) {
                                        darBaixa.mutate(p.id);
                                      }
                                    }
                                  : undefined
                              }
                              onEdit={() => {
                                setForm({
                                  id: p.id,
                                  emissor_id: p.emissor_id,
                                  instituicao: p.instituicao,
                                  contrato_finalidade: p.contrato_finalidade,
                                  taxa_juros: p.taxa_juros != null ? String(p.taxa_juros) : "",
                                  vencimento_final: p.vencimento_final ?? "",
                                  saldo_devedor: p.saldo_devedor != null ? String(p.saldo_devedor) : "",
                                  total_projetado:
                                    p.total_projetado != null ? String(p.total_projetado) : "",
                                });
                                setAberto(true);
                              }}
                              onDelete={() => {
                                if (window.confirm("Excluir este contrato?")) arquivar.mutate(p.id);
                              }}
                            />
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabelaPreview>
          )}

          <div className="mt-6">
            <p className="mb-4 text-sm font-semibold text-muted-foreground">
              Resumo por banco
            </p>
            <HorizontalBarChart items={porBancoChart} height={Math.max(160, porBancoChart.length * 48)} />
          </div>
        </SectionCard>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar contrato" : "Novo contrato"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>Titular</Label>
              <Select
                value={form.emissor_id}
                onValueChange={(v) => setForm((f) => ({ ...f, emissor_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Titular" />
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
              <Label>Instituição</Label>
              <Input
                value={form.instituicao}
                onChange={(e) => setForm((f) => ({ ...f, instituicao: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Contrato / finalidade</Label>
              <Input
                value={form.contrato_finalidade}
                onChange={(e) => setForm((f) => ({ ...f, contrato_finalidade: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Taxa (decimal, ex. 0.12)</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={form.taxa_juros}
                  onChange={(e) => setForm((f) => ({ ...f, taxa_juros: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Vencimento</Label>
                <Input
                  type="date"
                  value={form.vencimento_final}
                  onChange={(e) => setForm((f) => ({ ...f, vencimento_final: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Saldo devedor</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.saldo_devedor}
                  onChange={(e) => setForm((f) => ({ ...f, saldo_devedor: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Projetado c/ juros</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.total_projetado}
                  onChange={(e) => setForm((f) => ({ ...f, total_projetado: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button
              disabled={
                !form.emissor_id ||
                !form.instituicao.trim() ||
                !form.contrato_finalidade.trim() ||
                salvar.isPending
              }
              onClick={() => salvar.mutate(form)}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
