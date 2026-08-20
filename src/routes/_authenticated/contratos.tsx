import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ClipboardList, Handshake, Scale, Truck } from "lucide-react";

import { PageHeader } from "@/components/AppShell";
import { KpiCard, SectionCard } from "@/components/design-system";
import { TabelaPreview } from "@/components/TabelaPreview";
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

export const Route = createFileRoute("/_authenticated/contratos")({
  head: () => ({
    meta: [
      { title: "Contratos · Tradings | Sistema Grupo Mandotti" },
      {
        name: "description",
        content: "Parceiros comerciais, destinos de produção e contratos forward do Grupo Mandotti.",
      },
    ],
  }),
  component: ContratosPage,
});

const CATEGORIA_LABEL: Record<string, string> = {
  destino_producao: "Destino da produção",
  fornecedor: "Fornecedor",
  referencia_comercial: "Ref. comercial",
  referencia_bancaria: "Ref. bancária",
  referencia_pessoal: "Ref. pessoal",
};

const CATEGORIA_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  destino_producao: "default",
  fornecedor: "secondary",
  referencia_comercial: "outline",
  referencia_bancaria: "outline",
  referencia_pessoal: "outline",
};

function ContratosPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["grupo-contatos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grupo_contatos")
        .select("*")
        .order("ordem");
      if (error) throw error;
      return data;
    },
  });

  const destinos = data.filter((c) => c.categoria === "destino_producao");
  const fornecedores = data.filter((c) => c.categoria === "fornecedor");
  const referencias = data.filter((c) => c.categoria.startsWith("referencia_"));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contratos · Tradings"
        description="Parceiros comerciais e destinos da produção. Negociações forward entram aqui; dívidas bancárias ficam em Passivos · SCR."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Destinos" value={destinos.length} icon={Handshake} tone="info" hint="Tradings / esmagadoras" />
        <KpiCard label="Fornecedores" value={fornecedores.length} icon={Truck} tone="success" />
        <KpiCard label="Referências" value={referencias.length} icon={Handshake} />
        <KpiCard label="Total cadastros" value={data.length} icon={ClipboardList} hint="Planilha Mandotti" />
      </div>

      <Link
        to="/passivos"
        className="flex items-center justify-between rounded-[1.25rem] bg-warning/12 px-4 py-3.5 text-sm transition-colors hover:bg-warning/18"
      >
        <span className="inline-flex items-center gap-2 font-semibold">
          <Scale className="size-4 text-warning" />
          Dívidas e contratos SCR (Bacen) — 23 contratos com cronograma
        </span>
        <ArrowRight className="size-4" />
      </Link>

      <Tabs defaultValue="destinos">
        <TabsList>
          <TabsTrigger value="destinos">Destinos ({destinos.length})</TabsTrigger>
          <TabsTrigger value="fornecedores">Fornecedores ({fornecedores.length})</TabsTrigger>
          <TabsTrigger value="referencias">Referências ({referencias.length})</TabsTrigger>
          <TabsTrigger value="forward">Forward (0)</TabsTrigger>
        </TabsList>

        <TabsContent value="destinos">
          <SectionCard
            title="Destino da produção"
            description="Tradings, esmagadoras e cerealistas — base para contratos forward"
          >
            <TabelaContatos rows={destinos} loading={isLoading} />
          </SectionCard>
        </TabsContent>

        <TabsContent value="fornecedores">
          <SectionCard title="Principais fornecedores" description="Insumos e serviços">
            <TabelaContatos rows={fornecedores} loading={isLoading} />
          </SectionCard>
        </TabsContent>

        <TabsContent value="referencias">
          <SectionCard title="Fontes de referência" description="Bancárias, comerciais e pessoais">
            <TabelaContatos rows={referencias} loading={isLoading} showContato />
          </SectionCard>
        </TabsContent>

        <TabsContent value="forward">
          <SectionCard
            title="Contratos forward"
            description="Negociações futuras (soja, milho, sorgo, milheto) — sem histórico anterior na planilha"
          >
            <div className="rounded-[1.25rem] bg-surface-soft px-6 py-14 text-center">
              <p className="text-base font-bold text-foreground">Nenhum contrato forward registrado</p>
              <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
                Os parceiros acima ({destinos.map((d) => d.nome).join(", ") || "—"}) já estão cadastrados como
                destinos. Quando houver volume, preço e safra firmados, eles aparecerão aqui com status
                negociando / firmado.
              </p>
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TabelaContatos({
  rows,
  loading,
  showContato,
}: {
  rows: {
    id: string;
    nome: string;
    categoria: string;
    cidade: string | null;
    contato_nome: string | null;
    agencia: string | null;
    email: string | null;
    telefone: string | null;
    endereco: string | null;
  }[];
  loading: boolean;
  showContato?: boolean;
}) {
  if (loading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>;
  }
  if (!rows.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Nenhum registro</p>;
  }

  return (
    <TabelaPreview rows={rows}>
      {(visiveis) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Categoria</TableHead>
          <TableHead>Cidade</TableHead>
          {showContato && <TableHead>Contato / Agência</TableHead>}
          <TableHead>E-mail</TableHead>
          <TableHead>Telefone</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {visiveis.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.nome}</TableCell>
            <TableCell>
              <Badge variant={CATEGORIA_VARIANT[row.categoria] ?? "outline"}>
                {CATEGORIA_LABEL[row.categoria] ?? row.categoria}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">{row.cidade ?? "—"}</TableCell>
            {showContato && (
              <TableCell className="text-sm">
                {[row.contato_nome, row.agencia ? `Ag. ${row.agencia}` : null].filter(Boolean).join(" · ") || "—"}
              </TableCell>
            )}
            <TableCell className="text-sm">{row.email ?? "—"}</TableCell>
            <TableCell className="text-sm">{row.telefone ?? "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
      )}
    </TabelaPreview>
  );
}
