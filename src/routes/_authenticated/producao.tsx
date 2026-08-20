import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers, Plus, Sprout, Wheat } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AcoesCadastro } from "@/components/AcoesCadastro";
import { PageHeader } from "@/components/AppShell";
import { KpiCard } from "@/components/design-system";
import { BarraFiltros, FiltroCard, LayoutAbasFiltros } from "@/components/LayoutAbasFiltros";
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
import { emptyToNull, numOrNull, slugCodigo } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/producao")({
  head: () => ({ meta: [{ title: "Produção & Safras | Sistema Grupo Mandotti" }] }),
  component: ProducaoPage,
});

type Ordenacao = "prioridade" | "produtividade" | "area" | "cultura";

type GrupoRow = {
  id: string;
  safra: string;
  cultura_codigo: string;
  area_plantio_ha: number | null;
  produtividade_sc_ha: number | null;
  preco_saca: number | null;
  custo_saca: number | null;
  tipo: string;
  ciclo: string;
};

type FazendaRow = {
  id: string;
  safra: string;
  cultura_codigo: string;
  area_plantio_ha: number | null;
  produtividade_sc_ha: number | null;
  matricula: string | null;
  fazenda_id: string | null;
  fazendas: { nome?: string; codigo?: string } | null;
};

type FormFazenda = {
  id?: string;
  safra: string;
  fazenda_id: string;
  cultura_codigo: string;
  nova_cultura: string;
  area_plantio_ha: string;
  produtividade_sc_ha: string;
  matricula: string;
};

type FormGrupo = {
  id?: string;
  safra: string;
  cultura_codigo: string;
  nova_cultura: string;
  ciclo: string;
  tipo: string;
  area_plantio_ha: string;
  produtividade_sc_ha: string;
  preco_saca: string;
  custo_saca: string;
};

const VAZIO_FAZENDA: FormFazenda = {
  safra: "2026/27",
  fazenda_id: "",
  cultura_codigo: "soja",
  nova_cultura: "",
  area_plantio_ha: "",
  produtividade_sc_ha: "",
  matricula: "",
};

const VAZIO_GRUPO: FormGrupo = {
  safra: "2026/27",
  cultura_codigo: "soja",
  nova_cultura: "",
  ciclo: "safra",
  tipo: "realizado",
  area_plantio_ha: "",
  produtividade_sc_ha: "",
  preco_saca: "",
  custo_saca: "",
};

function fmtHa(n: number | null | undefined) {
  if (n == null) return "—";
  return `${n.toLocaleString("pt-BR")} ha`;
}

function fmtScHa(n: number | null | undefined) {
  if (n == null) return "—";
  return `${n.toLocaleString("pt-BR")} sc/ha`;
}

function ordenarGrupo(rows: GrupoRow[], ordem: Ordenacao, culturaNome: Record<string, string>) {
  const copia = [...rows];
  switch (ordem) {
    case "prioridade":
      return copia.sort((a, b) => (b.area_plantio_ha ?? 0) - (a.area_plantio_ha ?? 0));
    case "produtividade":
      return copia.sort((a, b) => (b.produtividade_sc_ha ?? -1) - (a.produtividade_sc_ha ?? -1));
    case "area":
      return copia.sort((a, b) => (b.area_plantio_ha ?? 0) - (a.area_plantio_ha ?? 0));
    case "cultura":
      return copia.sort((a, b) =>
        (culturaNome[a.cultura_codigo] ?? a.cultura_codigo).localeCompare(
          culturaNome[b.cultura_codigo] ?? b.cultura_codigo,
        ),
      );
  }
}

function ordenarFazenda(rows: FazendaRow[], ordem: Ordenacao, culturaNome: Record<string, string>) {
  const copia = [...rows];
  switch (ordem) {
    case "prioridade":
    case "area":
      return copia.sort((a, b) => (b.area_plantio_ha ?? 0) - (a.area_plantio_ha ?? 0));
    case "produtividade":
      return copia.sort((a, b) => (b.produtividade_sc_ha ?? -1) - (a.produtividade_sc_ha ?? -1));
    case "cultura":
      return copia.sort((a, b) =>
        (culturaNome[a.cultura_codigo] ?? a.cultura_codigo).localeCompare(
          culturaNome[b.cultura_codigo] ?? b.cultura_codigo,
        ),
      );
  }
}

