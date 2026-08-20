import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Handshake, Hourglass, Plus, ShoppingCart, UserCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AcoesCadastro } from "@/components/AcoesCadastro";
import { PageHeader } from "@/components/AppShell";
import { KpiCard, SectionCard } from "@/components/design-system";
import { BarraFiltros, FiltroCard } from "@/components/LayoutAbasFiltros";
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
import { Textarea } from "@/components/ui/textarea";
import { usePerfil, useSession } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { emptyToNull, formatBRL, numOrNull } from "@/lib/format";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes & Compradores | Sistema Grupo Mandotti" },
      {
        name: "description",
        content: "Tradings e compradores da produção — base para contratos e emissão de NF.",
      },
    ],
  }),
  component: ClientesPage,
});

type NegStatus = Database["public"]["Enums"]["negociacao_status"];

const STATUS_LABEL: Record<string, string> = {
  cadastrado: "Cadastrado",
  negociando: "Negociando",
  firmado: "Firmado",
  entregue: "Entregue",
  pagamento_validado: "Pagamento validado",
  faturado: "Faturado",
  ativo: "Ativo",
  inativo: "Inativo",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  cadastrado: "outline",
  negociando: "secondary",
  firmado: "default",
  entregue: "default",
  pagamento_validado: "default",
  faturado: "default",
  ativo: "default",
  inativo: "secondary",
};

const NEG_STATUS: NegStatus[] = [
  "cadastrado",
  "negociando",
  "firmado",
  "entregue",
  "pagamento_validado",
  "faturado",
];

type FormComprador = {
  id?: string;
  nome: string;
  cidade: string;
  uf: string;
  email: string;
  telefone: string;
  contato_nome: string;
  status: string;
};

type FormNeg = {
  id?: string;
  comprador_id: string;
  cultura_codigo: string;
  safra: string;
  volume_sc: string;
  preco_saca: string;
  status: NegStatus;
  observacoes: string;
};

const VAZIO_COMPRADOR: FormComprador = {
  nome: "",
  cidade: "",
  uf: "",
  email: "",
  telefone: "",
  contato_nome: "",
  status: "ativo",
};

const VAZIO_NEG: FormNeg = {
  comprador_id: "",
  cultura_codigo: "soja",
  safra: "2026/27",
  volume_sc: "",
  preco_saca: "",
  status: "negociando",
  observacoes: "",
};

