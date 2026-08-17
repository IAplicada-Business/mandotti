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
import { resumoEmissores, useEmissor } from "@/lib/emissor-context";
import { usePerfil, useSession } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/fazendas")({
  head: () => ({
    meta: [
      { title: "Fazendas | Sistema Grupo Mandotti" },
      { name: "description", content: "Propriedades rurais vinculadas a cada emissor do grupo." },
      { property: "og:title", content: "Fazendas | Sistema Grupo Mandotti" },
      {
        property: "og:description",
        content: "Propriedades rurais vinculadas a cada emissor do grupo.",
      },
    ],
  }),
  component: FazendasPage,
});

type Form = {
  id?: string;
  emissor_id: string;
  nome: string;
  codigo: string;
  inscricao_estadual: string;
  car: string;
  area_hectares: string;
  municipio: string;
  uf: string;
  ativo: boolean;
};

const vazio: Form = {
  emissor_id: "",
  nome: "",
  codigo: "",
  inscricao_estadual: "",
  car: "",
  area_hectares: "",
  municipio: "",
  uf: "",
  ativo: true,
};

function FazendasPage() {
  const qc = useQueryClient();
  const { emissorIds, emissores } = useEmissor();
  const { user } = useSession();
  const { pode, perfil } = usePerfil(user);
  const podeEditar = pode("/fazendas", "editar");
  const isAdmin = perfil === "admin";
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<Form>(vazio);

  const { data, isLoading } = useQuery({
    queryKey: ["fazendas", emissorIds],
    enabled: emissorIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fazendas")
        .select("*")
        .is("deleted_at", null)
        .in("emissor_id", emissorIds)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  const salvar = useMutation({
    mutationFn: async (f: Form) => {
      const { id, area_hectares, ...campos } = f;
      const payload = {
        ...campos,
        codigo: campos.codigo || null,
        inscricao_estadual: campos.inscricao_estadual || null,
        car: campos.car || null,
        municipio: campos.municipio || null,
        uf: campos.uf || null,
        area_hectares: area_hectares ? Number(area_hectares) : null,
      };
      const res = id
        ? await supabase.from("fazendas").update(payload).eq("id", id)
        : await supabase.from("fazendas").insert(payload);
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      toast.success("Fazenda salva");
      setAberto(false);
      setForm(vazio);
      qc.invalidateQueries({ queryKey: ["fazendas"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const arquivar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("fazendas")
        .update({ deleted_at: new Date().toISOString(), ativo: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Fazenda arquivada");
      qc.invalidateQueries({ queryKey: ["fazendas"] });
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
        <PageHeader title="Fazendas" description="Selecione ao menos um emissor no topo da tela." />
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Selecione ao menos um emissor para gerenciar as fazendas.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Fazendas"
        description={`Propriedades de ${resumoEmissores(
          emissores.filter((e) => emissorIds.includes(e.id)),
          emissores.length,
        )}.`}
        action={
          podeEditar ? (
            <Button
              onClick={() => {
                setForm({ ...vazio, emissor_id: emissorIds.length === 1 ? emissorIds[0]! : "" });
                setAberto(true);
              }}
            >
              <Plus className="mr-2 size-4" />
              Nova fazenda
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
                <TableHead className="hidden sm:table-cell">Código</TableHead>
                <TableHead className="hidden sm:table-cell">Município/UF</TableHead>
                <TableHead>Área (ha)</TableHead>
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
                    Nenhuma fazenda para este emissor.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.nome}</TableCell>
                    <TableCell className="hidden sm:table-cell">{f.codigo ?? "—"}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {[f.municipio, f.uf].filter(Boolean).join("/") || "—"}
                    </TableCell>
                    <TableCell>{f.area_hectares ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={f.ativo ? "default" : "secondary"}>
                        {f.ativo ? "Ativa" : "Inativa"}
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
                              id: f.id,
                              emissor_id: f.emissor_id,
                              nome: f.nome,
                              codigo: f.codigo ?? "",
                              inscricao_estadual: f.inscricao_estadual ?? "",
                              car: f.car ?? "",
                              area_hectares: f.area_hectares ? String(f.area_hectares) : "",
                              municipio: f.municipio ?? "",
                              uf: f.uf ?? "",
                              ativo: f.ativo,
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
                          onClick={() => arquivar.mutate(f.id)}
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
            <DialogTitle>{form.id ? "Editar fazenda" : "Nova fazenda"}</DialogTitle>
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
            <div className="sm:col-span-2">{campo("nome", "Nome *")}</div>
            {campo("codigo", "Código interno")}
            {campo("inscricao_estadual", "Inscrição estadual")}
            {campo("car", "CAR")}
            {campo("area_hectares", "Área (hectares)", "number")}
            {campo("municipio", "Município")}
            {campo("uf", "UF")}
            <div className="flex items-center gap-3 sm:col-span-2">
              <Switch
                id="ativa"
                checked={form.ativo}
                onCheckedChange={(v) => setForm({ ...form, ativo: v })}
              />
              <Label htmlFor="ativa">Fazenda ativa</Label>
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
