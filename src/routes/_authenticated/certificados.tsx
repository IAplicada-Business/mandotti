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
import { supabase } from "@/integrations/supabase/client";
import { useEmissor } from "@/lib/emissor-context";
import { usePerfil, useSession } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/certificados")({
  head: () => ({
    meta: [
      { title: "Certificados | Sistema Grupo Mandotti" },
      { name: "description", content: "Controle de certificados digitais A1 e A3 por emissor." },
      { property: "og:title", content: "Certificados | Sistema Grupo Mandotti" },
      {
        property: "og:description",
        content: "Controle de certificados digitais A1 e A3 por emissor.",
      },
    ],
  }),
  component: CertificadosPage,
});

type Form = {
  id?: string;
  emissor_id: string;
  nome: string;
  tipo: "A1" | "A3";
  titular: string;
  cnpj: string;
  validade: string;
  senha_referencia: string;
  ativo: boolean;
};

const vazio: Form = {
  emissor_id: "",
  nome: "",
  tipo: "A1",
  titular: "",
  cnpj: "",
  validade: "",
  senha_referencia: "",
  ativo: true,
};

function statusValidade(validade: string | null) {
  if (!validade) return { label: "Sem validade", variant: "muted" as const };
  const dias = Math.ceil((new Date(validade).getTime() - Date.now()) / 86400000);
  if (dias < 0) return { label: "Vencido", variant: "destructive" as const };
  if (dias <= 30) return { label: `Vence em ${dias}d`, variant: "warning" as const };
  return { label: "Vigente", variant: "success" as const };
}

function CertificadosPage() {
  const qc = useQueryClient();
  const { emissorIds, emissores } = useEmissor();
  const { user } = useSession();
  const { pode, perfil } = usePerfil(user);
  const podeEditar = pode("/certificados", "editar");
  const isAdmin = perfil === "admin";
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<Form>(vazio);

  const { data, isLoading } = useQuery({
    queryKey: ["certificados", emissorIds],
    enabled: emissorIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificados")
        .select("*")
        .is("deleted_at", null)
        .in("emissor_id", emissorIds)
        .order("validade");
      if (error) throw error;
      return data;
    },
  });

  const salvar = useMutation({
    mutationFn: async (f: Form) => {
      const { id, ...campos } = f;
      const payload = {
        ...campos,
        titular: campos.titular || null,
        cnpj: campos.cnpj || null,
        validade: campos.validade || null,
        senha_referencia: campos.senha_referencia || null,
      };
      const res = id
        ? await supabase.from("certificados").update(payload).eq("id", id)
        : await supabase.from("certificados").insert(payload);
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      toast.success("Certificado salvo");
      setAberto(false);
      setForm(vazio);
      qc.invalidateQueries({ queryKey: ["certificados"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const arquivar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("certificados")
        .update({ deleted_at: new Date().toISOString(), ativo: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Certificado arquivado");
      qc.invalidateQueries({ queryKey: ["certificados"] });
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

  if (!emissorIds.length) {
    return (
      <div>
        <PageHeader
          title="Certificados"
          description="Certificados digitais A1 dos emissores selecionados."
        />
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Selecione ao menos um emissor para gerenciar os certificados.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Certificados"
        description="Certificados digitais A1 dos emissores selecionados."
        action={
          podeEditar ? (
            <Button
              onClick={() => {
                setForm({ ...vazio, emissor_id: emissorIds.length === 1 ? emissorIds[0]! : "" });
                setAberto(true);
              }}
            >
              <Plus className="mr-2 size-4" />
              Novo certificado
            </Button>
          ) : null
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="hidden sm:table-cell">Titular</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Situação</TableHead>
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
                    Nenhum certificado para este emissor.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((c) => {
                  const st = statusValidade(c.validade);
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.nome}</TableCell>
                      <TableCell>{c.tipo}</TableCell>
                      <TableCell className="hidden sm:table-cell">{c.titular ?? "—"}</TableCell>
                      <TableCell>
                        {c.validade ? new Date(c.validade).toLocaleDateString("pt-BR") : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {podeEditar ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Editar"
                            onClick={() => {
                              setForm({
                                id: c.id,
                                emissor_id: c.emissor_id,
                                nome: c.nome,
                                tipo: c.tipo,
                                titular: c.titular ?? "",
                                cnpj: c.cnpj ?? "",
                                validade: c.validade ?? "",
                                senha_referencia: c.senha_referencia ?? "",
                                ativo: c.ativo,
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
                            onClick={() => arquivar.mutate(c.id)}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar certificado" : "Novo certificado"}</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.emissor_id) {
                toast.error("Selecione um emissor");
                return;
              }
              salvar.mutate(form);
            }}
          >
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="emissor_id">Emissor *</Label>
              <Select
                value={form.emissor_id}
                onValueChange={(v) => setForm({ ...form, emissor_id: v })}
              >
                <SelectTrigger id="emissor_id">
                  <SelectValue placeholder="Selecione o emissor" />
                </SelectTrigger>
                <SelectContent>
                  {emissores.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nome_fantasia || e.razao_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">{campo("nome", "Nome / apelido *")}</div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select
                value={form.tipo}
                onValueChange={(v) => setForm({ ...form, tipo: v as "A1" | "A3" })}
              >
                <SelectTrigger id="tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A1">A1</SelectItem>
                  <SelectItem value="A3">A3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {campo("validade", "Validade", "date")}
            {campo("titular", "Titular")}
            {campo("cnpj", "CNPJ")}
            <div className="sm:col-span-2">
              {campo("senha_referencia", "Referência da senha (não guarde a senha real)")}
            </div>
            <div className="flex items-center gap-3 sm:col-span-2">
              <Switch
                id="cert-ativo"
                checked={form.ativo}
                onCheckedChange={(v) => setForm({ ...form, ativo: v })}
              />
              <Label htmlFor="cert-ativo">Certificado ativo</Label>
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
