import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, ClipboardList, Handshake, Plus, Scale, Truck } from "lucide-react";
import { useState } from "react";
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
import { emptyToNull } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/contratos")({
  head: () => ({
    meta: [
      { title: "Contratos · Tradings | Sistema Grupo Mandotti" },
      {
        name: "description",
        content: "Parceiros comerciais, destinos de produção e contratos forward do Grupo Mandotti.",
      },
    ],
  }),
  component: ContratosPage,
});

const CATEGORIA_LABEL: Record<string, string> = {
  destino_producao: "Destino da produção",
  fornecedor: "Fornecedor",
  referencia_comercial: "Ref. comercial",
  referencia_bancaria: "Ref. bancária",
  referencia_pessoal: "Ref. pessoal",
};

const CATEGORIA_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  destino_producao: "default",
  fornecedor: "secondary",
  referencia_comercial: "outline",
  referencia_bancaria: "outline",
  referencia_pessoal: "outline",
};

const CATEGORIAS = Object.keys(CATEGORIA_LABEL);

type FormContato = {
  id?: string;
  nome: string;
  categoria: string;
  cidade: string;
  uf: string;
  email: string;
  telefone: string;
  contato_nome: string;
  agencia: string;
  endereco: string;
  status: string;
};

const VAZIO: FormContato = {
  nome: "",
  categoria: "destino_producao",
  cidade: "",
  uf: "",
  email: "",
  telefone: "",
  contato_nome: "",
  agencia: "",
  endereco: "",
  status: "ativo",
};

