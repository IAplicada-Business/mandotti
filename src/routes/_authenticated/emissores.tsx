import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { supabase } from "@/integrations/supabase/client";
import { usePerfil, useSession } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/emissores")({
  head: () => ({
    meta: [
      { title: "Emissores | Sistema Grupo Mandotti" },
      { name: "description", content: "Cadastro das empresas emissoras do Grupo Mandotti." },
      { property: "og:title", content: "Emissores | Sistema Grupo Mandotti" },
      {
        property: "og:description",
        content: "Cadastro das empresas emissoras do Grupo Mandotti.",
      },
    ],
  }),
  component: EmissoresPage,
});

type Form = {
  id?: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  inscricao_estadual: string;
  endereco: string;
  cidade: string;
  uf: string;
  cep: string;
  telefone: string;
  email: string;
  ativo: boolean;
};

const vazio: Form = {
  razao_social: "",
  nome_fantasia: "",
  cnpj: "",
  inscricao_estadual: "",
  endereco: "",
  cidade: "",
  uf: "",
  cep: "",
  telefone: "",
  email: "",
  ativo: true,
};

function EmissoresPage() {
  const qc = useQueryClient();
  const { user } = useSession();
  const { pode, perfil } = usePerfil(user);
  const podeEditar = pode("/emissores", "editar");
  const isAdmin = perfil === "admin";
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<Form>(vazio);

  const { data, isLoading } = useQuery({
    queryKey: ["emissores", "todos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emissores")
        .select("*")
        .is("deleted_at", null)
        .order("razao_social");
      if (error) throw error;
      return data;
    },
  });

  const salvar = useMutation({
    mutationFn: async (f: Form) => {
      const { id, ...campos } = f;
      const payload = {
        ...campos,
        nome_fantasia: campos.nome_fantasia || null,
        inscricao_estadual: campos.inscricao_estadual || null,
        endereco: campos.endereco || null,
        cidade: campos.cidade || null,
        uf: campos.uf || null,
        cep: campos.cep || null,
        telefone: campos.telefone || null,
        email: campos.email || null,
      };
      const res = id
        ? await supabase.from("emissores").update(payload).eq("id", id)
        : await supabase.from("emissores").insert(payload);
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      toast.success("Emissor salvo");
      setAberto(false);
      setForm(vazio);
      qc.invalidateQueries({ queryKey: ["emissores"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const arquivar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("emissores")
        .update({ deleted_at: new Date().toISOString(), ativo: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Emissor arquivado");
      qc.invalidateQueries({ queryKey: ["emissores"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const campo = (k: keyof Form, label: string, tipo = "text") => (
    <div className="space-y-2">
      <Label htmlFor={k}>{label}</Label>
      <Input
        id={k}
        type={tipo}
        value={String(form[k] ?? "")}
        onChange={(e) => setForm({ ...form, [k]: e.target.value })}
      />
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Emissores"
        description="Empresas que emitem documentos fiscais no grupo."
        action={
          podeEditar ? (
            <Button
              onClick={() => {
                setForm(vazio);
                setAberto(true);
              }}
            >
              <Plus className="mr-2 size-4" />
              Novo emissor
            </Button>
          ) : null
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Razão social</TableHead>
                <TableHead className="hidden sm:table-cell">Nome fantasia</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead className="hidden sm:table-cell">Cidade/UF</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : !data?.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Nenhum emissor cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.razao_social}</TableCell>
                    <TableCell className="hidden sm:table-cell">{e.nome_fantasia ?? "—"}</TableCell>
                    <TableCell>{e.cnpj}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {[e.cidade, e.uf].filter(Boolean).join("/") || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={e.ativo ? "default" : "secondary"}>
                        {e.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {podeEditar ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Editar"
                          onClick={() => {
                            setForm({
                              id: e.id,
                              razao_social: e.razao_social,
                              nome_fantasia: e.nome_fantasia ?? "",
                              cnpj: e.cnpj,
                              inscricao_estadual: e.inscricao_estadual ?? "",
                              endereco: e.endereco ?? "",
                              cidade: e.cidade ?? "",
                              uf: e.uf ?? "",
                              cep: e.cep ?? "",
                              telefone: e.telefone ?? "",
                              email: e.email ?? "",
                              ativo: e.ativo,
                            });
                            setAberto(true);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      ) : null}
                      {isAdmin ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Arquivar"
                          onClick={() => arquivar.mutate(e.id)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar emissor" : "Novo emissor"}</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              salvar.mutate(form);
            }}
          >
            <div className="sm:col-span-2">{campo("razao_social", "Razão social *")}</div>
            {campo("nome_fantasia", "Nome fantasia")}
            {campo("cnpj", "CNPJ *")}
            {campo("inscricao_estadual", "Inscrição estadual")}
            {campo("telefone", "Telefone")}
            <div className="sm:col-span-2">{campo("endereco", "Endereço")}</div>
            {campo("cidade", "Cidade")}
            {campo("uf", "UF")}
            {campo("cep", "CEP")}
            {campo("email", "E-mail", "email")}
            <div className="flex items-center gap-3 sm:col-span-2">
              <Switch
                id="ativo"
                checked={form.ativo}
                onCheckedChange={(v) => setForm({ ...form, ativo: v })}
              />
              <Label htmlFor="ativo">Emissor ativo</Label>
            </div>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvar.isPending}>
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
