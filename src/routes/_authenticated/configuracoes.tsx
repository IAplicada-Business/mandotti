import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Plus, Send } from "lucide-react";
import { useEffect, useState } from "react";
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
import { usePerfil, useSession } from "@/hooks/useAuth";
import { formatDateBR, slugCodigo } from "@/lib/format";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({ meta: [{ title: "Parâmetros | Sistema Grupo Mandotti" }] }),
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const qc = useQueryClient();
  const { user } = useSession();
  const { perfil } = usePerfil(user);
  const isAdmin = perfil === "admin";

  const { data, isLoading } = useQuery({
    queryKey: ["configuracoes_grupo"],
    queryFn: async () => {
      const { data, error } = await supabase.from("configuracoes_grupo").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: ficha, isLoading: loadingFicha } = useQuery({
    queryKey: ["configuracoes_ficha"],
    queryFn: async () => {
      const [pessoas, bens] = await Promise.all([
        supabase.from("cadastro_pessoas").select("*").order("ordem"),
        supabase.from("patrimonio_bens").select("*").eq("tipo", "participacao").order("ordem"),
      ]);
      if (pessoas.error) throw pessoas.error;
      if (bens.error) throw bens.error;
      return { pessoas: pessoas.data ?? [], participacoes: bens.data ?? [] };
    },
  });

  const [emailHrm, setEmailHrm] = useState("");
  const [envioAutomatico, setEnvioAutomatico] = useState(true);
  const [diaLimite, setDiaLimite] = useState("5");
  const [metaHa, setMetaHa] = useState("10000");

  useEffect(() => {
    if (!data) return;
    setEmailHrm(data.email_hrm ?? "");
    setEnvioAutomatico(data.modo_contabilidade !== "acesso_direto");
    setDiaLimite(String(data.dia_limite_envio ?? 5));
    setMetaHa(String(data.meta_hectares_grupo ?? 10000));
  }, [data]);

  const salvar = useMutation({
    mutationFn: async () => {
      if (!data?.id) throw new Error("Configuração não encontrada");
      const { error } = await supabase
        .from("configuracoes_grupo")
        .update({
          email_hrm: emailHrm || null,
          modo_contabilidade: envioAutomatico ? "envio_automatico" : "acesso_direto",
          dia_limite_envio: Number(diaLimite) || 5,
          meta_hectares_grupo: Number(metaHa) || 10000,
        })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Parâmetros salvos");
      qc.invalidateQueries({ queryKey: ["configuracoes_grupo"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parâmetros"
        description="Preferências do sistema e dados cadastrais importados da ficha Mandotti."
      />

      <CategoriasFinanceiras podeEditar={isAdmin} />

      <SectionCard
        title="Contabilidade (HRM)"
        description="Acordado na call: envio automático até o dia 5 se o escritório não acessar o sistema."
      >
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <div className="max-w-xl space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email_hrm">E-mail HRM (contabilidade)</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email_hrm"
                  type="email"
                  className="pl-9"
                  placeholder="contabilidade@hrm.com.br"
                  value={emailHrm}
                  onChange={(e) => setEmailHrm(e.target.value)}
                  disabled={!isAdmin}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-[1.25rem] bg-surface-soft p-4">
              <div>
                <p className="text-sm font-semibold">Envio automático por e-mail</p>
                <p className="text-xs text-muted-foreground">
                  Desligue se a HRM preferir acesso direto ao sistema
                </p>
              </div>
              <Switch checked={envioAutomatico} onCheckedChange={setEnvioAutomatico} disabled={!isAdmin} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dia_limite">Enviar relatórios até o dia</Label>
                <Input
                  id="dia_limite"
                  type="number"
                  min={1}
                  max={28}
                  value={diaLimite}
                  onChange={(e) => setDiaLimite(e.target.value)}
                  disabled={!isAdmin}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta_ha">Meta hectares do grupo</Label>
                <Input
                  id="meta_ha"
                  type="number"
                  value={metaHa}
                  onChange={(e) => setMetaHa(e.target.value)}
                  disabled={!isAdmin}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isAdmin ? (
                <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
                  <Send className="mr-2 size-4" />
                  Salvar parâmetros
                </Button>
              ) : (
                <Badge variant="secondary">Somente admin edita</Badge>
              )}
              <Badge variant="outline">Cron/e-mail real: próxima entrega</Badge>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Participações societárias"
        description="Estrutura societária do grupo — importada da ficha cadastral (somente consulta)"
      >
        {loadingFicha ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : ficha?.participacoes.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Descrição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ficha.participacoes.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono-nums text-muted-foreground">{row.ordem}</TableCell>
                  <TableCell>{row.descricao}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma participação cadastrada</p>
        )}
      </SectionCard>

      <SectionCard
        title="Dados cadastrais"
        description="Titular, cônjuge e correspondência — importados da ficha (somente consulta)"
      >
        {loadingFicha ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : ficha?.pessoas.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ficha.pessoas.map((p) => (
              <div key={p.id} className="rounded-[1.25rem] bg-surface-soft p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="secondary">{labelTipoPessoa(p.tipo)}</Badge>
                </div>
                <p className="font-semibold text-foreground">{p.nome}</p>
                <dl className="mt-3 space-y-1.5 text-sm">
                  {p.email && (
                    <div>
                      <dt className="text-muted-foreground">E-mail</dt>
                      <dd>{p.email}</dd>
                    </div>
                  )}
                  {p.telefone && (
                    <div>
                      <dt className="text-muted-foreground">Telefone</dt>
                      <dd>{p.telefone}</dd>
                    </div>
                  )}
                  {p.endereco && (
                    <div>
                      <dt className="text-muted-foreground">Endereço</dt>
                      <dd>{p.endereco}</dd>
                    </div>
                  )}
                  {(p.cidade || p.cep) && (
                    <div>
                      <dt className="text-muted-foreground">Cidade / CEP</dt>
                      <dd>{[p.cidade, p.uf, p.cep].filter(Boolean).join(" · ")}</dd>
                    </div>
                  )}
                  {p.profissao && (
                    <div>
                      <dt className="text-muted-foreground">Profissão</dt>
                      <dd>{p.profissao}</dd>
                    </div>
                  )}
                  {p.data_nascimento && (
                    <div>
                      <dt className="text-muted-foreground">Nascimento</dt>
                      <dd>{formatDateBR(p.data_nascimento)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum cadastro importado</p>
        )}
      </SectionCard>
    </div>
  );
}

function labelTipoPessoa(tipo: string) {
  if (tipo === "titular") return "Titular";
  if (tipo === "conjuge") return "Cônjuge";
  return "Correspondência";
}

type CategoriaTipo = Database["public"]["Enums"]["categoria_tipo"];

const TIPO_LABEL: Record<CategoriaTipo, string> = {
  despesa: "Despesa",
  receita: "Receita",
  folha: "Folha",
  outros: "Outros",
};

function CategoriasFinanceiras({ podeEditar }: { podeEditar: boolean }) {
  const qc = useQueryClient();
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
      title="Categorias financeiras"
      description="Crie categorias próprias. Use Outros para despesas sem nota (ajudantes, pix avulso)."
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
