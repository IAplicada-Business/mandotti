import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, FileText, Plus, ScrollText, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AcoesCadastro } from "@/components/AcoesCadastro";
import { PageHeader } from "@/components/AppShell";
import { KpiCard, SectionCard } from "@/components/design-system";
import { TabelaPreview } from "@/components/TabelaPreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePerfil, useSession } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { emptyToNull, formatBRL, formatDateBR, numOrNull } from "@/lib/format";
import { useEmissor } from "@/lib/emissor-context";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/notas-fiscais")({
  head: () => ({
    meta: [
      { title: "Notas fiscais | Sistema Grupo Mandotti" },
      { name: "description", content: "Emissão e acompanhamento de documentos fiscais." },
    ],
  }),
  component: NotasFiscaisPage,
});

type NegStatus = Database["public"]["Enums"]["negociacao_status"];
type NfStatus = Database["public"]["Enums"]["nota_fiscal_status"];

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

type FormNf = {
  id?: string;
  comprador_id: string;
  emissor_id: string;
  negociacao_id: string;
  cultura_codigo: string;
  numero: string;
  serie: string;
  data_emissao: string;
  valor: string;
  volume_sc: string;
  chave_acesso: string;
  status: NfStatus;
};

const VAZIO_NF: FormNf = {
  comprador_id: "",
  emissor_id: "",
  negociacao_id: "",
  cultura_codigo: "",
  numero: "",
  serie: "",
  data_emissao: "",
  valor: "",
  volume_sc: "",
  chave_acesso: "",
  status: "pendente",
};

