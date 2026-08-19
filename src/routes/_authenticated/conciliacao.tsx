import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/AppShell";
import { KpiCard, SectionCard } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { parseExtratoCsv } from "@/lib/financeiro-import";
import { formatBRL, formatDateBR } from "@/lib/format";
import { useEmissor } from "@/lib/emissor-context";

export const Route = createFileRoute("/_authenticated/conciliacao")({
  head: () => ({
    meta: [{ title: "Conciliação | Sistema Grupo Mandotti" }],
  }),
  component: ConciliacaoPage,
});

function ConciliacaoPage() {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useSession();
  const { pode } = usePerfil(user);
  const { emissores, emissorIds } = useEmissor();
  const podeEditar = pode("/conciliacao", "editar");
  const [emissorId, setEmissorId] = useState(emissorIds[0] ?? "");
  const [banco, setBanco] = useState("Banco do Brasil");

  const { data: movimentos = [], isLoading } = useQuery({
    queryKey: ["extrato_movimentos", emissorIds],
    enabled: emissorIds.length > 0,
    queryFn: async () => {
      const { data: extratos, error: e1 } = await supabase
        .from("extratos_bancarios")
        .select("id, emissor_id, banco, nome_arquivo")
        .is("deleted_at", null)
        .in("emissor_id", emissorIds);
      if (e1) throw e1;
      const ids = (extratos ?? []).map((e) => e.id);
      if (!ids.length) return [];
      const { data, error } = await supabase
        .from("extrato_movimentos")
        .select("*")
        .is("deleted_at", null)
        .in("extrato_id", ids)
        .order("data_movimento", { ascending: false })
        .limit(300);
      if (error) throw error;
      return data.map((m) => ({
        ...m,
        extrato: extratos?.find((e) => e.id === m.extrato_id),
      }));
    },
  });

  const { data: lancamentos = [] } = useQuery({
    queryKey: ["lancamentos-abertos", emissorIds],
    enabled: emissorIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lancamentos")
        .select("*")
        .is("deleted_at", null)
        .eq("conciliado", false)
        .in("emissor_id", emissorIds);
      if (error) throw error;
      return data;
    },
  });

  const pendentes = movimentos.filter((m) => !m.conciliado);
  const conciliados = movimentos.filter((m) => m.conciliado);

  const importar = useMutation({
    mutationFn: async (file: File) => {
      if (!emissorId) throw new Error("Selecione um emissor");
      const text = await file.text();
      const rows = parseExtratoCsv(text);
      if (!rows.length) throw new Error("Nenhuma linha válida. Use CSV: data;descricao;valor");

      const { data: extrato, error: e1 } = await supabase
        .from("extratos_bancarios")
        .insert({
          emissor_id: emissorId,
          banco,
          nome_arquivo: file.name,
        })
        .select("id")
        .single();
      if (e1) throw e1;

      const payload = rows.map((r) => ({
        extrato_id: extrato.id,
        data_movimento: r.data,
        descricao: r.descricao,
        valor: r.valor,
        tipo: r.tipo,
        conciliado: false,
      }));

      const matched: typeof payload = [];
      for (const mov of payload) {
        const hit = lancamentos.find(
          (l) =>
            !l.conciliado &&
            Number(l.valor) === mov.valor &&
            l.data_competencia === mov.data_movimento &&
            ((mov.tipo === "debito" && l.tipo === "despesa") ||
              (mov.tipo === "credito" && l.tipo === "receita")),
        );
        if (hit) {
          matched.push({ ...mov, conciliado: true, lancamento_id: hit.id } as typeof mov & {
            lancamento_id: string;
          });
          await supabase.from("lancamentos").update({ conciliado: true }).eq("id", hit.id);
        } else {
          matched.push(mov);
        }
      }

      const { error: e2 } = await supabase.from("extrato_movimentos").insert(
        matched.map((m) => ({
          extrato_id: extrato.id,
          data_movimento: m.data_movimento,
          descricao: m.descricao,
          valor: m.valor,
          tipo: m.tipo,
          conciliado: "lancamento_id" in m ? true : m.conciliado,
          lancamento_id: "lancamento_id" in m ? (m as { lancamento_id: string }).lancamento_id : null,
        })),
      );
      if (e2) throw e2;
      return matched.filter((m) => "lancamento_id" in m).length;
    },
    onSuccess: (auto) => {
      toast.success(`Extrato importado. ${auto} movimento(s) conciliado(s) automaticamente.`);
      qc.invalidateQueries({ queryKey: ["extrato_movimentos"] });
      qc.invalidateQueries({ queryKey: ["lancamentos"] });
      qc.invalidateQueries({ queryKey: ["lancamentos-abertos"] });
      if (inputRef.current) inputRef.current.value = "";
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const vincular = useMutation({
    mutationFn: async ({ movimentoId, lancamentoId }: { movimentoId: string; lancamentoId: string }) => {
      const { error: e1 } = await supabase
        .from("extrato_movimentos")
        .update({ conciliado: true, lancamento_id: lancamentoId })
        .eq("id", movimentoId);
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from("lancamentos")
        .update({ conciliado: true })
        .eq("id", lancamentoId);
      if (e2) throw e2;
    },
    onSuccess: () => {
      toast.success("Movimento conciliado");
      qc.invalidateQueries({ queryKey: ["extrato_movimentos"] });
      qc.invalidateQueries({ queryKey: ["lancamentos-abertos"] });
      qc.invalidateQueries({ queryKey: ["lancamentos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Financeiro · Extratos"
        title="Conciliação bancária"
        description="Importação manual de extrato (CSV). Sem Open Finance — cruzamento nota × Pix/transferência."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Movimentos" value={movimentos.length} />
        <KpiCard label="Pendentes" value={pendentes.length} tone="warning" />
        <KpiCard label="Conciliados" value={conciliados.length} tone="success" />
      </div>

      <SectionCard
        title="Importar extrato CSV"
        description="Formato: data;descricao;valor (valor negativo = débito)."
        action={
          podeEditar ? (
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Emissor</Label>
                <Select value={emissorId} onValueChange={setEmissorId}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
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
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Banco</Label>
                <Input
                  className="w-[160px]"
                  value={banco}
                  onChange={(e) => setBanco(e.target.value)}
                />
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv,text/plain"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importar.mutate(f);
                }}
              />
              <Button disabled={importar.isPending} onClick={() => inputRef.current?.click()}>
                <Upload className="size-4" />
                Upload
              </Button>
            </div>
          ) : null
        }
      >
        <p className="text-sm text-muted-foreground">
          Divergências ficam na fila de pendentes — nunca excluímos lançamento automaticamente.
        </p>
      </SectionCard>

      <SectionCard title="Fila de movimentos">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : movimentos.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhum extrato importado.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movimentos.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{formatDateBR(m.data_movimento)}</TableCell>
                  <TableCell className="max-w-[260px] truncate">{m.descricao}</TableCell>
                  <TableCell>
                    <Badge variant={m.tipo === "credito" ? "success" : "warning"}>{m.tipo}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.conciliado ? "success" : "muted"}>
                      {m.conciliado ? "conciliado" : "pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono-nums">{formatBRL(m.valor)}</TableCell>
                  <TableCell className="text-right">
                    {!m.conciliado && podeEditar ? (
                      <Select
                        onValueChange={(lancamentoId) =>
                          vincular.mutate({ movimentoId: m.id, lancamentoId })
                        }
                      >
                        <SelectTrigger className="ml-auto w-[160px]">
                          <SelectValue placeholder="Vincular…" />
                        </SelectTrigger>
                        <SelectContent>
                          {lancamentos
                            .filter((l) => Number(l.valor) === Number(m.valor))
                            .map((l) => (
                              <SelectItem key={l.id} value={l.id}>
                                <span className="inline-flex items-center gap-1">
                                  <Link2 className="size-3" />
                                  {l.descricao.slice(0, 28)}
                                </span>
                              </SelectItem>
                            ))}
                        {lancamentos.filter((l) => Number(l.valor) === Number(m.valor)).length ===
                        0 ? (
                          <div className="px-2 py-1.5 text-xs text-muted-foreground">
                            Sem lançamento no mesmo valor
                          </div>
                        ) : null}
                        </SelectContent>
                      </Select>
                    ) : (
                      "—"
                    )}
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
