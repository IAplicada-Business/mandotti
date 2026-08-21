import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Download, FileSpreadsheet, Layers, Printer, Sprout, Wheat } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/AppShell";
import { KpiCard } from "@/components/design-system";
import { BarraFiltros, FiltroCard } from "@/components/LayoutAbasFiltros";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { downloadCsv } from "@/lib/export-csv";
import {
  COLUNAS_BANCO,
  COLUNAS_RELATORIO,
  formatarCelula,
  valorColuna,
  type ColunaRelatorio,
  type LinhaRelatorio,
} from "@/lib/relatorio-producao";

export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios | Sistema Grupo Mandotti" },
      { name: "description", content: "Safra e produtividade para envio ao banco." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    safra: typeof s["safra"] === "string" ? s["safra"] : undefined,
  }),
  component: RelatoriosPage,
});

function RelatoriosPage() {
  const search = Route.useSearch();
  const [safra, setSafra] = useState(search.safra ?? "2026/27");
  const [fazenda, setFazenda] = useState("todas");
  const [cultura, setCultura] = useState("todas");
  const [colunas, setColunas] = useState<ColunaRelatorio[]>([...COLUNAS_BANCO]);

  const { data, isLoading } = useQuery({
    queryKey: ["relatorio-producao"],
    queryFn: async () => {
      const [fazendaRes, grupoRes, culturas, fazendas] = await Promise.all([
        supabase
          .from("producao_fazenda_safra")
          .select("id, safra, cultura_codigo, area_plantio_ha, produtividade_sc_ha, fazenda_id, fazendas(nome)")
          .order("safra")
          .order("cultura_codigo"),
        supabase
          .from("producao_grupo_safra")
          .select("*")
          .order("safra")
          .order("cultura_codigo"),
        supabase.from("produtos_agricolas").select("codigo, nome").eq("ativo", true).order("ordem"),
        supabase.from("fazendas").select("id, nome").is("deleted_at", null).order("nome"),
      ]);
      if (fazendaRes.error) throw fazendaRes.error;
      if (grupoRes.error) throw grupoRes.error;
      if (culturas.error) throw culturas.error;
      if (fazendas.error) throw fazendas.error;

      const culturaNome = Object.fromEntries((culturas.data ?? []).map((c) => [c.codigo, c.nome]));
      const grupoPorChave = new Map(
        (grupoRes.data ?? []).map((g) => [`${g.safra}|${g.cultura_codigo}|${g.ciclo}`, g]),
      );

      const linhasFazenda: LinhaRelatorio[] = (fazendaRes.data ?? []).map((r) => {
        const grupo =
          grupoPorChave.get(`${r.safra}|${r.cultura_codigo}|safra`) ??
          grupoPorChave.get(`${r.safra}|${r.cultura_codigo}|safrinha`);
        const area = r.area_plantio_ha;
        const prod = r.produtividade_sc_ha;
        return {
          id: r.id,
          safra: r.safra,
          fazenda: r.fazendas?.nome ?? "—",
          fazenda_id: r.fazenda_id,
          cultura: culturaNome[r.cultura_codigo] ?? r.cultura_codigo,
          cultura_codigo: r.cultura_codigo,
          ciclo: grupo?.ciclo ?? "safra",
          area,
          produtividade: prod,
          volume: area != null && prod != null ? area * prod : null,
          preco: grupo?.preco_saca ?? null,
          custo: grupo?.custo_saca ?? null,
        };
      });

      const linhasGrupo: LinhaRelatorio[] = (grupoRes.data ?? []).map((g) => ({
        id: `grupo-${g.id}`,
        safra: g.safra,
        fazenda: "Grupo (consolidado)",
        fazenda_id: null,
        cultura: culturaNome[g.cultura_codigo] ?? g.cultura_codigo,
        cultura_codigo: g.cultura_codigo,
        ciclo: g.ciclo,
        area: g.area_plantio_ha,
        produtividade: g.produtividade_sc_ha,
        volume:
          g.area_plantio_ha != null && g.produtividade_sc_ha != null
            ? g.area_plantio_ha * g.produtividade_sc_ha
            : null,
        preco: g.preco_saca,
        custo: g.custo_saca,
      }));

      return {
        linhas: linhasFazenda.length > 0 ? linhasFazenda : linhasGrupo,
        culturas: culturas.data ?? [],
        fazendas: fazendas.data ?? [],
      };
    },
  });

  const safras = useMemo(
    () => [...new Set((data?.linhas ?? []).map((r) => r.safra))].sort(),
    [data?.linhas],
  );

  const filtradas = useMemo(() => {
    let rows = data?.linhas ?? [];
    if (safra !== "todas") rows = rows.filter((r) => r.safra === safra);
    if (fazenda !== "todas") rows = rows.filter((r) => r.fazenda_id === fazenda);
    if (cultura !== "todas") rows = rows.filter((r) => r.cultura_codigo === cultura);
    return rows;
  }, [data?.linhas, safra, fazenda, cultura]);

  const visiveis = COLUNAS_RELATORIO.filter((c) => colunas.includes(c.id));
  const pacoteBanco =
    colunas.length === COLUNAS_BANCO.length && COLUNAS_BANCO.every((id) => colunas.includes(id));

  const kpis = useMemo(() => {
    const area = filtradas.reduce((acc, r) => acc + (r.area ?? 0), 0);
    const comProd = filtradas.filter((r) => r.produtividade != null);
    const prodMedia =
      comProd.length > 0
        ? comProd.reduce((acc, r) => acc + (r.produtividade ?? 0), 0) / comProd.length
        : null;
    const volume = filtradas.reduce((acc, r) => acc + (r.volume ?? 0), 0);
    return { area, prodMedia, volume, qtd: filtradas.length };
  }, [filtradas]);

  const toggleColuna = (id: ColunaRelatorio, checked: boolean) => {
    setColunas((atual) => {
      if (checked) return COLUNAS_RELATORIO.map((c) => c.id).filter((c) => atual.includes(c) || c === id);
      if (atual.length === 1) return atual;
      return atual.filter((c) => c !== id);
    });
  };

  const aplicarPacoteBanco = () => setColunas([...COLUNAS_BANCO]);

  const exportarCsv = () => {
    const label = safra === "todas" ? "todas" : safra.replaceAll("/", "-");
    downloadCsv(
      `mandotti-safra-produtividade-${label}.csv`,
      visiveis.map((c) => c.label),
      filtradas.map((row) => visiveis.map((c) => valorColuna(row, c.id))),
    );
  };

  const safraLabel = safra === "todas" ? "Todas as safras" : `Safra ${safra}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="Pacote pronto de safra e produtividade para o banco. Monte as colunas — sem ativo nem passivo."
        action={
          <div className="no-print flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportarCsv} disabled={!filtradas.length}>
              <Download className="mr-2 size-4" />
              CSV
            </Button>
            <Button onClick={() => window.print()} disabled={!filtradas.length}>
              <Printer className="mr-2 size-4" />
              Imprimir / PDF
            </Button>
          </div>
        }
      />

      <BarraFiltros>
        <FiltroCard label="Safra">
          <Select value={safra} onValueChange={setSafra}>
            <SelectTrigger>
              <SelectValue />
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
          <Select value={fazenda} onValueChange={setFazenda}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {(data?.fazendas ?? []).map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FiltroCard>
        <FiltroCard label="Cultura">
          <Select value={cultura} onValueChange={setCultura}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {(data?.culturas ?? []).map((c) => (
                <SelectItem key={c.codigo} value={c.codigo}>
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FiltroCard>
        <FiltroCard
          label="Colunas"
          className="no-print w-[min(100%,17.5rem)] bg-brand-earth/20 [&_button]:h-10 [&_button]:bg-white/75"
        >
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between font-medium"
                aria-label="Colunas do relatório"
              >
                <span className="truncate">
                  {pacoteBanco ? "Pacote banco" : `${colunas.length} campos`}
                </span>
                <ChevronDown className="size-4 shrink-0 opacity-60" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 rounded-2xl p-2">
              <p className="px-2 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Campos do relatório
              </p>
              <div className="max-h-72 space-y-0.5 overflow-y-auto">
                {COLUNAS_RELATORIO.map((c) => (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <Checkbox
                      checked={colunas.includes(c.id)}
                      onCheckedChange={(v) => toggleColuna(c.id, v === true)}
                    />
                    <span className="min-w-0 flex-1 truncate">{c.label}</span>
                    {!c.banco ? (
                      <Badge variant="outline" className="font-normal">
                        opcional
                      </Badge>
                    ) : null}
                  </label>
                ))}
              </div>
              <div className="my-1 h-px bg-border" />
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm hover:bg-accent"
                onClick={aplicarPacoteBanco}
              >
                <FileSpreadsheet className="size-4 text-muted-foreground" />
                {pacoteBanco ? "Pacote banco ativo" : "Voltar ao pacote banco"}
              </button>
            </PopoverContent>
          </Popover>
        </FiltroCard>
      </BarraFiltros>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Linhas" value={kpis.qtd} icon={Layers} />
        <KpiCard
          label="Área"
          value={kpis.area ? `${kpis.area.toLocaleString("pt-BR")} ha` : "—"}
          icon={Sprout}
          tone="success"
        />
        <KpiCard
          label="Produtividade média"
          value={
            kpis.prodMedia != null ? `${kpis.prodMedia.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} sc/ha` : "—"
          }
          icon={Wheat}
          tone="info"
        />
        <KpiCard
          label="Volume estimado"
          value={kpis.volume ? `${kpis.volume.toLocaleString("pt-BR")} sc` : "—"}
          icon={FileSpreadsheet}
        />
      </div>

      <section id="relatorio-impressao" className="print-sheet rounded-[1.5rem] bg-card p-4 shadow-sm sm:p-6">
        <div className="mb-5 hidden print:block">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Grupo Mandotti
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight">Safra e produtividade</h2>
          <p className="text-sm text-muted-foreground">
            {safraLabel} · gerado em {new Date().toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2 print:hidden">
          <div>
            <h3 className="text-lg font-bold tracking-tight">Safra e produtividade</h3>
            <p className="text-sm text-muted-foreground">{safraLabel} · sem dados patrimoniais</p>
          </div>
          <Badge variant={pacoteBanco ? "default" : "secondary"}>
            {pacoteBanco ? "Pacote banco" : "Personalizado"}
          </Badge>
        </div>

        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : filtradas.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhum registro com os filtros atuais.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {visiveis.map((c) => (
                  <TableHead
                    key={c.id}
                    className={
                      c.id === "area" ||
                      c.id === "produtividade" ||
                      c.id === "volume" ||
                      c.id === "preco" ||
                      c.id === "custo"
                        ? "text-right"
                        : undefined
                    }
                  >
                    {c.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.map((row) => (
                <TableRow key={row.id}>
                  {visiveis.map((c) => (
                    <TableCell
                      key={c.id}
                      className={
                        c.id === "area" ||
                        c.id === "produtividade" ||
                        c.id === "volume" ||
                        c.id === "preco" ||
                        c.id === "custo"
                          ? "text-right font-mono-nums"
                          : c.id === "fazenda"
                            ? "font-medium"
                            : undefined
                      }
                    >
                      {formatarCelula(row, c.id)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