function NotasFiscaisPage() {
  const qc = useQueryClient();
  const { user } = useSession();
  const { pode } = usePerfil(user);
  const { emissores, emissorIds } = useEmissor();
  const podeEditar = pode("/notas-fiscais", "editar");
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<FormNf>(VAZIO_NF);

  const { data, isLoading } = useQuery({
    queryKey: ["notas-fiscais-painel"],
    queryFn: async () => {
      const [negociacoes, notas, culturas, compradores] = await Promise.all([
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
        supabase.from("grupo_contatos").select("id, nome").eq("categoria", "destino_producao"),
      ]);
      if (negociacoes.error) throw negociacoes.error;
      if (notas.error) throw notas.error;
      if (culturas.error) throw culturas.error;
      if (compradores.error) throw compradores.error;

      const culturaNome = Object.fromEntries((culturas.data ?? []).map((c) => [c.codigo, c.nome]));

      return {
        negociacoes: negociacoes.data ?? [],
        notas: notas.data ?? [],
        culturaNome,
        compradores: compradores.data ?? [],
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

  const avancarStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: NegStatus }) => {
      const { error } = await supabase.from("negociacoes_comerciais").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status atualizado");
      qc.invalidateQueries({ queryKey: ["notas-fiscais-painel"] });
      qc.invalidateQueries({ queryKey: ["clientes-compradores"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const salvarNf = useMutation({
    mutationFn: async (f: FormNf) => {
      if (!f.comprador_id || !f.emissor_id) throw new Error("Informe emissor e comprador");
      const payload = {
        comprador_id: f.comprador_id,
        emissor_id: f.emissor_id,
        negociacao_id: emptyToNull(f.negociacao_id),
        cultura_codigo: emptyToNull(f.cultura_codigo),
        numero: emptyToNull(f.numero),
        serie: emptyToNull(f.serie),
        data_emissao: emptyToNull(f.data_emissao),
        valor: numOrNull(f.valor),
        volume_sc: numOrNull(f.volume_sc),
        chave_acesso: emptyToNull(f.chave_acesso),
        status: f.status,
      };
      const res = f.id
        ? await supabase.from("notas_fiscais").update(payload).eq("id", f.id)
        : await supabase.from("notas_fiscais").insert(payload);
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      toast.success("Nota fiscal salva");
      setAberto(false);
      setForm(VAZIO_NF);
      qc.invalidateQueries({ queryKey: ["notas-fiscais-painel"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const excluirNf = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notas_fiscais")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Nota excluída");
      qc.invalidateQueries({ queryKey: ["notas-fiscais-painel"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const abrirDeNegociacao = (n: (typeof filaNf)[number]) => {
    setForm({
      ...VAZIO_NF,
      comprador_id: n.comprador_id,
      emissor_id: n.emissor_id ?? emissorIds[0] ?? "",
      negociacao_id: n.id,
      cultura_codigo: n.cultura_codigo,
      volume_sc: n.volume_sc != null ? String(n.volume_sc) : "",
      valor:
        n.volume_sc != null && n.preco_saca != null ? String(n.volume_sc * n.preco_saca) : "",
      data_emissao: new Date().toISOString().slice(0, 10),
      status: "pendente",
    });
    setAberto(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notas fiscais"
        description="Avance o status da fila comercial, registre a NF e exclua linhas da planilha."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to="/clientes">Clientes & Compradores</Link>
            </Button>
            {podeEditar ? (
              <Button
                onClick={() => {
                  setForm({
                    ...VAZIO_NF,
                    emissor_id: emissorIds[0] ?? "",
                    comprador_id: data?.compradores[0]?.id ?? "",
                    data_emissao: new Date().toISOString().slice(0, 10),
                  });
                  setAberto(true);
                }}
              >
                <Plus className="mr-2 size-4" />
                Registrar NF
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Negociações ativas" value={data?.negociacoes.length ?? 0} icon={ScrollText} />
        <KpiCard
          label="Aguardando pagamento"
          value={filaNf.filter((n) => n.status !== "pagamento_validado").length}
          icon={Clock}
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
            description="Avance o status ou registre a nota a partir da negociação"
          >
            {isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>
            ) : filaNf.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Nenhuma negociação na fila. Avance o status em Clientes & Compradores.
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
                        <TableHead className="w-40" />
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
                          <TableCell>
                            {podeEditar ? (
                              <div className="flex justify-end gap-1">
                                {n.status === "firmado" ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => avancarStatus.mutate({ id: n.id, status: "entregue" })}
                                  >
                                    Entregue
                                  </Button>
                                ) : null}
                                {n.status === "entregue" ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      avancarStatus.mutate({ id: n.id, status: "pagamento_validado" })
                                    }
                                  >
                                    Pagamento
                                  </Button>
                                ) : null}
                                <Button variant="outline" size="sm" onClick={() => abrirDeNegociacao(n)}>
                                  NF
                                </Button>
                              </div>
                            ) : null}
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
              <div className="rounded-[1.25rem] bg-surface-soft px-6 py-14 text-center">
                <p className="text-base font-bold text-foreground">Nenhuma nota fiscal ainda</p>
                <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
                  Use Registrar NF ou avance uma negociação na fila comercial.
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
                        <TableHead className="w-24" />
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
                          <TableCell>
                            {podeEditar ? (
                              <AcoesCadastro
                                onEdit={() => {
                                  setForm({
                                    id: nf.id,
                                    comprador_id: nf.comprador_id,
                                    emissor_id: nf.emissor_id,
                                    negociacao_id: nf.negociacao_id ?? "",
                                    cultura_codigo: nf.cultura_codigo ?? "",
                                    numero: nf.numero ?? "",
                                    serie: nf.serie ?? "",
                                    data_emissao: nf.data_emissao ?? "",
                                    valor: nf.valor != null ? String(nf.valor) : "",
                                    volume_sc: nf.volume_sc != null ? String(nf.volume_sc) : "",
                                    chave_acesso: nf.chave_acesso ?? "",
                                    status: nf.status,
                                  });
                                  setAberto(true);
                                }}
                                onDelete={() => {
                                  if (window.confirm("Excluir esta nota?")) excluirNf.mutate(nf.id);
                                }}
                              />
                            ) : null}
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
          <SectionCard title="Em negociação" description="Ainda sem contrato firmado">
            <TabelaPreview rows={(data?.negociacoes ?? []).filter((n) => n.status === "negociando")}>
              {(visiveis) =>
                visiveis.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    Nenhuma negociação em andamento.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Comprador</TableHead>
                        <TableHead>Cultura</TableHead>
                        <TableHead>Safra</TableHead>
                        <TableHead className="text-right">Preço ref./sc</TableHead>
                        <TableHead className="w-28" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visiveis.map((n) => (
                        <TableRow key={n.id}>
                          <TableCell className="font-medium">
                            {n.grupo_contatos?.nome ?? "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {data?.culturaNome[n.cultura_codigo] ?? n.cultura_codigo}
                            </Badge>
                          </TableCell>
                          <TableCell>{n.safra}</TableCell>
                          <TableCell className="text-right font-mono-nums">
                            {n.preco_saca != null ? formatBRL(n.preco_saca) : "—"}
                          </TableCell>
                          <TableCell>
                            {podeEditar ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => avancarStatus.mutate({ id: n.id, status: "firmado" })}
                              >
                                Firmar
                              </Button>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )
              }
            </TabelaPreview>
          </SectionCard>
        </TabsContent>
      </Tabs>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar nota fiscal" : "Registrar nota fiscal"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>Emissor</Label>
              <Select
                value={form.emissor_id}
                onValueChange={(v) => setForm((f) => ({ ...f, emissor_id: v }))}
              >
                <SelectTrigger>
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
            </div>
            <div className="space-y-2">
              <Label>Comprador</Label>
              <Select
                value={form.comprador_id}
                onValueChange={(v) => setForm((f) => ({ ...f, comprador_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Comprador" />
                </SelectTrigger>
                <SelectContent>
                  {(data?.compradores ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Número</Label>
                <Input value={form.numero} onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Série</Label>
                <Input value={form.serie} onChange={(e) => setForm((f) => ({ ...f, serie: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Emissão</Label>
                <Input
                  type="date"
                  value={form.data_emissao}
                  onChange={(e) => setForm((f) => ({ ...f, data_emissao: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v as NfStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="emitida">Emitida</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.valor}
                  onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Volume (sc)</Label>
                <Input
                  type="number"
                  value={form.volume_sc}
                  onChange={(e) => setForm((f) => ({ ...f, volume_sc: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Chave de acesso</Label>
              <Input
                value={form.chave_acesso}
                onChange={(e) => setForm((f) => ({ ...f, chave_acesso: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!form.comprador_id || !form.emissor_id || salvarNf.isPending}
              onClick={() => salvarNf.mutate(form)}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
