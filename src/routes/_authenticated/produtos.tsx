import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/AppShell";
import { SectionCard } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/produtos")({
  head: () => ({ meta: [{ title: "Culturas | Sistema Grupo Mandotti" }] }),
  component: ProdutosPage,
});

const COR: Record<string, string> = {
  "accent-verde-claro": "bg-[var(--accent-verde-claro)]",
  "accent-dourado": "bg-[var(--accent-dourado)]",
  "accent-terracota": "bg-[var(--accent-terracota)]",
  "accent-marrom-terra": "bg-[var(--accent-marrom-terra)]",
};

function ProdutosPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["produtos_agricolas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos_agricolas")
        .select("*")
        .eq("ativo", true)
        .order("ordem");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Produção"
        title="Culturas da operação"
        description="Soja, milho, sorgo e milheto — base para safras, contratos e comparativos (planilha de produtividade)."
      />

      <SectionCard title="Cadastro de referência">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cultura</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cor (gráficos)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nome}</TableCell>
                  <TableCell>
                    <code className="text-xs">{p.codigo}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{p.tipo}</Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-block size-4 rounded-full ${COR[p.cor_token ?? ""] ?? "bg-muted"}`}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Produtividades históricas da planilha (soja 23/24: 66 sc/ha · 24/25: 63 · 25/26: 63) entram no
          módulo Produção & Safras.
        </p>
      </SectionCard>
    </div>
  );
}
