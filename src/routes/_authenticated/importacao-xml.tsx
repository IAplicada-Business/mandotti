import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/AppShell";
import { SectionCard } from "@/components/design-system";
import { TabelaPreview } from "@/components/TabelaPreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { parseNfeXml, sugerirCategoria } from "@/lib/financeiro-import";
import { formatBRL, formatDateBR } from "@/lib/format";
import { useEmissor } from "@/lib/emissor-context";

export const Route = createFileRoute("/_authenticated/importacao-xml")({
  head: () => ({
    meta: [{ title: "Importação XML | Sistema Grupo Mandotti" }],
  }),
  component: ImportacaoXmlPage,
});

function ImportacaoXmlPage() {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useSession();
  const { pode } = usePerfil(user);
  const { emissores, emissorIds } = useEmissor();
  const podeEditar = pode("/importacao-xml", "editar");
  const [emissorId, setEmissorId] = useState(emissorIds[0] ?? "");

  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias_financeiras"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categorias_financeiras").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: imports = [], isLoading } = useQuery({
    queryKey: ["xml_importacoes", emissorIds],
    enabled: emissorIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("xml_importacoes")
        .select("*")
        .is("deleted_at", null)
        .in("emissor_id", emissorIds)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const importar = useMutation({
    mutationFn: async (files: FileList) => {
      if (!emissorId) throw new Error("Selecione um emissor");
      for (const file of Array.from(files)) {
        const text = await file.text();
        const parsed = parseNfeXml(text);
        const codigo = sugerirCategoria(parsed.textoBusca);
        const categoria = categorias.find((c) => c.codigo === codigo);

        let lancamentoId: string | null = null;
        let status: "processado" | "erro" = "processado";
        let erro: string | null = null;

        if (parsed.valorTotal && parsed.valorTotal > 0) {
          const tipo = codigo === "faturamento" ? "receita" : "despesa";
          const { data: lanc, error: lancErr } = await supabase
            .from("lancamentos")
            .insert({
              emissor_id: emissorId,
              categoria_id: categoria?.id ?? null,
              tipo,
              descricao: parsed.emitente
                ? `NF ${parsed.emitente}`
                : `Importação ${file.name}`,
              valor: parsed.valorTotal,
              data_competencia: parsed.data ?? new Date().toISOString().slice(0, 10),
              origem: "xml",
              xml_chave: parsed.chave,
              fornecedor: parsed.emitente,
            })
            .select("id")
            .single();
          if (lancErr) {
            status = "erro";
            erro = lancErr.message;
          } else {
            lancamentoId = lanc.id;
          }
        } else {
          status = "erro";
          erro = "Não foi possível ler o valor total do XML";
        }

        const { error } = await supabase.from("xml_importacoes").insert({
          emissor_id: emissorId,
          nome_arquivo: file.name,
          chave_nfe: parsed.chave,
          status,
          valor_total: parsed.valorTotal,
          emitente: parsed.emitente,
          categoria_sugerida: codigo,
          payload_resumo: {
            data: parsed.data,
            chave: parsed.chave,
          },
          erro,
          lancamento_id: lancamentoId,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("XML(s) processados");
      qc.invalidateQueries({ queryKey: ["xml_importacoes"] });
      qc.invalidateQueries({ queryKey: ["lancamentos"] });
      if (inputRef.current) inputRef.current.value = "";
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Importação XML"
        description="Upload manual de NF-e. Categorização automática revisável."
      />

      <SectionCard
        title="Enviar arquivos"
        description="Selecione o emissor dono da nota e um ou mais XMLs."
        action={
          podeEditar ? (
            <div className="flex flex-wrap items-center gap-2">
              <Select value={emissorId} onValueChange={setEmissorId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Emissor" />
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
              <input
                ref={inputRef}
                type="file"
                accept=".xml,text/xml,application/xml"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) importar.mutate(e.target.files);
                }}
              />
              <Button
                disabled={!emissorId || importar.isPending}
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="size-4" />
                {importar.isPending ? "Processando…" : "Escolher XML"}
              </Button>
            </div>
          ) : null
        }
      >
        <p className="text-sm text-muted-foreground">
          Regras rápidas: TRR/diesel → combustível; Maqcampo/AGRIMAC → manutenção; defensivos →
          químicos. Correções manuais no painel financeiro.
        </p>
      </SectionCard>

      <SectionCard title="Histórico de importações">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : imports.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Nenhum XML importado.</p>
        ) : (
          <TabelaPreview rows={imports}>
            {(visiveis) => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Arquivo</TableHead>
                <TableHead>Emitente</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Quando</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiveis.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="max-w-[180px] truncate font-medium">
                    {row.nome_arquivo}
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate">{row.emitente ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{row.categoria_sugerida ?? "—"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        row.status === "processado"
                          ? "success"
                          : row.status === "erro"
                            ? "destructive"
                            : "warning"
                      }
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDateBR(row.created_at.slice(0, 10))}</TableCell>
                  <TableCell className="text-right font-mono-nums">
                    {formatBRL(row.valor_total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
            )}
          </TabelaPreview>
        )}
      </SectionCard>
    </div>
  );
}
