import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sprout, Wheat } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/AppShell";
import { KpiCard, SectionCard } from "@/components/design-system";
import { LayoutAbasFiltros } from "@/components/LayoutAbasFiltros";
import { TabelaPreview } from "@/components/TabelaPreview";
import { Badge } from "@/components/ui/badge";
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
import { supabase } from "@/integrations/supabase/client";

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
      return copia.sort(
        (a, b) => (b.produtividade_sc_ha ?? -1) - (a.produtividade_sc_ha ?? -1),
      );
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

function ordenarFazenda(
  rows: FazendaRow[],
  ordem: Ordenacao,
  culturaNome: Record<string, string>,
) {
  const copia = [...rows];
  switch (ordem) {
    case "prioridade":
    case "area":
      return copia.sort((a, b) => (b.area_plantio_ha ?? 0) - (a.area_plantio_ha ?? 0));
    case "produtividade":
      return copia.sort(
        (a, b) => (b.produtividade_sc_ha ?? -1) - (a.produtividade_sc_ha ?? -1),
      );
    case "cultura":
      return copia.sort((a, b) =>
        (culturaNome[a.cultura_codigo] ?? a.cultura_codigo).localeCompare(
          culturaNome[b.cultura_codigo] ?? b.cultura_codigo,
        ),
      );
  }
}

const ABAS_PRODUCAO = [
  { id: "fazenda", label: "Fazenda", title: "Por fazenda", description: "Área e produtividade por imóvel e cultura." },
  {
    id: "historico",
    label: "Histórico",
    title: "Histórico",
    description: "Safras realizadas — área, produtividade, preço e custo.",
  },
  {
    id: "projecao",
    label: "Projeções",
    title: "Projeções",
    description: "Metas de área por safra e cultura.",
  },
] as const;

type AbaProducao = (typeof ABAS_PRODUCAO)[number]["id"];

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
  mostrarFazenda = true,
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
  mostrarFazenda?: boolean;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label className="text-xs">Safra</Label>
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
      </div>
      {mostrarFazenda ? (
        <div className="space-y-2">
          <Label className="text-xs">Fazenda</Label>
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
        </div>
      ) : null}
      <div className="space-y-2">
        <Label className="text-xs">Cultura</Label>
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
      </div>
      <div className="space-y-2 border-t border-border/60 pt-3">
        <Label className="text-xs">Ordenar tabela</Label>
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
      </div>
    </>
  );
}

function ProducaoPage() {
  const [abaAtiva, setAbaAtiva] = useState<AbaProducao>("fazenda");
  const [safraFiltro, setSafraFiltro] = useState("2026/27");
  const [fazendaFiltro, setFazendaFiltro] = useState("todas");
  const [culturaFiltro, setCulturaFiltro] = useState("todas");
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("prioridade");

  const { data, isLoading } = useQuery({
    queryKey: ["producao-planilha"],
    queryFn: async () => {
      const [grupo, fazenda, culturas, fazendasList] = await Promise.all([
        supabase
          .from("producao_grupo_safra")
          .select("*")
          .order("safra")
          .order("cultura_codigo"),
        supabase
          .from("producao_fazenda_safra")
          .select("*, fazendas(nome, codigo)")
          .order("safra")
          .order("cultura_codigo"),
        supabase.from("produtos_agricolas").select("codigo, nome").order("ordem"),
        supabase.from("fazendas").select("id, nome").is("deleted_at", null).order("nome"),
      ]);
      if (grupo.error) throw grupo.error;
      if (fazenda.error) throw fazenda.error;
      if (culturas.error) throw culturas.error;
      if (fazendasList.error) throw fazendasList.error;

      const culturaNome = Object.fromEntries(
        (culturas.data ?? []).map((c) => [c.codigo, c.nome]),
      );

      return {
        grupo: (grupo.data ?? []) as GrupoRow[],
        fazenda: (fazenda.data ?? []) as FazendaRow[],
        culturaNome,
        culturas: culturas.data ?? [],
        fazendasList: fazendasList.data ?? [],
      };
    },
  });

  const safras = useMemo(
    () => [...new Set((data?.grupo ?? []).map((r) => r.safra))].sort(),
    [data?.grupo],
  );

  const grupoSafra = useMemo(() => {
    let rows = data?.grupo ?? [];
    if (safraFiltro !== "todas") rows = rows.filter((r) => r.safra === safraFiltro);
    if (culturaFiltro !== "todas") rows = rows.filter((r) => r.cultura_codigo === culturaFiltro);
    return rows;
  }, [data?.grupo, safraFiltro, culturaFiltro]);

  const kpis = useMemo(() => {
    const base =
      safraFiltro === "todas"
        ? (data?.grupo ?? []).filter((r) => r.safra === "2026/27")
        : grupoSafra;
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
    return { areaTotal, soja, milho, safrinha, prodMedia, safraLabel: safraFiltro === "todas" ? "2026/27" : safraFiltro };
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

  const abaMeta = ABAS_PRODUCAO.find((a) => a.id === abaAtiva)!;

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
      mostrarFazenda={abaAtiva === "fazenda"}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Operação · Produção"
        title="Produção & Safras"
        description="Visão por fazenda, histórico realizado e projeções — dados da ficha cadastral."
      />

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
          hint={kpis.prodMedia != null ? `Prod. média ${fmtScHa(kpis.prodMedia)}` : undefined}
          tone="warning"
        />
      </div>

      <SectionCard title={abaMeta.title} description={abaMeta.description}>
        <LayoutAbasFiltros
          abas={[...ABAS_PRODUCAO]}
          abaAtiva={abaAtiva}
          onAbaChange={(id) => setAbaAtiva(id as AbaProducao)}
          filtros={filtrosProducao}
        >
          <div className="p-4 sm:p-5">
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visiveis.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                          Nenhum registro com os filtros atuais.
                        </TableCell>
                      </TableRow>
                    ) : (
                      visiveis.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.safra}</TableCell>
                          <TableCell className="font-medium">
                            {row.fazendas?.nome ?? "—"}
                          </TableCell>
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
                          <TableCell className="text-muted-foreground">
                            {row.matricula ?? "—"}
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiveis.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiveis.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
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
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
                )}
              </TabelaPreview>
            ) : null}
          </div>
        </LayoutAbasFiltros>
      </SectionCard>
    </div>
  );
}