function ClientesPage() {
  const qc = useQueryClient();
  const { user } = useSession();
  const { pode } = usePerfil(user);
  const podeEditar = pode("/clientes", "editar") || pode("/notas-fiscais", "editar");
  const [safraFiltro, setSafraFiltro] = useState("todas");
  const [abertoComprador, setAbertoComprador] = useState(false);
  const [abertoNeg, setAbertoNeg] = useState(false);
  const [formComprador, setFormComprador] = useState<FormComprador>(VAZIO_COMPRADOR);
  const [formNeg, setFormNeg] = useState<FormNeg>(VAZIO_NEG);

  const { data, isLoading } = useQuery({
    queryKey: ["clientes-compradores"],
    queryFn: async () => {
      const [compradores, negociacoes, culturas] = await Promise.all([
        supabase.from("grupo_contatos").select("*").eq("categoria", "destino_producao").order("ordem"),
        supabase
          .from("negociacoes_comerciais")
          .select("*, grupo_contatos(nome, cidade)")
          .is("deleted_at", null)
          .order("safra")
          .order("cultura_codigo"),
        supabase.from("produtos_agricolas").select("codigo, nome").eq("ativo", true).order("ordem"),
      ]);
      if (compradores.error) throw compradores.error;
      if (negociacoes.error) throw negociacoes.error;
      if (culturas.error) throw culturas.error;

      const culturaNome = Object.fromEntries((culturas.data ?? []).map((c) => [c.codigo, c.nome]));

      return {
        compradores: compradores.data ?? [],
        negociacoes: negociacoes.data ?? [],
        culturas: culturas.data ?? [],
        culturaNome,
      };
    },
  });

  const safras = useMemo(
    () => [...new Set((data?.negociacoes ?? []).map((n) => n.safra))].sort(),
    [data?.negociacoes],
  );

  const negociacoes = useMemo(() => {
    let rows = data?.negociacoes ?? [];
    if (safraFiltro !== "todas") rows = rows.filter((n) => n.safra === safraFiltro);
    return rows;
  }, [data?.negociacoes, safraFiltro]);

  const compradores = data?.compradores ?? [];

  const negociando = negociacoes.filter((n) => n.status === "negociando").length;
  const firmadas = negociacoes.filter((n) =>
    ["firmado", "entregue", "pagamento_validado"].includes(n.status),
  ).length;
  const aguardandoNf = negociacoes.filter((n) => n.status === "pagamento_validado").length;

  const salvarComprador = useMutation({
    mutationFn: async (f: FormComprador) => {
      if (!f.nome.trim()) throw new Error("Informe o nome do comprador");
      const payload = {
        nome: f.nome.trim(),
        cidade: emptyToNull(f.cidade),
        uf: emptyToNull(f.uf),
        email: emptyToNull(f.email),
        telefone: emptyToNull(f.telefone),
        contato_nome: emptyToNull(f.contato_nome),
        status: f.status,
        categoria: "destino_producao",
        origem: "manual",
      };
      const res = f.id
        ? await supabase.from("grupo_contatos").update(payload).eq("id", f.id)
        : await supabase.from("grupo_contatos").insert({ ...payload, ordem: compradores.length + 1 });
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      toast.success("Comprador salvo");
      setAbertoComprador(false);
      setFormComprador(VAZIO_COMPRADOR);
      qc.invalidateQueries({ queryKey: ["clientes-compradores"] });
      qc.invalidateQueries({ queryKey: ["grupo-contatos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const excluirComprador = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("grupo_contatos").update({ status: "inativo" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Comprador inativado");
      qc.invalidateQueries({ queryKey: ["clientes-compradores"] });
      qc.invalidateQueries({ queryKey: ["grupo-contatos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const salvarNeg = useMutation({
    mutationFn: async (f: FormNeg) => {
      if (!f.comprador_id || !f.safra.trim()) throw new Error("Informe comprador e safra");
      const payload = {
        comprador_id: f.comprador_id,
        cultura_codigo: f.cultura_codigo,
        safra: f.safra.trim(),
        volume_sc: numOrNull(f.volume_sc),
        preco_saca: numOrNull(f.preco_saca),
        status: f.status,
        observacoes: emptyToNull(f.observacoes),
        origem: "manual",
      };
      const res = f.id
        ? await supabase.from("negociacoes_comerciais").update(payload).eq("id", f.id)
        : await supabase.from("negociacoes_comerciais").insert(payload);
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      toast.success("Negociação salva");
      setAbertoNeg(false);
      setFormNeg(VAZIO_NEG);
      qc.invalidateQueries({ queryKey: ["clientes-compradores"] });
      qc.invalidateQueries({ queryKey: ["notas-fiscais-painel"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const excluirNeg = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("negociacoes_comerciais")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Negociação excluída");
      qc.invalidateQueries({ queryKey: ["clientes-compradores"] });
      qc.invalidateQueries({ queryKey: ["notas-fiscais-painel"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes & Compradores"
        description="Cadastre tradings, altere status das negociações e exclua linhas importadas da planilha."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to="/notas-fiscais">
                Notas fiscais <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            {podeEditar ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFormNeg({
                      ...VAZIO_NEG,
                      comprador_id: compradores[0]?.id ?? "",
                    });
                    setAbertoNeg(true);
                  }}
                >
                  <Plus className="mr-2 size-4" />
                  Negociação
                </Button>
                <Button
                  onClick={() => {
                    setFormComprador(VAZIO_COMPRADOR);
                    setAbertoComprador(true);
                  }}
                >
                  <Plus className="mr-2 size-4" />
                  Comprador
                </Button>
              </>
            ) : null}
          </div>
        }
      />

      <BarraFiltros>
        <FiltroCard label="Safra">
          <Select value={safraFiltro} onValueChange={setSafraFiltro}>
            <SelectTrigger>
              <SelectValue placeholder="Safra" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {safras.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FiltroCard>
      </BarraFiltros>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Compradores" value={compradores.length} icon={UserCircle} tone="info" />
        <KpiCard label="Negociações" value={negociacoes.length} icon={Handshake} hint="Por safra/cultura" />
        <KpiCard label="Em negociação" value={negociando} icon={Hourglass} tone="warning" />
        <KpiCard
          label="Prontas p/ NF"
          value={aguardandoNf}
          icon={ShoppingCart}
          hint={firmadas > 0 ? `${firmadas} firmada(s)` : undefined}
          tone={aguardandoNf > 0 ? "success" : "default"}
        />
      </div>

      <SectionCard title="Compradores cadastrados" description="Destino da produção — edite ou inative linhas da planilha">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : compradores.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhum comprador cadastrado.</p>
        ) : (
          <TabelaPreview rows={compradores}>
            {(visiveis) => (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trading / Comprador</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="text-right">Negociações</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiveis.map((c) => {
                    const qtd = negociacoes.filter((n) => n.comprador_id === c.id).length;
                    return (
                      <TableRow key={c.id} className={c.status === "inativo" ? "opacity-60" : undefined}>
                        <TableCell className="font-medium">{c.nome}</TableCell>
                        <TableCell className="text-muted-foreground">{c.cidade ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[c.status] ?? "outline"}>
                            {STATUS_LABEL[c.status] ?? c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{c.email ?? "—"}</TableCell>
                        <TableCell className="text-sm">{c.telefone ?? "—"}</TableCell>
                        <TableCell className="text-right font-mono-nums">{qtd}</TableCell>
                        <TableCell>
                          {podeEditar ? (
                            <AcoesCadastro
                              onEdit={() => {
                                setFormComprador({
                                  id: c.id,
                                  nome: c.nome,
                                  cidade: c.cidade ?? "",
                                  uf: c.uf ?? "",
                                  email: c.email ?? "",
                                  telefone: c.telefone ?? "",
                                  contato_nome: c.contato_nome ?? "",
                                  status: c.status,
                                });
                                setAbertoComprador(true);
                              }}
                              onDelete={
                                c.status !== "inativo"
                                  ? () => {
                                      if (window.confirm(`Inativar ${c.nome}?`)) {
                                        excluirComprador.mutate(c.id);
                                      }
                                    }
                                  : undefined
                              }
                            />
                          ) : null}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </TabelaPreview>
        )}
      </SectionCard>

      <SectionCard
        title="Negociações comerciais"
        description="Altere status, volume e preço — ou exclua linhas que vieram da planilha"
      >
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : negociacoes.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma negociação para os filtros atuais.
          </p>
        ) : (
          <TabelaPreview rows={negociacoes}>
            {(visiveis) => (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Comprador</TableHead>
                    <TableHead>Cultura</TableHead>
                    <TableHead>Safra</TableHead>
                    <TableHead className="text-right">Volume (sc)</TableHead>
                    <TableHead className="text-right">Preço/sc</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Observação</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiveis.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell className="font-medium">
                        {n.grupo_contatos?.nome ?? "—"}
                        {n.grupo_contatos?.cidade ? (
                          <span className="block text-xs text-muted-foreground">
                            {n.grupo_contatos.cidade}
                          </span>
                        ) : null}
                      </TableCell>
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
                        <Badge variant={STATUS_VARIANT[n.status] ?? "outline"}>
                          {STATUS_LABEL[n.status] ?? n.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {n.observacoes ?? "—"}
                      </TableCell>
                      <TableCell>
                        {podeEditar ? (
                          <AcoesCadastro
                            onEdit={() => {
                              setFormNeg({
                                id: n.id,
                                comprador_id: n.comprador_id,
                                cultura_codigo: n.cultura_codigo,
                                safra: n.safra,
                                volume_sc: n.volume_sc != null ? String(n.volume_sc) : "",
                                preco_saca: n.preco_saca != null ? String(n.preco_saca) : "",
                                status: n.status,
                                observacoes: n.observacoes ?? "",
                              });
                              setAbertoNeg(true);
                            }}
                            onDelete={() => {
                              if (window.confirm("Excluir esta negociação?")) excluirNeg.mutate(n.id);
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

      <Dialog open={abertoComprador} onOpenChange={setAbertoComprador}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formComprador.id ? "Editar comprador" : "Novo comprador"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={formComprador.nome}
                onChange={(e) => setFormComprador((f) => ({ ...f, nome: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  value={formComprador.cidade}
                  onChange={(e) => setFormComprador((f) => ({ ...f, cidade: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>UF</Label>
                <Input
                  value={formComprador.uf}
                  onChange={(e) => setFormComprador((f) => ({ ...f, uf: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  value={formComprador.email}
                  onChange={(e) => setFormComprador((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={formComprador.telefone}
                  onChange={(e) => setFormComprador((f) => ({ ...f, telefone: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Contato</Label>
              <Input
                value={formComprador.contato_nome}
                onChange={(e) => setFormComprador((f) => ({ ...f, contato_nome: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formComprador.status}
                onValueChange={(v) => setFormComprador((f) => ({ ...f, status: v }))}
              >
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
            <Button variant="outline" onClick={() => setAbertoComprador(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!formComprador.nome.trim() || salvarComprador.isPending}
              onClick={() => salvarComprador.mutate(formComprador)}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={abertoNeg} onOpenChange={setAbertoNeg}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formNeg.id ? "Editar negociação" : "Nova negociação"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>Comprador</Label>
              <Select
                value={formNeg.comprador_id}
                onValueChange={(v) => setFormNeg((f) => ({ ...f, comprador_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Comprador" />
                </SelectTrigger>
                <SelectContent>
                  {compradores
                    .filter((c) => c.status !== "inativo")
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                        {c.cidade ? ` · ${c.cidade}` : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Cultura</Label>
                <Select
                  value={formNeg.cultura_codigo}
                  onValueChange={(v) => setFormNeg((f) => ({ ...f, cultura_codigo: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(data?.culturas ?? []).map((c) => (
                      <SelectItem key={c.codigo} value={c.codigo}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Safra</Label>
                <Input
                  value={formNeg.safra}
                  onChange={(e) => setFormNeg((f) => ({ ...f, safra: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Volume (sc)</Label>
                <Input
                  type="number"
                  value={formNeg.volume_sc}
                  onChange={(e) => setFormNeg((f) => ({ ...f, volume_sc: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Preço/sc</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formNeg.preco_saca}
                  onChange={(e) => setFormNeg((f) => ({ ...f, preco_saca: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formNeg.status}
                onValueChange={(v) => setFormNeg((f) => ({ ...f, status: v as NegStatus }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NEG_STATUS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observação</Label>
              <Textarea
                value={formNeg.observacoes}
                onChange={(e) => setFormNeg((f) => ({ ...f, observacoes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAbertoNeg(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!formNeg.comprador_id || !formNeg.safra.trim() || salvarNeg.isPending}
              onClick={() => salvarNeg.mutate(formNeg)}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
