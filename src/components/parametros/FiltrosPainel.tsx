import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AcoesCadastro } from "@/components/AcoesCadastro";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { slugCodigo } from "@/lib/format";

type CategoriaTipo = Database["public"]["Enums"]["categoria_tipo"];

const TIPO_LABEL: Record<CategoriaTipo, string> = {
  despesa: "Despesa",
  receita: "Receita",
  folha: "Folha",
  outros: "Outros",
};

export function FiltrosPainel() {
  const qc = useQueryClient();
  const { user } = useSession();
  const { perfil } = usePerfil(user);
  const podeEditar = perfil === "admin";
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({
    id: "",
    nome: "",
    codigo: "",
    tipo: "despesa" as CategoriaTipo,
    ativo: true,
  });

  const { data = [], isLoading } = useQuery({
    queryKey: ["categorias_financeiras"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias_financeiras")
        .select("*")
        .order("tipo")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  const salvar = useMutation({
    mutationFn: async () => {
      if (!form.nome.trim()) throw new Error("Informe o nome da categoria");
      const codigo = (form.codigo || slugCodigo(form.nome)).trim();
      const payload = { nome: form.nome.trim(), codigo, tipo: form.tipo, ativo: form.ativo };
      const res = form.id
        ? await supabase
            .from("categorias_financeiras")
            .update({ nome: payload.nome, tipo: payload.tipo, ativo: payload.ativo })
            .eq("id", form.id)
        : await supabase.from("categorias_financeiras").insert(payload);
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      toast.success("Categoria salva");
      setAberto(false);
      qc.invalidateQueries({ queryKey: ["categorias_financeiras"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const desativar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categorias_financeiras").update({ ativo: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Categoria desativada");
      qc.invalidateQueries({ queryKey: ["categorias_financeiras"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <SectionCard
      title="Filtros financeiros"
      description="Categorias usadas para classificar lançamentos. Use Outros para despesas sem nota (ajudantes, pix avulso)."
      action={
        podeEditar ? (
          <Button
            size="sm"
            onClick={() => {
              setForm({ id: "", nome: "", codigo: "", tipo: "despesa", ativo: true });
              setAberto(true);
            }}
          >
            <Plus className="mr-2 size-4" />
            Nova categoria
          </Button>
        ) : null
      }
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categoria</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Nenhuma categoria ainda.
                </TableCell>
              </TableRow>
            ) : (
              data.map((c) => (
                <TableRow key={c.id} className={!c.ativo ? "opacity-60" : undefined}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell>
                    <code className="text-xs">{c.codigo}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{TIPO_LABEL[c.tipo] ?? c.tipo}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.ativo ? "default" : "secondary"}>
                      {c.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {podeEditar ? (
                      <AcoesCadastro
                        onEdit={() => {
                          setForm({
                            id: c.id,
                            nome: c.nome,
                            codigo: c.codigo,
                            tipo: c.tipo,
                            ativo: c.ativo,
                          });
                          setAberto(true);
                        }}
                        onDelete={
                          c.ativo
                            ? () => {
                                if (window.confirm(`Desativar ${c.nome}?`)) desativar.mutate(c.id);
                              }
                            : undefined
                        }
                      />
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar categoria" : "Nova categoria"}</DialogTitle>
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
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={form.tipo}
                onValueChange={(v) => setForm((f) => ({ ...f, tipo: v as CategoriaTipo }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TIPO_LABEL) as CategoriaTipo[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {TIPO_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-[1.25rem] bg-surface-soft p-3">
              <Label>Ativa</Label>
              <Switch
                checked={form.ativo}
                onCheckedChange={(v) => setForm((f) => ({ ...f, ativo: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button disabled={!form.nome.trim() || salvar.isPending} onClick={() => salvar.mutate()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}
