import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/AppShell";
import { KpiCard, SectionCard } from "@/components/design-system";
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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useEmissor } from "@/lib/emissor-context";
import { REGIME_LABEL, REGIME_VARIANT, type FazendaRegime } from "@/lib/fazenda-labels";
import { formatBRL } from "@/lib/format";
import { usePerfil, useSession } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/fazendas")({
  head: () => ({
    meta: [{ title: "Fazendas & Áreas | Sistema Grupo Mandotti" }],
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
  regime: FazendaRegime;
  area_produtiva_ha: string;
  area_abertura_ha: string;
  area_hectares: string;
  custo_arrendamento: string;
  venc_arrendamento: string;
  inclui_quadro_produtivo: boolean;
  municipio: string;
  uf: string;
  observacoes: string;
  ativo: boolean;
};

const vazio: Form = {
  emissor_id: "",
  nome: "",
  codigo: "",
  inscricao_estadual: "",
  car: "",
  regime: "arrendada",
  area_produtiva_ha: "",
  area_abertura_ha: "",
  area_hectares: "",
  custo_arrendamento: "",
  venc_arrendamento: "",
  inclui_quadro_produtivo: true,
  municipio: "",
  uf: "TO",
  observacoes: "",
  ativo: true,
};

const REGIMES: FazendaRegime[] = ["propria", "arrendada", "arrendada_a_terceiro"];

function numOrNull(v: string) {
  return v ? Number(v) : null;
}

function FazendasPage() {
  const qc = useQueryClient();
  const { emissorIds, emissores } = useEmissor();
  const { user } = useSession();
  const { pode, perfil } = usePerfil(user);
  const podeEditar = pode("/fazendas", "editar");
  const isAdmin = perfil === "admin";
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<Form>(vazio);

  const { data: config } = useQuery({
    queryKey: ["configuracoes_grupo"],
    queryFn: async () => {
      const { data, error } = await supabase.from("configuracoes_grupo").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

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

  const kpis = useMemo(() => {
    const lista = data ?? [];
    const produtivas = lista.filter((f) => f.inclui_quadro_produtivo);
    const areaProd = produtivas.reduce((acc, f) => acc + (f.area_produtiva_ha ?? 0), 0);
    const areaAbertura = lista.reduce((acc, f) => acc + (f.area_abertura_ha ?? 0), 0);
    const arrendTerceiro = lista.filter((f) => f.regime === "arrendada_a_terceiro").length;
    return {
      areaProd,
      countProd: produtivas.length,
      areaAbertura,
      meta: config?.meta_hectares_grupo ?? 10000,
      arrendTerceiro,
    };
  }, [data, config]);

  const salvar = useMutation({
    mutationFn: async (f: Form) => {
      const { id, ...campos } = f;
      const payload = {
        emissor_id: campos.emissor_id,
        nome: campos.nome,
        codigo: campos.codigo || null,
        inscricao_estadual: campos.inscricao_estadual || null,
        car: campos.car || null,
        regime: campos.regime,
        area_produtiva_ha: numOrNull(campos.area_produtiva_ha),
        area_abertura_ha: numOrNull(campos.area_abertura_ha),
        area_hectares: (() => {
          const explicit = numOrNull(campos.area_hectares);
          if (explicit != null) return explicit;
          const prod = numOrNull(campos.area_produtiva_ha);
          const abert = numOrNull(campos.area_abertura_ha);
          if (prod == null && abert == null) return null;
          return (prod ?? 0) + (abert ?? 0);
        })(),
        custo_arrendamento: numOrNull(campos.custo_arrendamento),
        venc_arrendamento: campos.venc_arrendamento || null,
        inclui_quadro_produtivo: campos.inclui_quadro_produtivo,
        municipio: campos.municipio || null,
        uf: campos.uf || null,
        observacoes: campos.observacoes || null,
        ativo: campos.ativo,
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

  const abrirEdicao = (f: NonNullable<typeof data>[number]) => {
    setForm({
      id: f.id,
      emissor_id: f.emissor_id,
      nome: f.nome,
      codigo: f.codigo ?? "",
      inscricao_estadual: f.inscricao_estadual ?? "",
      car: f.car ?? "",
      regime: (f.regime as FazendaRegime) ?? "arrendada",
      area_produtiva_ha: f.area_produtiva_ha != null ? String(f.area_produtiva_ha) : "",
      area_abertura_ha: f.area_abertura_ha != null ? String(f.area_abertura_ha) : "",
      area_hectares: f.area_hectares != null ? String(f.area_hectares) : "",
      custo_arrendamento: f.custo_arrendamento != null ? String(f.custo_arrendamento) : "",
      venc_arrendamento: f.venc_arrendamento ?? "",
      inclui_quadro_produtivo: f.inclui_quadro_produtivo ?? true,
      municipio: f.municipio ?? "",
      uf: f.uf ?? "TO",
      observacoes: f.observacoes ?? "",
      ativo: f.ativo,
    });
    setAberto(true);
  };

  if (!emissorIds.length) {
    return (
      <div>
        <PageHeader
          title="Fazendas & Áreas"
          description="Fazendas, áreas e culturas por emissor."
        />
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Selecione ao menos um emissor para gerenciar as fazendas.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fazendas & Áreas"
        description="Fazendas, áreas e culturas por emissor."
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Área produtiva"
          value={`${kpis.areaProd.toLocaleString("pt-BR")} ha`}
          hint={`${kpis.countProd} fazendas no quadro produtivo`}
        />
        <KpiCard
          label="Em abertura"
          value={`${kpis.areaAbertura.toLocaleString("pt-BR")} ha`}
          hint="Desmate / licenciamento"
          tone="warning"
        />
        <KpiCard
          label="Meta do grupo"
          value={`${Number(kpis.meta).toLocaleString("pt-BR")} ha`}
          hint="Projeção expansão · usina de álcool"
          tone="success"
        />
        <KpiCard
          label="Arrendadas a 3º"
          value={String(kpis.arrendTerceiro)}
          hint="Sol Nascente · Cruz de Malta"
        />
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-foreground">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
        <p>
          <span className="font-semibold">Custo de arrendamento por área:</span> a validar — Nagyla
          vai enviar. Campos vazios aparecem como &quot;a validar&quot; até a confirmação.
        </p>
      </div>

      <SectionCard title="Imóveis rurais">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fazenda</TableHead>
              <TableHead>Regime</TableHead>
              <TableHead className="text-right">Prod. (ha)</TableHead>
              <TableHead className="text-right">Abertura (ha)</TableHead>
              <TableHead>Venc. arrend.</TableHead>
              <TableHead>Custo arrend.</TableHead>
              <TableHead>Quadro</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : !data?.length ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  Nenhuma fazenda cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              data.map((f) => (
                <TableRow key={f.id} className={!f.inclui_quadro_produtivo ? "opacity-75" : undefined}>
                  <TableCell>
                    <div className="font-medium">{f.nome}</div>
                    <div className="text-xs text-muted-foreground">
                      {[f.municipio, f.uf].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={REGIME_VARIANT[(f.regime as FazendaRegime) ?? "arrendada"]}>
                      {REGIME_LABEL[(f.regime as FazendaRegime) ?? "arrendada"]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono-nums">
                    {f.area_produtiva_ha ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono-nums">
                    {f.area_abertura_ha ?? "—"}
                  </TableCell>
                  <TableCell className="font-mono-nums text-sm">
                    {f.venc_arrendamento
                      ? new Date(f.venc_arrendamento + "T12:00:00").getFullYear()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {f.custo_arrendamento != null ? (
                      formatBRL(f.custo_arrendamento)
                    ) : f.regime === "propria" ? (
                      "—"
                    ) : (
                      <span className="text-warning">a validar</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={f.inclui_quadro_produtivo ? "default" : "secondary"}>
                      {f.inclui_quadro_produtivo ? "Produtivo" : "Fora"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {podeEditar ? (
                      <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => abrirEdicao(f)}>
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
      </SectionCard>

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
              <Label>Emissor *</Label>
              <Select value={form.emissor_id} onValueChange={(v) => setForm({ ...form, emissor_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
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
            <div className="space-y-2 sm:col-span-2">
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Código</Label>
              <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Regime</Label>
              <Select
                value={form.regime}
                onValueChange={(v) => setForm({ ...form, regime: v as FazendaRegime })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REGIMES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {REGIME_LABEL[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Área produtiva (ha)</Label>
              <Input
                type="number"
                value={form.area_produtiva_ha}
                onChange={(e) => setForm({ ...form, area_produtiva_ha: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Área em abertura (ha)</Label>
              <Input
                type="number"
                value={form.area_abertura_ha}
                onChange={(e) => setForm({ ...form, area_abertura_ha: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Custo arrendamento (R$/ano)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="a validar"
                value={form.custo_arrendamento}
                onChange={(e) => setForm({ ...form, custo_arrendamento: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Venc. arrendamento</Label>
              <Input
                type="date"
                value={form.venc_arrendamento}
                onChange={(e) => setForm({ ...form, venc_arrendamento: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Município</Label>
              <Input
                value={form.municipio}
                onChange={(e) => setForm({ ...form, municipio: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>UF</Label>
              <Input value={form.uf} onChange={(e) => setForm({ ...form, uf: e.target.value })} />
            </div>
            <div className="flex items-center gap-3 sm:col-span-2">
              <Switch
                checked={form.inclui_quadro_produtivo}
                onCheckedChange={(v) => setForm({ ...form, inclui_quadro_produtivo: v })}
              />
              <Label>Inclui no quadro produtivo</Label>
            </div>
            <div className="flex items-center gap-3 sm:col-span-2">
              <Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} />
              <Label>Fazenda ativa</Label>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Observações</Label>
              <Textarea
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                rows={2}
              />
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
