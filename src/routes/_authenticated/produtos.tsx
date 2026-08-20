import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AcoesCadastro } from "@/components/AcoesCadastro";
import { PageHeader } from "@/components/AppShell";
import { SectionCard } from "@/components/design-system";
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
import { Switch } from "@/components/ui/switch";
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
import { emptyToNull, slugCodigo } from "@/lib/format";

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

const CORES = Object.keys(COR);

type Form = {
  id?: string;
  codigo: string;
  nome: string;
  tipo: string;
  cor_token: string;
  ativo: boolean;
};

const vazio: Form = {
  codigo: "",
  nome: "",
  tipo: "cultura",
  cor_token: "accent-verde-claro",
  ativo: true,
};

function ProdutosPage() {
  const qc = useQueryClient();
  const { user } = useSession();
  const { pode } = usePerfil(user);
  const podeEditar = pode("/producao", "editar") || pode("/produtos", "editar");
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<Form>(vazio);

  const { data = [], isLoading } = useQuery({
    queryKey: ["produtos_agricolas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos_agricolas")
        .select("*")
        .order("ordem");
      if (error) throw error;
      return data;
    },
  });

  const salvar = useMutation({
    mutationFn: async (f: Form) => {
      const codigo = (f.codigo || slugCodigo(f.nome)).trim();
      if (!f.nome.trim() || !codigo) throw new Error("Informe o nome da cultura");
      const payload = {
        codigo,
        nome: f.nome.trim(),
        tipo: f.tipo || "cultura",
        cor_token: emptyToNull(f.cor_token),
        ativo: f.ativo,
        ordem: f.id ? undefined : (data.length || 0) + 1,
      };
      const res = f.id
        ? await supabase
            .from("produtos_agricolas")
            .update({
              nome: payload.nome,
              tipo: payload.tipo,
              cor_token: payload.cor_token,
              ativo: payload.ativo,
            })
            .eq("id", f.id)
        : await supabase.from("produtos_agricolas").insert({
            codigo: payload.codigo,
            nome: payload.nome,
            tipo: payload.tipo,
            cor_token: payload.cor_token,
            ativo: payload.ativo,
            ordem: payload.ordem ?? 1,
          });
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      toast.success("Cultura salva");
      setAberto(false);
      setForm(vazio);
      qc.invalidateQueries({ queryKey: ["produtos_agricolas"] });
      qc.invalidateQueries({ queryKey: ["producao-planilha"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const desativar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("produtos_agricolas").update({ ativo: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cultura desativada");
      qc.invalidateQueries({ queryKey: ["produtos_agricolas"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Culturas da operação"
        description="Cadastre soja, milho, sorgo, milheto ou qualquer cultura nova da safra."
        action={
          podeEditar ? (
            <Button
              onClick={() => {
                setForm(vazio);
                setAberto(true);
              }}
            >
              <Plus className="mr-2 size-4" />
              Nova cultura
            </Button>
          ) : null
        }
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
                <TableHead>Situação</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((p) => (
                <TableRow key={p.id} className={!p.ativo ? "opacity-60" : undefined}>
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
                  <TableCell>
                    <Badge variant={p.ativo ? "default" : "secondary"}>
                      {p.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {podeEditar ? (
                      <AcoesCadastro
                        onEdit={() => {
                          setForm({
                            id: p.id,
                            codigo: p.codigo,
                            nome: p.nome,
                            tipo: p.tipo,
                            cor_token: p.cor_token ?? "accent-verde-claro",
                            ativo: p.ativo,
                          });
                          setAberto(true);
                        }}
                        onDelete={
                          p.ativo
                            ? () => {
                                if (window.confirm(`Desativar ${p.nome}?`)) desativar.mutate(p.id);
                              }
                            : undefined
                        }
                      />
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar cultura" : "Nova cultura"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={form.nome}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    nome: e.target.value,
                    codigo: f.id ? f.codigo : slugCodigo(e.target.value),
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Código</Label>
                <Input
                  value={form.codigo}
                  disabled={!!form.id}
                  onChange={(e) => setForm((f) => ({ ...f, codigo: slugCodigo(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Input
                  value={form.tipo}
                  onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {CORES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`size-7 rounded-full ${COR[c]} ${form.cor_token === c ? "ring-2 ring-ring" : ""}`}
                    onClick={() => setForm((f) => ({ ...f, cor_token: c }))}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-[1.25rem] bg-surface-soft p-3">
              <Label>Ativa</Label>
              <Switch checked={form.ativo} onCheckedChange={(v) => setForm((f) => ({ ...f, ativo: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button disabled={!form.nome.trim() || salvar.isPending} onClick={() => salvar.mutate(form)}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
