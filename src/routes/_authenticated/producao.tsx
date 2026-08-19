import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/AppShell";
import { KpiCard, SectionCard } from "@/components/design-system";
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

export const Route = createFileRoute("/_authenticated/producao")({
  head: () => ({ meta: [{ title: "Produção & Safras | Sistema Grupo Mandotti" }] }),
  component: ProducaoPage,
});

function fmtHa(n: number | null | undefined) {
  if (n == null) return "—";
  return `${n.toLocaleString("pt-BR")} ha`;
}

function fmtScHa(n: number | null | undefined) {
  if (n == null) return "—";
  return `${n.toLocaleString("pt-BR")} sc/ha`;
}

function ProducaoPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["producao-planilha"],
    queryFn: async () => {
      const [grupo, fazenda, culturas] = await Promise.all([
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
        supabase.from("produtos_agricolas").select("codigo, nome"),
      ]);
      if (grupo.error) throw grupo.error;
      if (fazenda.error) throw fazenda.error;
      if (culturas.error) throw culturas.error;

      const culturaNome = Object.fromEntries(
        (culturas.data ?? []).map((c) => [c.codigo, c.nome]),
      );

      return {
        grupo: grupo.data ?? [],
        fazenda: fazenda.data ?? [],
        culturaNome,
      };
    },
  });

  const safraAtual = data?.grupo.filter((r) => r.safra === "2026/27") ?? [];
  const historico = data?.grupo.filter((r) => r.tipo === "realizado") ?? [];
  const projecao = data?.grupo.filter((r) => r.tipo === "projecao") ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Operação · Produção"
        title="Produção & Safras"
        description="Dados importados da ficha cadastral (aba Dados Operacionais). Romaneios e clima entram na próxima fase."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {safraAtual.map((row) => (
          <KpiCard
            key={`${row.cultura_codigo}-${row.ciclo}`}
            label={`${row.cultura_codigo.toUpperCase()} ${row.ciclo === "safrinha" ? "safrinha" : ""} · 26/27`}
            value={fmtHa(row.area_plantio_ha)}
            hint={
              row.produtividade_sc_ha
                ? `${fmtScHa(row.produtividade_sc_ha)} · realizado`
                : "Projeção de área"
            }
          />
        ))}
      </div>

      <Tabs defaultValue="fazendas">
        <TabsList>
          <TabsTrigger value="fazendas">Por fazenda (26/27+)</TabsTrigger>
          <TabsTrigger value="historico">Histórico grupo</TabsTrigger>
          <TabsTrigger value="projecao">Projeções grupo</TabsTrigger>
        </TabsList>

        <TabsContent value="fazendas">
          <SectionCard
            title="Previsão por imóvel"
            description="Safra 2026/27 (soja) e rotação 2027/28 conforme planilha."
          >
            {isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>
            ) : (
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
                  {(data?.fazenda ?? []).map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.safra}</TableCell>
                      <TableCell>
                        {(row.fazendas as { nome?: string; codigo?: string } | null)?.nome ??
                          "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {data?.culturaNome[row.cultura_codigo] ?? row.cultura_codigo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{fmtHa(row.area_plantio_ha)}</TableCell>
                      <TableCell className="text-right">
                        {fmtScHa(row.produtividade_sc_ha)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.matricula ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="historico">
          <SectionCard title="Últimas safras — grupo" description="Área, produtividade, preço e custo (planilha).">
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
                {historico.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      {row.safra}
                      {row.ciclo === "safrinha" ? " · safrinha" : ""}
                    </TableCell>
                    <TableCell>{data?.culturaNome[row.cultura_codigo] ?? row.cultura_codigo}</TableCell>
                    <TableCell className="text-right">{fmtHa(row.area_plantio_ha)}</TableCell>
                    <TableCell className="text-right">{fmtScHa(row.produtividade_sc_ha)}</TableCell>
                    <TableCell className="text-right">
                      {row.preco_saca != null
                        ? row.preco_saca.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.custo_saca != null
                        ? row.custo_saca.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
        </TabsContent>

        <TabsContent value="projecao">
          <SectionCard title="Projeções — grupo" description="Meta expansão até 7.000 ha (2029/30).">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Safra</TableHead>
                  <TableHead>Cultura</TableHead>
                  <TableHead className="text-right">Área projetada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projecao.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      {row.safra}
                      {row.ciclo === "safrinha" ? " · safrinha" : ""}
                    </TableCell>
                    <TableCell>{data?.culturaNome[row.cultura_codigo] ?? row.cultura_codigo}</TableCell>
                    <TableCell className="text-right">{fmtHa(row.area_plantio_ha)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
