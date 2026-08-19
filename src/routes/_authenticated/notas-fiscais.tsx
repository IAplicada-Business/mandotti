import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText, ScrollText, ShieldCheck } from "lucide-react";
import { useMemo } from "react";

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
import { formatBRL, formatDateBR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/notas-fiscais")({
  head: () => ({
    meta: [
      { title: "Notas fiscais | Sistema Grupo Mandotti" },
      { name: "description", content: "Emissão e acompanhamento de documentos fiscais." },
      { property: "og:title", content: "Notas fiscais | Sistema Grupo Mandotti" },
      { property: "og:description", content: "Emissão e acompanhamento de documentos fiscais." },
    ],
  }),
  component: NotasFiscaisPage,
});

const NEG_STATUS: Record<string, string> = {
  cadastrado: "Cadastrado",
  negociando: "Negociando",
  firmado: "Firmado",
  entregue: "Entregue",
  pagamento_validado: "Pagamento validado",
  faturado: "Faturado",
};

const NF_STATUS: Record<string, string> = {
  pendente: "Pendente",
  emitida: "Emitida",
  cancelada: "Cancelada",
};

function NotasFiscaisPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["notas-fiscais-painel"],
    queryFn: async () => {
      const [negociacoes, notas, culturas] = await Promise.all([
        supabase
          .from("negociacoes_comerciais")
          .select("*, grupo_contatos(nome, cidade)")
          .is("deleted_at", null)
          .in("status", ["firmado", "entregue", "pagamento_validado", "negociando"])
          .order("safra"),
        supabase
          .from("notas_fiscais")
          .select("*, grupo_contatos(nome)")
          .is("deleted_at", null)
          .order("created_at", { ascending: false }),
        supabase.from("produtos_agricolas").select("codigo, nome"),
      ]);
      if (negociacoes.error) throw negociacoes.error;
      if (notas.error) throw notas.error;
      if (culturas.error) throw culturas.error;

      const culturaNome = Object.fromEntries((culturas.data ?? []).map((c) => [c.codigo, c.nome]));

      return {
        negociacoes: negociacoes.data ?? [],
        notas: notas.data ?? [],
        culturaNome,
      };
    },
  });

  const filaNf = useMemo(
    () =>
      (data?.negociacoes ?? []).filter((n) =>
        ["firmado", "entregue", "pagamento_validado"].includes(n.status),
      ),
    [data?.negociacoes],
  );

  const prontasEmitir = filaNf.filter((n) => n.status === "pagamento_validado").length;
  const emitidas = (data?.notas ?? []).filter((n) => n.status === "emitida").length;
  const pendentes = (data?.notas ?? []).filter((n) => n.status === "pendente").length;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Fiscal"
        title="Notas fiscais"
        description="Estrutura para emissão após validação de pagamento (Pix/transferência). Compradores e negociações vêm da planilha."
        action={
          <Link
            to="/clientes"
            className="inline-flex h-9 items-center rounded-xl border border-border bg-background px-4 text-sm font-medium hover:bg-surface-soft"
          >
            Clientes & Compradores
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Negociações ativas" value={data?.negociacoes.length ?? 0} icon={ScrollText} />
        <KpiCard
          label="Aguardando pagamento"
          value={filaNf.filter((n) => n.status !== "pagamento_validado").length}
          tone="warning"
        />
        <KpiCard
          label="Prontas p/ emitir NF"
          value={prontasEmitir}
          icon={ShieldCheck}
          tone={prontasEmitir > 0 ? "success" : "default"}
        />
        <KpiCard label="NFs emitidas" value={emitidas} icon={FileText} hint={`${pendentes} pendente(s)`} />
      </div>

      <Tabs defaultValue="fila">
        <TabsList>
          <TabsTrigger value="fila">Fila comercial ({filaNf.length})</TabsTrigger>
          <TabsTrigger value="notas">Notas fiscais ({data?.notas.length ?? 0})</TabsTrigger>
          <TabsTrigger value="negociando">
            Em negociação ({(data?.negociacoes ?? []).filter((n) => n.status === "negociando").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fila" className="mt-4">
          <SectionCard
            title="Fila para faturamento"
            description="Negociações firmadas ou com pagamento validado — base para emissão de NF"
          >
            {isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>
            ) : filaNf.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Nenhuma negociação na fila. Avance o status em Clientes & Compradores quando houver
                contrato firmado ou pagamento confirmado.
              </p>
            ) : (
              <TabelaPreview rows={filaNf}>
                {(visiveis) => (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Comprador</TableHead>
                    <TableHead>Cultura</TableHead>
                    <TableHead>Safra</TableHead>
                    <TableHead className="text-right">Volume</TableHead>
                    <TableHead className="text-right">Preço/sc</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Próximo passo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiveis.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell className="font-medium">{n.grupo_contatos?.nome ?? "—"}</TableCell>
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
                        <Badge variant={n.status === "pagamento_validado" ? "default" : "secondary"}>
                          {NEG_STATUS[n.status] ?? n.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {n.status === "pagamento_validado"
                          ? "Emitir NF"
                          : n.status === "entregue"
                            ? "Validar pagamento"
                            : "Aguardar entrega"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
                )}
              </TabelaPreview>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="notas" className="mt-4">
          <SectionCard title="Notas fiscais" description="Documentos emitidos ou pendentes">
            {isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>
            ) : (data?.notas.length ?? 0) === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-surface-soft px-6 py-14 text-center">
                <p className="text-base font-bold text-foreground">Nenhuma nota fiscal ainda</p>
                <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
                  A estrutura está pronta: quando uma negociação tiver pagamento validado, a NF será
                  registrada aqui com número, série, chave de acesso e vínculo ao comprador.
                </p>
              </div>
            ) : (
              <TabelaPreview rows={data?.notas ?? []}>
                {(visiveis) => (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Comprador</TableHead>
                    <TableHead>Emissão</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiveis.map((nf) => (
                    <TableRow key={nf.id}>
                      <TableCell className="font-mono-nums">
                        {nf.numero ?? "—"}
                        {nf.serie ? ` / ${nf.serie}` : ""}
                      </TableCell>
                      <TableCell>{nf.grupo_contatos?.nome ?? "—"}</TableCell>
                      <TableCell>{formatDateBR(nf.data_emissao)}</TableCell>
                      <TableCell className="text-right font-mono-nums">{formatBRL(nf.valor)}</TableCell>
                      <TableCell>
                        <Badge variant={nf.status === "emitida" ? "default" : "outline"}>
                          {NF_STATUS[nf.status] ?? nf.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
                )}
              </TabelaPreview>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="negociando" className="mt-4">
          <SectionCard title="Em negociação" description="Compradores e culturas ainda sem contrato firmado">
            <TabelaNegociacoes
              rows={(data?.negociacoes ?? []).filter((n) => n.status === "negociando")}
              culturaNome={data?.culturaNome ?? {}}
              loading={isLoading}
            />
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TabelaNegociacoes({
  rows,
  culturaNome,
  loading,
}: {
  rows: {
    id: string;
    cultura_codigo: string;
    safra: string;
    preco_saca: number | null;
    grupo_contatos: { nome: string; cidade: string | null } | null;
  }[];
  culturaNome: Record<string, string>;
  loading: boolean;
}) {
  if (loading) return <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>;
  if (!rows.length) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma negociação em andamento.</p>
    );
  }
  return (
    <TabelaPreview rows={rows}>
      {(visiveis) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Comprador</TableHead>
          <TableHead>Cultura</TableHead>
          <TableHead>Safra</TableHead>
          <TableHead className="text-right">Preço ref./sc</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {visiveis.map((n) => (
          <TableRow key={n.id}>
            <TableCell className="font-medium">
              {n.grupo_contatos?.nome ?? "—"}
              {n.grupo_contatos?.cidade ? (
                <span className="block text-xs text-muted-foreground">{n.grupo_contatos.cidade}</span>
              ) : null}
            </TableCell>
            <TableCell>
              <Badge variant="outline">{culturaNome[n.cultura_codigo] ?? n.cultura_codigo}</Badge>
            </TableCell>
            <TableCell>{n.safra}</TableCell>
            <TableCell className="text-right font-mono-nums">
              {n.preco_saca != null ? formatBRL(n.preco_saca) : "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
      )}
    </TabelaPreview>
  );
}