function ContratosPage() {
  const qc = useQueryClient();
  const { user } = useSession();
  const { pode } = usePerfil(user);
  const podeEditar = pode("/contratos", "editar") || pode("/clientes", "editar");
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<FormContato>(VAZIO);

  const { data = [], isLoading } = useQuery({
    queryKey: ["grupo-contatos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("grupo_contatos").select("*").order("ordem");
      if (error) throw error;
      return data;
    },
  });

  const destinos = data.filter((c) => c.categoria === "destino_producao");
  const fornecedores = data.filter((c) => c.categoria === "fornecedor");
  const referencias = data.filter((c) => c.categoria.startsWith("referencia_"));

  const salvar = useMutation({
    mutationFn: async (f: FormContato) => {
      if (!f.nome.trim()) throw new Error("Informe o nome");
      const payload = {
        nome: f.nome.trim(),
        categoria: f.categoria,
        cidade: emptyToNull(f.cidade),
        uf: emptyToNull(f.uf),
        email: emptyToNull(f.email),
        telefone: emptyToNull(f.telefone),
        contato_nome: emptyToNull(f.contato_nome),
        agencia: emptyToNull(f.agencia),
        endereco: emptyToNull(f.endereco),
        status: f.status,
        origem: "manual",
      };
      const res = f.id
        ? await supabase.from("grupo_contatos").update(payload).eq("id", f.id)
        : await supabase.from("grupo_contatos").insert({ ...payload, ordem: data.length + 1 });
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      toast.success("Contato salvo");
      setAberto(false);
      setForm(VAZIO);
      qc.invalidateQueries({ queryKey: ["grupo-contatos"] });
      qc.invalidateQueries({ queryKey: ["clientes-compradores"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const inativar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("grupo_contatos").update({ status: "inativo" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contato inativado");
      qc.invalidateQueries({ queryKey: ["grupo-contatos"] });
      qc.invalidateQueries({ queryKey: ["clientes-compradores"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const abrirEdicao = (row: {
    id: string;
    nome: string;
    categoria: string;
    cidade: string | null;
    uf?: string | null;
    email: string | null;
    telefone: string | null;
    contato_nome: string | null;
    agencia: string | null;
    endereco: string | null;
    status: string;
  }) => {
    setForm({
      id: row.id,
      nome: row.nome,
      categoria: row.categoria,
      cidade: row.cidade ?? "",
      uf: row.uf ?? "",
      email: row.email ?? "",
      telefone: row.telefone ?? "",
      contato_nome: row.contato_nome ?? "",
      agencia: row.agencia ?? "",
      endereco: row.endereco ?? "",
      status: row.status,
    });
    setAberto(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contratos · Tradings"
        description="Cadastre destinos, fornecedores e referências. Dívidas bancárias ficam em Passivos · SCR."
        action={
          podeEditar ? (
            <Button
              onClick={() => {
                setForm(VAZIO);
                setAberto(true);
              }}
            >
              <Plus className="mr-2 size-4" />
              Novo contato
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Destinos" value={destinos.length} icon={Handshake} tone="info" hint="Tradings / esmagadoras" />
        <KpiCard label="Fornecedores" value={fornecedores.length} icon={Truck} tone="success" />
        <KpiCard label="Referências" value={referencias.length} icon={Handshake} />
        <KpiCard label="Total cadastros" value={data.length} icon={ClipboardList} />
      </div>

      <Link
        to="/passivos"
        className="flex items-center justify-between rounded-[1.25rem] bg-warning/12 px-4 py-3.5 text-sm transition-colors hover:bg-warning/18"
      >
        <span className="inline-flex items-center gap-2 font-semibold">
          <Scale className="size-4 text-warning" />
          Dívidas e contratos SCR (Bacen)
        </span>
        <ArrowRight className="size-4" />
      </Link>

      <Tabs defaultValue="destinos">
        <TabsList>
          <TabsTrigger value="destinos">Destinos ({destinos.length})</TabsTrigger>
          <TabsTrigger value="fornecedores">Fornecedores ({fornecedores.length})</TabsTrigger>
          <TabsTrigger value="referencias">Referências ({referencias.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="destinos">
          <SectionCard
            title="Destino da produção"
            description="Tradings, esmagadoras e cerealistas — base para contratos forward"
          >
            <TabelaContatos
              rows={destinos}
              loading={isLoading}
              podeEditar={podeEditar}
              onEdit={abrirEdicao}
              onDelete={(id, nome) => {
                if (window.confirm(`Inativar ${nome}?`)) inativar.mutate(id);
              }}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="fornecedores">
          <SectionCard title="Principais fornecedores" description="Insumos e serviços">
            <TabelaContatos
              rows={fornecedores}
              loading={isLoading}
              podeEditar={podeEditar}
              onEdit={abrirEdicao}
              onDelete={(id, nome) => {
                if (window.confirm(`Inativar ${nome}?`)) inativar.mutate(id);
              }}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="referencias">
          <SectionCard title="Fontes de referência" description="Bancárias, comerciais e pessoais">
            <TabelaContatos
              rows={referencias}
              loading={isLoading}
              showContato
              podeEditar={podeEditar}
              onEdit={abrirEdicao}
              onDelete={(id, nome) => {
                if (window.confirm(`Inativar ${nome}?`)) inativar.mutate(id);
              }}
            />
          </SectionCard>
        </TabsContent>
      </Tabs>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar contato" : "Novo contato"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={form.categoria}
                onValueChange={(v) => setForm((f) => ({ ...f, categoria: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORIA_LABEL[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  value={form.cidade}
                  onChange={(e) => setForm((f) => ({ ...f, cidade: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>UF</Label>
                <Input value={form.uf} onChange={(e) => setForm((f) => ({ ...f, uf: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={form.telefone}
                  onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Contato</Label>
                <Input
                  value={form.contato_nome}
                  onChange={(e) => setForm((f) => ({ ...f, contato_nome: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Agência</Label>
                <Input
                  value={form.agencia}
                  onChange={(e) => setForm((f) => ({ ...f, agencia: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input
                value={form.endereco}
                onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="cadastrado">Cadastrado</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
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

function TabelaContatos({
  rows,
  loading,
  showContato,
  podeEditar,
  onEdit,
  onDelete,
}: {
  rows: {
    id: string;
    nome: string;
    categoria: string;
    cidade: string | null;
    contato_nome: string | null;
    agencia: string | null;
    email: string | null;
    telefone: string | null;
    endereco: string | null;
    status: string;
    uf?: string | null;
  }[];
  loading: boolean;
  showContato?: boolean;
  podeEditar?: boolean;
  onEdit: (row: {
    id: string;
    nome: string;
    categoria: string;
    cidade: string | null;
    uf?: string | null;
    email: string | null;
    telefone: string | null;
    contato_nome: string | null;
    agencia: string | null;
    endereco: string | null;
    status: string;
  }) => void;
  onDelete: (id: string, nome: string) => void;
}) {
  if (loading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>;
  }
  if (!rows.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Nenhum registro</p>;
  }

  return (
    <TabelaPreview rows={rows}>
      {(visiveis) => (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Cidade</TableHead>
              {showContato && <TableHead>Contato / Agência</TableHead>}
              <TableHead>E-mail</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visiveis.map((row) => (
              <TableRow key={row.id} className={row.status === "inativo" ? "opacity-60" : undefined}>
                <TableCell className="font-medium">{row.nome}</TableCell>
                <TableCell>
                  <Badge variant={CATEGORIA_VARIANT[row.categoria] ?? "outline"}>
                    {CATEGORIA_LABEL[row.categoria] ?? row.categoria}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{row.cidade ?? "—"}</TableCell>
                {showContato && (
                  <TableCell className="text-sm">
                    {[row.contato_nome, row.agencia ? `Ag. ${row.agencia}` : null]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </TableCell>
                )}
                <TableCell className="text-sm">{row.email ?? "—"}</TableCell>
                <TableCell className="text-sm">{row.telefone ?? "—"}</TableCell>
                <TableCell>
                  {podeEditar ? (
                    <AcoesCadastro
                      onEdit={() => onEdit(row)}
                      onDelete={
                        row.status !== "inativo" ? () => onDelete(row.id, row.nome) : undefined
                      }
                    />
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </TabelaPreview>
  );
}
