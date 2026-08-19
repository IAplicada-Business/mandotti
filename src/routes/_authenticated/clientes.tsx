import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Handshake, ShoppingCart, UserCircle } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/AppShell";
import { KpiCard, SectionCard } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
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
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes & Compradores | Sistema Grupo Mandotti" },
      {
        name: "description",
        content: "Tradings e compradores da produção — base para contratos e emissão de NF.",
      },
    ],
  }),
  component: ClientesPage,
});

const STATUS_LABEL: Record<string, string> = {
  cadastrado: "Cadastrado",
  negociando: "Negociando",
  firmado: "Firmado",
  entregue: "Entregue",
  pagamento_validado: "Pagamento validado",
  faturado: "Faturado",
  ativo: "Ativo",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  cadastrado: "outline",
  negociando: "secondary",
  firmado: "default",
  entregue: "default",
  pagamento_validado: "default",
  faturado: "default",
  ativo: "default",
};

function ClientesPage() {
  const [safraFiltro, setSafraFiltro] = useState("todas");

  const { data, isLoading } = useQuery({
    queryKey: ["clientes-compradores"],
    queryFn: async () => {
      const [compradores, negociacoes, culturas] = await Promise.all([
        supabase
          .from("grupo_contatos")
          .select("*")
          .eq("categoria", "destino_producao")
          .order("ordem"),
        supabase
          .from("negociacoes_comerciais")
          .select("*, grupo_contatos(nome, cidade)")
          .is("deleted_at", null)
          .order("safra")
          .order("cultura_codigo"),
        supabase.from("produtos_agricolas").select("codigo, nome").order("ordem"),
      ]);
      if (compradores.error) throw compradores.error;
      if (negociacoes.error) throw negociacoes.error;
      if (culturas.error) throw culturas.error;

      const culturaNome = Object.fromEntries((culturas.data ?? []).map((c) => [c.codigo, c.nome]));

      return {
        compradores: compradores.data ?? [],
        negociacoes: negociacoes.data ?? [],
        culturaNome,
      };
    },
  });

  const safras = useMemo(
    () => [...new Set((data?.negociacoes ?? []).map((n) => n.safra))].sort(),
    [data?.negociacoes],
  );

  const negociacoes = useMemo(() => {
    let rows = data?.negociacoes ?? [];
    if (safraFiltro !== "todas") rows = rows.filter((n) => n.safra === safraFiltro);
    return rows;
  }, [data?.negociacoes, safraFiltro]);

  const compradoresUnicos = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        nome: string;
        cidade: string | null;
        status: string;
        email: string | null;
        telefone: string | null;
      }
    >();
    for (const c of data?.compradores ?? []) {
      const key = `${c.nome}|${c.cidade ?? ""}`;
      if (!map.has(key)) {
        map.set(key, {
          id: c.id,
          nome: c.nome,
          cidade: c.cidade,
          status: c.status,
          email: c.email,
          telefone: c.telefone,
        });
      }
    }
    return [...map.values()];
  }, [data?.compradores]);

  const negociando = negociacoes.filter((n) => n.status === "negociando").length;
  const firmadas = negociacoes.filter((n) =>
    ["firmado", "entregue", "pagamento_validado"].includes(n.status),
  ).length;
  const aguardandoNf = negociacoes.filter((n) => n.status === "pagamento_validado").length;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Fiscal · Comercial"
        title="Clientes & Compradores"
        description="Tradings e esmagadoras da ficha cadastral — destino da produção. Base para negociações, validação de pagamento e emissão de NF."
        action={
          <div className="flex flex-wrap gap-2">
            <Select value={safraFiltro} onValueChange={setSafraFiltro}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Safra" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as safras</SelectItem>
                {safras.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ButtonLink to="/notas-fiscais" label="Notas fiscais" />
          </div>
        }
      />

      <div className="rounded-xl border border-border/80 bg-surface-soft px-4 py-3 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">Dados da planilha:</span> compradores importados
        da aba <strong>Dados Cadastrais → Destino da produção</strong> (ADM, Agronorte). Negociações
        iniciais vinculam culturas e safras da produção. Parceiros completos também em{" "}
        <Link to="/contratos" className="font-semibold text-primary hover:underline">
          Contratos · Tradings
        </Link>
        .
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Compradores" value={compradoresUnicos.length} icon={UserCircle} tone="info" />
        <KpiCard label="Negociações" value={negociacoes.length} icon={Handshake} hint="Por safra/cultura" />
        <KpiCard label="Em negociação" value={negociando} tone="warning" />
        <KpiCard
          label="Prontas p/ NF"
          value={aguardandoNf}
          icon={ShoppingCart}
          hint={firmadas > 0 ? `${firmadas} firmada(s)` : undefined}
          tone={aguardandoNf > 0 ? "success" : "default"}
        />
      </div>

      <SectionCard title="Compradores cadastrados" description="Destino da produção — ficha cadastral">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : compradoresUnicos.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhum comprador importado.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trading / Comprador</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead className="text-right">Negociações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {compradoresUnicos.map((c) => {
                const qtd = negociacoes.filter(
                  (n) => n.grupo_contatos?.nome === c.nome && n.grupo_contatos?.cidade === c.cidade,
                ).length;
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{c.cidade ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[c.status] ?? "outline"}>
                        {STATUS_LABEL[c.status] ?? c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{c.email ?? "—"}</TableCell>
                    <TableCell className="text-sm">{c.telefone ?? "—"}</TableCell>
                    <TableCell className="text-right font-mono-nums">{qtd}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </SectionCard>

      <SectionCard
        title="Negociações comerciais"
        description="Compras/vendas por cultura e safra — volume e preço serão firmados antes da NF"
      >
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : negociacoes.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma negociação para os filtros atuais.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Comprador</TableHead>
                <TableHead>Cultura</TableHead>
                <TableHead>Safra</TableHead>
                <TableHead className="text-right">Volume (sc)</TableHead>
                <TableHead className="text-right">Preço/sc</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Observação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {negociacoes.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="font-medium">
                    {n.grupo_contatos?.nome ?? "—"}
                    {n.grupo_contatos?.cidade ? (
                      <span className="block text-xs text-muted-foreground">{n.grupo_contatos.cidade}</span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {data?.culturaNome[n.cultura_codigo] ?? n.cultura_codigo}
                    </Badge>
                  </TableCell>
                  <TableCell>{n.safra}</TableCell>
                  <TableCell className="text-right font-mono-nums">
                    {n.volume_sc != null ? n.volume_sc.toLocaleString("pt-BR") : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono-nums">
                    {n.preco_saca != null ? formatBRL(n.preco_saca) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[n.status] ?? "outline"}>
                      {STATUS_LABEL[n.status] ?? n.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {n.observacoes ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>
    </div>
  );
}

function ButtonLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex h-9 items-center gap-1 rounded-xl border border-border bg-background px-4 text-sm font-medium hover:bg-surface-soft"
    >
      {label} <ArrowRight className="size-4" />
    </Link>
  );
}
