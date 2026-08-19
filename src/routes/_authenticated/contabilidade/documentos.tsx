import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/AppShell";
import { SectionCard } from "@/components/design-system";
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

export const Route = createFileRoute("/_authenticated/contabilidade/documentos")({
  head: () => ({
    meta: [{ title: "Documentos fiscais | Contabilidade | Sistema Grupo Mandotti" }],
  }),
  component: DocumentosContabilidadePage,
});

function DocumentosContabilidadePage() {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useSession();
  const { pode } = usePerfil(user);
  const { emissores, emissorIds } = useEmissor();
  const podeImportar = pode("/contabilidade/documentos", "editar");
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
              descricao: parsed.emitente ? `NF ${parsed.emitente}` : `Importação ${file.name}`,
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
          payload_resumo: { data: parsed.data, chave: parsed.chave },
          erro,
          lancamento_id: lancamentoId,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Documento(s) fiscal(is) importado(s)");
      qc.invalidateQueries({ queryKey: ["xml_importacoes"] });
      qc.invalidateQueries({ queryKey: ["lancamentos"] });
      qc.invalidateQueries({ queryKey: ["contabilidade-dashboard"] });
      qc.invalidateQueries({ queryKey: ["contabilidade-financeiro"] });
      if (inputRef.current) inputRef.current.value = "";
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Contabilidade · Fiscal"
        title="Documentos fiscais"
        description="Importação de XML pela contabilidade. Lançamentos gerados alimentam gestão e exportações — sem duplicar cadastro manual."
      />

      <div className="rounded-xl border border-border/80 bg-surface-soft px-4 py-3 text-sm text-muted-foreground">
        XMLs importados aqui criam lançamentos visíveis em{" "}
        <strong className="text-foreground">Gestão → Financeiro</strong> e nos relatórios de
        exportação deste módulo.
      </div>

      <SectionCard
        title="Importar XML"
        description="NF-e do emissor selecionado"
        action={
          podeImportar ? (
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
        {!podeImportar ? (
          <p className="text-sm text-muted-foreground">Seu perfil tem acesso somente leitura.</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Categorização automática (combustível, químicos, manutenção, etc.) — mesma regra da gestão.
          </p>
        )}
      </SectionCard>

      <SectionCard title="Documentos processados">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : imports.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Nenhum documento importado.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Arquivo</TableHead>
                <TableHead>Emitente</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {imports.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="max-w-[180px] truncate font-medium">{row.nome_arquivo}</TableCell>
                  <TableCell className="max-w-[180px] truncate">{row.emitente ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{row.categoria_sugerida ?? "—"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.status === "processado" ? "success" : "destructive"}>
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDateBR(row.created_at.slice(0, 10))}</TableCell>
                  <TableCell className="text-right font-mono-nums">{formatBRL(row.valor_total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>
    </div>
  );
}
