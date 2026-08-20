import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Download, FolderOpen, Plus, Search, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { AcoesCadastro } from "@/components/AcoesCadastro";
import { PageHeader } from "@/components/AppShell";
import { Callout, KpiCard, SectionCard } from "@/components/design-system";
import { BarraFiltros, FiltroCard } from "@/components/LayoutAbasFiltros";
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
import { Textarea } from "@/components/ui/textarea";
import { usePerfil, useSession } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { situacaoVencimento, TIPO_DOCUMENTO_LABEL, TIPOS_DOCUMENTO } from "@/lib/documento-tipos";
import { emptyToNull, formatDateBR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/documentos")({
  head: () => ({
    meta: [
      { title: "Biblioteca de Documentos | Sistema Grupo Mandotti" },
      { name: "description", content: "Pastas por fazenda, busca e alertas de vencimento." },
    ],
  }),
  component: DocumentosPage,
});

const GRUPO_ID = "grupo";

type FormDoc = {
  fazenda_id: string;
  tipo: string;
  titulo: string;
  vencimento: string;
  observacoes: string;
};

const VAZIO: FormDoc = {
  fazenda_id: GRUPO_ID,
  tipo: "ccir",
  titulo: "",
  vencimento: "",
  observacoes: "",
};

function DocumentosPage() {
  const qc = useQueryClient();
  const { user } = useSession();
  const { pode } = usePerfil(user);
  const podeEditar = pode("/documentos", "editar");
  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [pasta, setPasta] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<FormDoc>(VAZIO);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["biblioteca-documentos"],
    queryFn: async () => {
      const [docs, fazendas] = await Promise.all([
        supabase
          .from("documentos")
          .select("*, fazendas(nome)")
          .is("deleted_at", null)
          .order("titulo"),
        supabase.from("fazendas").select("id, nome").is("deleted_at", null).order("nome"),
      ]);
      if (docs.error) throw docs.error;
      if (fazendas.error) throw fazendas.error;
      return { docs: docs.data ?? [], fazendas: fazendas.data ?? [] };
    },
  });

  const pastas = useMemo(() => {
    const fazendas = data?.fazendas ?? [];
    const docs = data?.docs ?? [];
    return [
      {
        id: GRUPO_ID,
        nome: "Grupo / geral",
        qtd: docs.filter((d) => !d.fazenda_id).length,
      },
      ...fazendas.map((f) => ({
        id: f.id,
        nome: f.nome,
        qtd: docs.filter((d) => d.fazenda_id === f.id).length,
      })),
    ];
  }, [data]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return (data?.docs ?? []).filter((d) => {
      if (tipoFiltro !== "todos" && d.tipo !== tipoFiltro) return false;
      if (pasta && (d.fazenda_id ?? GRUPO_ID) !== pasta) return false;
      if (!termo) return true;
      const hay = [d.titulo, d.nome_arquivo, TIPO_DOCUMENTO_LABEL[d.tipo], d.fazendas?.nome]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(termo);
    });
  }, [data?.docs, tipoFiltro, pasta, busca]);

  const vencidos = (data?.docs ?? []).filter((d) => situacaoVencimento(d.vencimento) === "vencido");
  const aVencer = (data?.docs ?? []).filter((d) => situacaoVencimento(d.vencimento) === "a_vencer");

  const enviar = useMutation({
    mutationFn: async () => {
      if (!form.titulo.trim()) throw new Error("Informe o título");
      if (!arquivo) throw new Error("Selecione o arquivo");
      const pastaId = form.fazenda_id === GRUPO_ID ? "grupo" : form.fazenda_id;
      const seguro = arquivo.name.replace(/[^\w.\-() ]+/g, "_");
      const path = `${pastaId}/${crypto.randomUUID()}-${seguro}`;
      const up = await supabase.storage.from("documentos").upload(
        path,
        arquivo,
        arquivo.type ? { upsert: false, contentType: arquivo.type } : { upsert: false },
      );
      if (up.error) throw up.error;
      const { error } = await supabase.from("documentos").insert({
        fazenda_id: form.fazenda_id === GRUPO_ID ? null : form.fazenda_id,
        tipo: form.tipo,
        titulo: form.titulo.trim(),
        nome_arquivo: arquivo.name,
        storage_path: path,
        mime_type: arquivo.type || null,
        tamanho_bytes: arquivo.size,
        vencimento: emptyToNull(form.vencimento),
        observacoes: emptyToNull(form.observacoes),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Documento enviado");
      setAberto(false);
      setForm(VAZIO);
      setArquivo(null);
      qc.invalidateQueries({ queryKey: ["biblioteca-documentos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const baixar = useMutation({
    mutationFn: async (path: string) => {
      const { data: signed, error } = await supabase.storage
        .from("documentos")
        .createSignedUrl(path, 120);
      if (error) throw error;
      if (!signed?.signedUrl) throw new Error("Não foi possível gerar o link");
      window.open(signed.signedUrl, "_blank", "noopener,noreferrer");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("documentos")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Documento removido");
      qc.invalidateQueries({ queryKey: ["biblioteca-documentos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pastaAtual = pastas.find((p) => p.id === pasta);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Biblioteca"
        description="Pastas por fazenda para CCIR, ITR, arrendamento e o que o banco pedir na estrada."
        action={
          podeEditar ? (
            <Button
              onClick={() => {
                setForm({ ...VAZIO, fazenda_id: pasta ?? GRUPO_ID });
                setArquivo(null);
                setAberto(true);
              }}
            >
              <Plus className="mr-2 size-4" />
              Enviar documento
            </Button>
          ) : null
        }
      />

      <BarraFiltros>
        <FiltroCard label="Busca">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="CCIR, ITR, fazenda, arquivo…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </FiltroCard>
        <FiltroCard label="Tipo">
          <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {TIPOS_DOCUMENTO.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FiltroCard>
      </BarraFiltros>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Documentos" value={data?.docs.length ?? 0} icon={Upload} />
        <KpiCard label="Pastas" value={pastas.length} icon={FolderOpen} tone="info" />
        <KpiCard
          label="Vencidos"
          value={vencidos.length}
          icon={AlertTriangle}
          tone={vencidos.length ? "danger" : "default"}
        />
        <KpiCard
          label="Vencem em 60 dias"
          value={aVencer.length}
          icon={AlertTriangle}
          tone={aVencer.length ? "warning" : "default"}
        />
      </div>

      {vencidos.length || aVencer.length ? (
        <Callout tone={vencidos.length ? "danger" : "warning"}>
          {vencidos.length
            ? `${vencidos.length} documento(s) vencido(s). `
            : null}
          {aVencer.length ? `${aVencer.length} com vencimento nos próximos 60 dias.` : null}
        </Callout>
      ) : null}

      <SectionCard
        title="Pastas por fazenda"
        description="Abra a pasta para ver ou baixar. A busca cobre todas as pastas."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {pastas.map((p) => {
            const ativa = pasta === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPasta((atual) => (atual === p.id ? null : p.id))}
                className={`flex items-center justify-between rounded-[1.25rem] px-4 py-3.5 text-left shadow-sm transition-colors ${
                  ativa ? "bg-primary text-primary-foreground" : "bg-surface-soft hover:bg-card"
                }`}
              >
                <span className="inline-flex min-w-0 items-center gap-3">
                  <FolderOpen className="size-5 shrink-0" />
                  <span className="truncate font-semibold">{p.nome}</span>
                </span>
                <Badge variant={ativa ? "secondary" : "outline"}>{p.qtd}</Badge>
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title={pastaAtual ? pastaAtual.nome : "Todos os documentos"}
        description={
          busca
            ? `Busca em todas as pastas · “${busca}”`
            : pastaAtual
              ? "Arquivos desta pasta"
              : "Selecione uma pasta ou busque pelo nome"
        }
      >
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : filtrados.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhum documento nesta visão. Envie o CCIR, ITR ou o contrato de arrendamento da fazenda.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Pasta</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((d) => {
                const sit = situacaoVencimento(d.vencimento);
                return (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div className="font-medium">{d.titulo}</div>
                      <div className="text-xs text-muted-foreground">{d.nome_arquivo ?? "—"}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {d.fazendas?.nome ?? "Grupo / geral"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{TIPO_DOCUMENTO_LABEL[d.tipo] ?? d.tipo}</Badge>
                    </TableCell>
                    <TableCell>
                      {d.vencimento ? (
                        <span
                          className={
                            sit === "vencido"
                              ? "font-semibold text-destructive"
                              : sit === "a_vencer"
                                ? "font-semibold text-warning"
                                : undefined
                          }
                        >
                          {formatDateBR(d.vencimento)}
                          {sit === "vencido" ? " · vencido" : sit === "a_vencer" ? " · a vencer" : ""}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Baixar"
                          onClick={() => baixar.mutate(d.storage_path)}
                        >
                          <Download className="size-4" />
                        </Button>
                        {podeEditar ? (
                          <AcoesCadastro
                            onDelete={() => {
                              if (window.confirm(`Remover ${d.titulo}?`)) excluir.mutate(d.id);
                            }}
                          />
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </SectionCard>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar documento</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>Pasta</Label>
              <Select
                value={form.fazenda_id}
                onValueChange={(v) => setForm((f) => ({ ...f, fazenda_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pastas.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_DOCUMENTO.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={form.titulo}
                onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                placeholder="CCIR — São Judas 2026"
              />
            </div>
            <div className="space-y-2">
              <Label>Vencimento</Label>
              <Input
                type="date"
                value={form.vencimento}
                onChange={(e) => setForm((f) => ({ ...f, vencimento: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Arquivo</Label>
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setArquivo(file);
                  if (file && !form.titulo.trim()) {
                    setForm((f) => ({ ...f, titulo: file.name.replace(/\.[^.]+$/, "") }));
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
                <Upload className="mr-2 size-4" />
                {arquivo ? arquivo.name : "Escolher arquivo"}
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Observação</Label>
              <Textarea
                value={form.observacoes}
                onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!form.titulo.trim() || !arquivo || enviar.isPending}
              onClick={() => enviar.mutate()}
            >
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
