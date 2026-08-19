import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/AppShell";
import { KpiCard, SectionCard } from "@/components/design-system";
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
import { usePerfil, useSession } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/format";
import { useEmissor } from "@/lib/emissor-context";

export const Route = createFileRoute("/_authenticated/maquinario")({
  head: () => ({
    meta: [{ title: "Maquinário | Sistema Grupo Mandotti" }],
  }),
  component: MaquinarioPage,
});

const VAZIO = {
  emissor_id: "",
  nome: "",
  categoria: "Máquina",
  fazenda_nome: "",
  marca: "",
  modelo: "",
  ano: "",
  valor_aquisicao: "",
  cor: "",
  chassi_serie: "",
};

function MaquinarioPage() {
  const qc = useQueryClient();
  const { user } = useSession();
  const { pode } = usePerfil(user);
  const { emissores, emissorIds } = useEmissor();
  const podeEditar = pode("/maquinario", "editar");
  const [categoria, setCategoria] = useState("todas");
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState(VAZIO);

  const { data = [], isLoading } = useQuery({
    queryKey: ["maquinarios", emissorIds],
    enabled: emissorIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maquinarios")
        .select("*")
        .is("deleted_at", null)
        .in("emissor_id", emissorIds)
        .order("ordem", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const categorias = useMemo(
    () => [...new Set(data.map((m) => m.categoria).filter(Boolean))].sort(),
    [data],
  );

  const filtrados = useMemo(
    () => (categoria === "todas" ? data : data.filter((m) => m.categoria === categoria)),
    [data, categoria],
  );

  const valorTotal = filtrados.reduce((acc, m) => acc + (m.valor_aquisicao ?? 0), 0);

  const criar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("maquinarios").insert({
        emissor_id: form.emissor_id,
        nome: form.nome,
        categoria: form.categoria,
        fazenda_nome: form.fazenda_nome || null,
        marca: form.marca || null,
        modelo: form.modelo || null,
        ano: form.ano ? Number(form.ano) : null,
        valor_aquisicao: form.valor_aquisicao ? Number(form.valor_aquisicao) : null,
        cor: form.cor || null,
        chassi_serie: form.chassi_serie || null,
        ordem: (data.length || 0) + 1,
        ativo: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ativo cadastrado");
      setAberto(false);
      setForm(VAZIO);
      qc.invalidateQueries({ queryKey: ["maquinarios"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!emissorIds.length) {
    return (
      <div>
        <PageHeader breadcrumb="Cadastros" title="Maquinário" />
        <SectionCard title="Selecione emissores">
          <p className="py-8 text-center text-sm text-muted-foreground">
            Selecione ao menos um emissor no topo.
          </p>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Cadastros · Ativos"
        title="Maquinário"
        description="Cadastro da frota (ficha cadastral). Depreciação e alertas entram na Fase 3."
        action={
          <div className="flex flex-wrap gap-2">
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {categorias.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {podeEditar ? (
              <Button
                onClick={() => {
                  setForm({ ...VAZIO, emissor_id: emissorIds[0] ?? "" });
                  setAberto(true);
                }}
              >
                <Plus className="size-4" /> Novo ativo
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Ativos" value={filtrados.length} />
        <KpiCard label="Valor total" value={formatBRL(valorTotal)} tone="success" />
        <KpiCard label="Categorias" value={categorias.length} />
      </div>

      <SectionCard title="Frota" description="Dados importados da aba Maquinários.">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Equipamento</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Proprietário</TableHead>
                <TableHead>Fazenda</TableHead>
                <TableHead>Marca / Modelo</TableHead>
                <TableHead>Ano</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono-nums text-muted-foreground">{m.ordem}</TableCell>
                  <TableCell>
                    <div className="font-medium">{m.nome}</div>
                    {m.chassi_serie ? (
                      <div className="font-mono-nums text-xs text-muted-foreground">
                        {m.chassi_serie}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{m.categoria}</Badge>
                  </TableCell>
                  <TableCell>
                    {emissores.find((e) => e.id === m.emissor_id)?.nome_fantasia ||
                      emissores.find((e) => e.id === m.emissor_id)?.razao_social}
                  </TableCell>
                  <TableCell>{m.fazenda_nome || "—"}</TableCell>
                  <TableCell>
                    {[m.marca, m.modelo].filter(Boolean).join(" · ") || "—"}
                  </TableCell>
                  <TableCell className="font-mono-nums">{m.ano ?? "—"}</TableCell>
                  <TableCell className="text-right font-mono-nums">
                    {formatBRL(m.valor_aquisicao)}
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
            <DialogTitle>Novo maquinário</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>Proprietário (emissor)</Label>
              <Select
                value={form.emissor_id}
                onValueChange={(v) => setForm((f) => ({ ...f, emissor_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
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
              <Label>Nome</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input
                  value={form.categoria}
                  onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Ano</Label>
                <Input
                  type="number"
                  value={form.ano}
                  onChange={(e) => setForm((f) => ({ ...f, ano: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Marca</Label>
                <Input
                  value={form.marca}
                  onChange={(e) => setForm((f) => ({ ...f, marca: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Input
                  value={form.modelo}
                  onChange={(e) => setForm((f) => ({ ...f, modelo: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fazenda</Label>
              <Input
                value={form.fazenda_nome}
                onChange={(e) => setForm((f) => ({ ...f, fazenda_nome: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.valor_aquisicao}
                  onChange={(e) => setForm((f) => ({ ...f, valor_aquisicao: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Chassi / Série</Label>
                <Input
                  value={form.chassi_serie}
                  onChange={(e) => setForm((f) => ({ ...f, chassi_serie: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!form.emissor_id || !form.nome || criar.isPending}
              onClick={() => criar.mutate()}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