const ABAS_PRODUCAO = [
  { id: "fazenda", label: "Fazenda" },
  { id: "historico", label: "Histórico" },
  { id: "projecao", label: "Projeções" },
] as const;

type AbaProducao = (typeof ABAS_PRODUCAO)[number]["id"];

async function garantirCultura(codigo: string, novaCultura: string) {
  if (codigo !== "__nova__") return codigo;
  const nome = novaCultura.trim();
  if (!nome) throw new Error("Informe o nome da nova cultura");
  const novoCodigo = slugCodigo(nome);
  const { error } = await supabase.from("produtos_agricolas").insert({
    codigo: novoCodigo,
    nome,
    tipo: "cultura",
    ordem: 99,
    ativo: true,
  });
  if (error && !error.message.toLowerCase().includes("duplicate")) throw error;
  return novoCodigo;
}

function FiltrosProducao({
  safras,
  fazendas,
  culturas,
  safra,
  fazenda,
  cultura,
  ordenacao,
  onSafra,
  onFazenda,
  onCultura,
  onOrdenacao,
}: {
  safras: string[];
  fazendas: { id: string; nome: string }[];
  culturas: { codigo: string; nome: string }[];
  safra: string;
  fazenda: string;
  cultura: string;
  ordenacao: Ordenacao;
  onSafra: (v: string) => void;
  onFazenda: (v: string) => void;
  onCultura: (v: string) => void;
  onOrdenacao: (v: Ordenacao) => void;
}) {
  return (
    <>
      <FiltroCard label="Safra">
        <Select value={safra} onValueChange={onSafra}>
          <SelectTrigger>
            <SelectValue placeholder="Safra" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            {safras.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FiltroCard>
      <FiltroCard label="Fazenda">
        <Select value={fazenda} onValueChange={onFazenda}>
          <SelectTrigger>
            <SelectValue placeholder="Fazenda" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            {fazendas.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FiltroCard>
      <FiltroCard label="Cultura">
        <Select value={cultura} onValueChange={onCultura}>
          <SelectTrigger>
            <SelectValue placeholder="Cultura" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            {culturas.map((c) => (
              <SelectItem key={c.codigo} value={c.codigo}>
                {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FiltroCard>
      <FiltroCard label="Ordenar tabela">
        <Select value={ordenacao} onValueChange={(v) => onOrdenacao(v as Ordenacao)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="prioridade">Prioridade (área)</SelectItem>
            <SelectItem value="produtividade">Produtividade</SelectItem>
            <SelectItem value="area">Área</SelectItem>
            <SelectItem value="cultura">Cultura</SelectItem>
          </SelectContent>
        </Select>
      </FiltroCard>
    </>
  );
}

function CampoCultura({
  culturas,
  codigo,
  nova,
  onCodigo,
  onNova,
}: {
  culturas: { codigo: string; nome: string }[];
  codigo: string;
  nova: string;
  onCodigo: (v: string) => void;
  onNova: (v: string) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label>Cultura</Label>
        <Select value={codigo} onValueChange={onCodigo}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {culturas.map((c) => (
              <SelectItem key={c.codigo} value={c.codigo}>
                {c.nome}
              </SelectItem>
            ))}
            <SelectItem value="__nova__">+ Nova cultura…</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {codigo === "__nova__" ? (
        <div className="space-y-2">
          <Label>Nome da nova cultura</Label>
          <Input value={nova} onChange={(e) => onNova(e.target.value)} placeholder="Ex.: Feijão" />
        </div>
      ) : null}
    </>
  );
}

function ProducaoPage() {
  const qc = useQueryClient();
  const { user } = useSession();
  const { pode } = usePerfil(user);
  const podeEditar = pode("/producao", "editar");
  const [abaAtiva, setAbaAtiva] = useState<AbaProducao>("fazenda");
  const [safraFiltro, setSafraFiltro] = useState("2026/27");
  const [fazendaFiltro, setFazendaFiltro] = useState("todas");
  const [culturaFiltro, setCulturaFiltro] = useState("todas");
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("prioridade");
  const [abertoFazenda, setAbertoFazenda] = useState(false);
  const [abertoGrupo, setAbertoGrupo] = useState(false);
  const [formFazenda, setFormFazenda] = useState<FormFazenda>(VAZIO_FAZENDA);
  const [formGrupo, setFormGrupo] = useState<FormGrupo>(VAZIO_GRUPO);

  const { data, isLoading } = useQuery({
    queryKey: ["producao-planilha"],
    queryFn: async () => {
      const [grupo, fazenda, culturas, fazendasList] = await Promise.all([
        supabase.from("producao_grupo_safra").select("*").order("safra").order("cultura_codigo"),
        supabase
          .from("producao_fazenda_safra")
          .select("*, fazendas(nome, codigo)")
          .order("safra")
          .order("cultura_codigo"),
        supabase.from("produtos_agricolas").select("codigo, nome").eq("ativo", true).order("ordem"),
        supabase.from("fazendas").select("id, nome").is("deleted_at", null).order("nome"),
      ]);
      if (grupo.error) throw grupo.error;
      if (fazenda.error) throw fazenda.error;
      if (culturas.error) throw culturas.error;
      if (fazendasList.error) throw fazendasList.error;

      const culturaNome = Object.fromEntries((culturas.data ?? []).map((c) => [c.codigo, c.nome]));

      return {
        grupo: (grupo.data ?? []) as GrupoRow[],
        fazenda: (fazenda.data ?? []) as FazendaRow[],
        culturaNome,
        culturas: culturas.data ?? [],
        fazendasList: fazendasList.data ?? [],
      };
    },
  });

  const safras = useMemo(() => {
    const set = new Set([
      ...(data?.grupo ?? []).map((r) => r.safra),
      ...(data?.fazenda ?? []).map((r) => r.safra),
    ]);
    return [...set].sort();
  }, [data?.grupo, data?.fazenda]);

  const grupoSafra = useMemo(() => {
    let rows = data?.grupo ?? [];
    if (safraFiltro !== "todas") rows = rows.filter((r) => r.safra === safraFiltro);
    if (culturaFiltro !== "todas") rows = rows.filter((r) => r.cultura_codigo === culturaFiltro);
    return rows;
  }, [data?.grupo, safraFiltro, culturaFiltro]);

  const kpis = useMemo(() => {
    const base =
      safraFiltro === "todas" ? (data?.grupo ?? []).filter((r) => r.safra === "2026/27") : grupoSafra;
    const areaTotal = base.reduce((acc, r) => acc + (r.area_plantio_ha ?? 0), 0);
    const soja = base
      .filter((r) => r.cultura_codigo === "soja" && r.ciclo === "safra")
      .reduce((acc, r) => acc + (r.area_plantio_ha ?? 0), 0);
    const milho = base
      .filter((r) => r.cultura_codigo === "milho" && r.ciclo === "safra")
      .reduce((acc, r) => acc + (r.area_plantio_ha ?? 0), 0);
    const safrinha = base
      .filter((r) => r.ciclo === "safrinha")
      .reduce((acc, r) => acc + (r.area_plantio_ha ?? 0), 0);
    const comProd = base.filter((r) => r.produtividade_sc_ha != null);
    const prodMedia =
      comProd.length > 0
        ? comProd.reduce((acc, r) => acc + (r.produtividade_sc_ha ?? 0), 0) / comProd.length
        : null;
    return {
      areaTotal,
      soja,
      milho,
      safrinha,
      prodMedia,
      safraLabel: safraFiltro === "todas" ? "2026/27" : safraFiltro,
    };
  }, [data?.grupo, grupoSafra, safraFiltro]);

  const historico = useMemo(() => {
    let rows = (data?.grupo ?? []).filter((r) => r.tipo === "realizado");
    if (safraFiltro !== "todas") rows = rows.filter((r) => r.safra === safraFiltro);
    if (culturaFiltro !== "todas") rows = rows.filter((r) => r.cultura_codigo === culturaFiltro);
    return ordenarGrupo(rows, ordenacao, data?.culturaNome ?? {});
  }, [data?.grupo, data?.culturaNome, safraFiltro, culturaFiltro, ordenacao]);

  const projecao = useMemo(() => {
    let rows = (data?.grupo ?? []).filter((r) => r.tipo === "projecao");
    if (safraFiltro !== "todas") rows = rows.filter((r) => r.safra === safraFiltro);
    if (culturaFiltro !== "todas") rows = rows.filter((r) => r.cultura_codigo === culturaFiltro);
    return ordenarGrupo(rows, ordenacao, data?.culturaNome ?? {});
  }, [data?.grupo, data?.culturaNome, safraFiltro, culturaFiltro, ordenacao]);

  const porFazenda = useMemo(() => {
    let rows = data?.fazenda ?? [];
    if (safraFiltro !== "todas") rows = rows.filter((r) => r.safra === safraFiltro);
    if (fazendaFiltro !== "todas") rows = rows.filter((r) => r.fazenda_id === fazendaFiltro);
    if (culturaFiltro !== "todas") rows = rows.filter((r) => r.cultura_codigo === culturaFiltro);
    return ordenarFazenda(rows, ordenacao, data?.culturaNome ?? {});
  }, [data?.fazenda, data?.culturaNome, safraFiltro, fazendaFiltro, culturaFiltro, ordenacao]);

  const salvarFazenda = useMutation({
    mutationFn: async (f: FormFazenda) => {
      if (!f.safra.trim() || !f.fazenda_id) throw new Error("Informe safra e fazenda");
      const cultura = await garantirCultura(f.cultura_codigo, f.nova_cultura);
      const payload = {
        safra: f.safra.trim(),
        fazenda_id: f.fazenda_id,
        cultura_codigo: cultura,
        area_plantio_ha: numOrNull(f.area_plantio_ha),
        produtividade_sc_ha: numOrNull(f.produtividade_sc_ha),
        matricula: emptyToNull(f.matricula),
        origem: "manual",
      };
      const res = f.id
        ? await supabase.from("producao_fazenda_safra").update(payload).eq("id", f.id)
        : await supabase.from("producao_fazenda_safra").insert(payload);
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      toast.success("Produção da fazenda salva");
      setAbertoFazenda(false);
      setFormFazenda(VAZIO_FAZENDA);
      qc.invalidateQueries({ queryKey: ["producao-planilha"] });
      qc.invalidateQueries({ queryKey: ["produtos_agricolas"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const salvarGrupo = useMutation({
    mutationFn: async (f: FormGrupo) => {
      if (!f.safra.trim()) throw new Error("Informe a safra");
      const cultura = await garantirCultura(f.cultura_codigo, f.nova_cultura);
      const payload = {
        safra: f.safra.trim(),
        cultura_codigo: cultura,
        ciclo: f.ciclo,
        tipo: f.tipo,
        area_plantio_ha: numOrNull(f.area_plantio_ha),
        produtividade_sc_ha: numOrNull(f.produtividade_sc_ha),
        preco_saca: numOrNull(f.preco_saca),
        custo_saca: numOrNull(f.custo_saca),
        origem: "manual",
      };
      const res = f.id
        ? await supabase.from("producao_grupo_safra").update(payload).eq("id", f.id)
        : await supabase.from("producao_grupo_safra").insert(payload);
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      toast.success("Registro de safra salvo");
      setAbertoGrupo(false);
      setFormGrupo(VAZIO_GRUPO);
      qc.invalidateQueries({ queryKey: ["producao-planilha"] });
      qc.invalidateQueries({ queryKey: ["produtos_agricolas"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const excluirFazenda = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("producao_fazenda_safra").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Registro excluído");
      qc.invalidateQueries({ queryKey: ["producao-planilha"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const excluirGrupo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("producao_grupo_safra").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Registro excluído");
      qc.invalidateQueries({ queryKey: ["producao-planilha"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const abrirNovaFazenda = () => {
    setFormFazenda({
      ...VAZIO_FAZENDA,
      safra: safraFiltro !== "todas" ? safraFiltro : "2026/27",
      fazenda_id: fazendaFiltro !== "todas" ? fazendaFiltro : (data?.fazendasList[0]?.id ?? ""),
      cultura_codigo: culturaFiltro !== "todas" ? culturaFiltro : "soja",
    });
    setAbertoFazenda(true);
  };

  const abrirNovoGrupo = (tipo: "realizado" | "projecao") => {
    setFormGrupo({
      ...VAZIO_GRUPO,
      tipo,
      safra: safraFiltro !== "todas" ? safraFiltro : "2026/27",
      cultura_codigo: culturaFiltro !== "todas" ? culturaFiltro : "soja",
    });
    setAbertoGrupo(true);
  };

  const filtrosProducao = (
    <FiltrosProducao
      safras={safras}
      fazendas={data?.fazendasList ?? []}
      culturas={data?.culturas ?? []}
      safra={safraFiltro}
      fazenda={fazendaFiltro}
      cultura={culturaFiltro}
      ordenacao={ordenacao}
      onSafra={setSafraFiltro}
      onFazenda={setFazendaFiltro}
      onCultura={setCulturaFiltro}
      onOrdenacao={setOrdenacao}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produção & Safras"
        description="Cadastre cultura, área e produtividade por fazenda. Novos tipos de safra entram aqui ou em Culturas."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to="/produtos">Culturas</Link>
            </Button>
            {podeEditar ? (
              <Button
                onClick={() =>
                  abaAtiva === "fazenda"
                    ? abrirNovaFazenda()
                    : abrirNovoGrupo(abaAtiva === "projecao" ? "projecao" : "realizado")
                }
              >
                <Plus className="mr-2 size-4" />
                {abaAtiva === "fazenda"
                  ? "Nova área"
                  : abaAtiva === "projecao"
                    ? "Nova projeção"
                    : "Novo histórico"}
              </Button>
            ) : null}
          </div>
        }
      />

      <BarraFiltros>{filtrosProducao}</BarraFiltros>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={`Área total · ${kpis.safraLabel}`}
          value={fmtHa(kpis.areaTotal)}
          icon={Sprout}
          tone="success"
        />
        <KpiCard label="Soja" value={fmtHa(kpis.soja)} icon={Wheat} tone="info" />
        <KpiCard label="Milho" value={fmtHa(kpis.milho)} icon={Sprout} tone="default" />
        <KpiCard
          label="Safrinha"
          value={fmtHa(kpis.safrinha)}
          icon={Layers}
          hint={kpis.prodMedia != null ? `Prod. média ${fmtScHa(kpis.prodMedia)}` : undefined}
          tone="warning"
        />
      </div>

      <LayoutAbasFiltros
        abas={[...ABAS_PRODUCAO]}
        abaAtiva={abaAtiva}
        onAbaChange={(id) => setAbaAtiva(id as AbaProducao)}
      >
        {abaAtiva === "fazenda" ? (
          isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>
          ) : (
            <TabelaPreview rows={porFazenda}>
              {(visiveis) => (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Safra</TableHead>
                      <TableHead>Fazenda</TableHead>
                      <TableHead>Cultura</TableHead>
                      <TableHead className="text-right">Área</TableHead>
                      <TableHead className="text-right">Produtividade</TableHead>
                      <TableHead>Matrícula</TableHead>
                      <TableHead className="w-24" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visiveis.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                          Nenhum registro com os filtros atuais.
                        </TableCell>
                      </TableRow>
                    ) : (
                      visiveis.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.safra}</TableCell>
                          <TableCell className="font-medium">{row.fazendas?.nome ?? "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {data?.culturaNome[row.cultura_codigo] ?? row.cultura_codigo}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono-nums">
                            {fmtHa(row.area_plantio_ha)}
                          </TableCell>
                          <TableCell className="text-right font-mono-nums">
                            {fmtScHa(row.produtividade_sc_ha)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{row.matricula ?? "—"}</TableCell>
                          <TableCell>
                            {podeEditar ? (
                              <AcoesCadastro
                                onEdit={() => {
                                  setFormFazenda({
                                    id: row.id,
                                    safra: row.safra,
                                    fazenda_id: row.fazenda_id ?? "",
                                    cultura_codigo: row.cultura_codigo,
                                    nova_cultura: "",
                                    area_plantio_ha:
                                      row.area_plantio_ha != null ? String(row.area_plantio_ha) : "",
                                    produtividade_sc_ha:
                                      row.produtividade_sc_ha != null
                                        ? String(row.produtividade_sc_ha)
                                        : "",
                                    matricula: row.matricula ?? "",
                                  });
                                  setAbertoFazenda(true);
                                }}
                                onDelete={() => {
                                  if (window.confirm("Excluir este registro de produção?")) {
                                    excluirFazenda.mutate(row.id);
                                  }
                                }}
                              />
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </TabelaPreview>
          )
        ) : null}

        {abaAtiva === "historico" ? (
          <TabelaPreview rows={historico}>
            {(visiveis) => (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Safra</TableHead>
                    <TableHead>Cultura</TableHead>
                    <TableHead className="text-right">Área</TableHead>
                    <TableHead className="text-right">sc/ha</TableHead>
                    <TableHead className="text-right">Preço/sc</TableHead>
                    <TableHead className="text-right">Custo/sc</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiveis.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                        Nenhum registro com os filtros atuais.
                      </TableCell>
                    </TableRow>
                  ) : (
                    visiveis.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          {row.safra}
                          {row.ciclo === "safrinha" ? " · safrinha" : ""}
                        </TableCell>
                        <TableCell>
                          {data?.culturaNome[row.cultura_codigo] ?? row.cultura_codigo}
                        </TableCell>
                        <TableCell className="text-right font-mono-nums">
                          {fmtHa(row.area_plantio_ha)}
                        </TableCell>
                        <TableCell className="text-right font-mono-nums">
                          {fmtScHa(row.produtividade_sc_ha)}
                        </TableCell>
                        <TableCell className="text-right font-mono-nums">
                          {row.preco_saca != null
                            ? row.preco_saca.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono-nums">
                          {row.custo_saca != null
                            ? row.custo_saca.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {podeEditar ? (
                            <AcoesCadastro
                              onEdit={() => {
                                setFormGrupo({
                                  id: row.id,
                                  safra: row.safra,
                                  cultura_codigo: row.cultura_codigo,
                                  nova_cultura: "",
                                  ciclo: row.ciclo,
                                  tipo: row.tipo,
                                  area_plantio_ha:
                                    row.area_plantio_ha != null ? String(row.area_plantio_ha) : "",
                                  produtividade_sc_ha:
                                    row.produtividade_sc_ha != null
                                      ? String(row.produtividade_sc_ha)
                                      : "",
                                  preco_saca: row.preco_saca != null ? String(row.preco_saca) : "",
                                  custo_saca: row.custo_saca != null ? String(row.custo_saca) : "",
                                });
                                setAbertoGrupo(true);
                              }}
                              onDelete={() => {
                                if (window.confirm("Excluir este histórico?")) {
                                  excluirGrupo.mutate(row.id);
                                }
                              }}
                            />
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </TabelaPreview>
        ) : null}

        {abaAtiva === "projecao" ? (
          <TabelaPreview rows={projecao}>
            {(visiveis) => (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Safra</TableHead>
                    <TableHead>Cultura</TableHead>
                    <TableHead className="text-right">Área projetada</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiveis.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        Nenhum registro com os filtros atuais.
                      </TableCell>
                    </TableRow>
                  ) : (
                    visiveis.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          {row.safra}
                          {row.ciclo === "safrinha" ? " · safrinha" : ""}
                        </TableCell>
                        <TableCell>
                          {data?.culturaNome[row.cultura_codigo] ?? row.cultura_codigo}
                        </TableCell>
                        <TableCell className="text-right font-mono-nums">
                          {fmtHa(row.area_plantio_ha)}
                        </TableCell>
                        <TableCell>
                          {podeEditar ? (
                            <AcoesCadastro
                              onEdit={() => {
                                setFormGrupo({
                                  id: row.id,
                                  safra: row.safra,
                                  cultura_codigo: row.cultura_codigo,
                                  nova_cultura: "",
                                  ciclo: row.ciclo,
                                  tipo: row.tipo,
                                  area_plantio_ha:
                                    row.area_plantio_ha != null ? String(row.area_plantio_ha) : "",
                                  produtividade_sc_ha:
                                    row.produtividade_sc_ha != null
                                      ? String(row.produtividade_sc_ha)
                                      : "",
                                  preco_saca: row.preco_saca != null ? String(row.preco_saca) : "",
                                  custo_saca: row.custo_saca != null ? String(row.custo_saca) : "",
                                });
                                setAbertoGrupo(true);
                              }}
                              onDelete={() => {
                                if (window.confirm("Excluir esta projeção?")) {
                                  excluirGrupo.mutate(row.id);
                                }
                              }}
                            />
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </TabelaPreview>
        ) : null}
      </LayoutAbasFiltros>

      <Dialog open={abertoFazenda} onOpenChange={setAbertoFazenda}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formFazenda.id ? "Editar área / cultura" : "Nova área / cultura"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Safra</Label>
                <Input
                  value={formFazenda.safra}
                  onChange={(e) => setFormFazenda((f) => ({ ...f, safra: e.target.value }))}
                  placeholder="2025/26"
                />
              </div>
              <div className="space-y-2">
                <Label>Fazenda</Label>
                <Select
                  value={formFazenda.fazenda_id}
                  onValueChange={(v) => setFormFazenda((f) => ({ ...f, fazenda_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Fazenda" />
                  </SelectTrigger>
                  <SelectContent>
                    {(data?.fazendasList ?? []).map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <CampoCultura
              culturas={data?.culturas ?? []}
              codigo={formFazenda.cultura_codigo}
              nova={formFazenda.nova_cultura}
              onCodigo={(v) => setFormFazenda((f) => ({ ...f, cultura_codigo: v }))}
              onNova={(v) => setFormFazenda((f) => ({ ...f, nova_cultura: v }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Área (ha)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formFazenda.area_plantio_ha}
                  onChange={(e) => setFormFazenda((f) => ({ ...f, area_plantio_ha: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Produtividade (sc/ha)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formFazenda.produtividade_sc_ha}
                  onChange={(e) =>
                    setFormFazenda((f) => ({ ...f, produtividade_sc_ha: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Matrícula</Label>
              <Input
                value={formFazenda.matricula}
                onChange={(e) => setFormFazenda((f) => ({ ...f, matricula: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAbertoFazenda(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!formFazenda.safra.trim() || !formFazenda.fazenda_id || salvarFazenda.isPending}
              onClick={() => salvarFazenda.mutate(formFazenda)}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={abertoGrupo} onOpenChange={setAbertoGrupo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formGrupo.id ? "Editar safra" : "Novo registro de safra"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Safra</Label>
                <Input
                  value={formGrupo.safra}
                  onChange={(e) => setFormGrupo((f) => ({ ...f, safra: e.target.value }))}
                  placeholder="2025/26"
                />
              </div>
              <div className="space-y-2">
                <Label>Ciclo</Label>
                <Select
                  value={formGrupo.ciclo}
                  onValueChange={(v) => setFormGrupo((f) => ({ ...f, ciclo: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="safra">Safra</SelectItem>
                    <SelectItem value="safrinha">Safrinha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <CampoCultura
              culturas={data?.culturas ?? []}
              codigo={formGrupo.cultura_codigo}
              nova={formGrupo.nova_cultura}
              onCodigo={(v) => setFormGrupo((f) => ({ ...f, cultura_codigo: v }))}
              onNova={(v) => setFormGrupo((f) => ({ ...f, nova_cultura: v }))}
            />
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={formGrupo.tipo}
                onValueChange={(v) => setFormGrupo((f) => ({ ...f, tipo: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realizado">Histórico (realizado)</SelectItem>
                  <SelectItem value="projecao">Projeção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Área (ha)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formGrupo.area_plantio_ha}
                  onChange={(e) => setFormGrupo((f) => ({ ...f, area_plantio_ha: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Produtividade (sc/ha)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formGrupo.produtividade_sc_ha}
                  onChange={(e) =>
                    setFormGrupo((f) => ({ ...f, produtividade_sc_ha: e.target.value }))
                  }
                />
              </div>
            </div>
            {formGrupo.tipo === "realizado" ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Preço/sc</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formGrupo.preco_saca}
                    onChange={(e) => setFormGrupo((f) => ({ ...f, preco_saca: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Custo/sc</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formGrupo.custo_saca}
                    onChange={(e) => setFormGrupo((f) => ({ ...f, custo_saca: e.target.value }))}
                  />
                </div>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAbertoGrupo(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!formGrupo.safra.trim() || salvarGrupo.isPending}
              onClick={() => salvarGrupo.mutate(formGrupo)}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
