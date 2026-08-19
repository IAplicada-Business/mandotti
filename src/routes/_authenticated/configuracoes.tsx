import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/AppShell";
import { SectionCard } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { formatDateBR } from "@/lib/format";

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
        breadcrumb="Configurações"
        title="Parâmetros"
        description="Preferências do sistema e dados cadastrais importados da ficha Mandotti."
      />

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

            <div className="flex items-center justify-between rounded-xl border border-border/80 bg-surface-soft p-4">
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
              <div key={p.id} className="rounded-xl border border-border/80 bg-surface-soft p-4">
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
