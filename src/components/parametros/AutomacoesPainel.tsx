import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePerfil, useSession } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function AutomacoesPainel() {
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

  const [emailHrm, setEmailHrm] = useState("");
  const [envioAutomatico, setEnvioAutomatico] = useState(true);
  const [diaLimite, setDiaLimite] = useState("5");

  useEffect(() => {
    if (!data) return;
    setEmailHrm(data.email_hrm ?? "");
    setEnvioAutomatico(data.modo_contabilidade !== "acesso_direto");
    setDiaLimite(String(data.dia_limite_envio ?? 5));
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
        })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Automações salvas");
      qc.invalidateQueries({ queryKey: ["configuracoes_grupo"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="flex min-h-[calc(100dvh-16rem)] flex-col rounded-[1.5rem] bg-card p-5 shadow-sm sm:p-8">
      <div className="mb-8">
        <h3 className="text-lg font-bold tracking-tight">Contabilidade (HRM)</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Envio automático até o dia 5 se o escritório não acessar o sistema.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <div className="grid flex-1 gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-6">
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

            <div className="flex items-center justify-between rounded-[1.25rem] bg-surface-soft p-5">
              <div>
                <p className="text-sm font-semibold">Envio automático por e-mail</p>
                <p className="text-xs text-muted-foreground">
                  Desligue se a HRM preferir acesso direto ao sistema
                </p>
              </div>
              <Switch checked={envioAutomatico} onCheckedChange={setEnvioAutomatico} disabled={!isAdmin} />
            </div>
          </div>

          <div className="space-y-6">
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
            <p className="text-sm text-muted-foreground">
              No dia informado, o sistema reúne o pacote do mês e envia ao e-mail da HRM — sem cortar
              o conteúdo na tela.
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {isAdmin ? (
          <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
            <Send className="mr-2 size-4" />
            Salvar automações
          </Button>
        ) : (
          <Badge variant="secondary">Somente admin edita</Badge>
        )}
        <Badge variant="outline">Cron/e-mail real: próxima entrega</Badge>
      </div>
    </section>
  );
}
