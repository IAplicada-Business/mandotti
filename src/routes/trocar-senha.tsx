import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { MandottiLogo } from "@/components/MandottiLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/trocar-senha")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Definir nova senha | Sistema Grupo Mandotti" }],
  }),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    if (!data.user.user_metadata?.must_change_password) {
      throw redirect({ to: "/dashboard" });
    }
    return { user: data.user };
  },
  component: TrocarSenhaPage,
});

function TrocarSenhaPage() {
  const navigate = useNavigate();
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [salvando, setSalvando] = useState(false);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenha.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (novaSenha !== confirmar) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setSalvando(true);
    const { data: userData } = await supabase.auth.getUser();
    const meta = userData.user?.user_metadata ?? {};

    const { error } = await supabase.auth.updateUser({
      password: novaSenha,
      data: { ...meta, must_change_password: false },
    });
    setSalvando(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Senha atualizada. Bem-vindo(a)!");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen min-h-dvh flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border/80 bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <MandottiLogo className="size-14" />
          <h1 className="text-xl font-bold text-foreground">Primeiro acesso</h1>
          <p className="text-sm text-muted-foreground">
            Por segurança, defina uma senha pessoal antes de continuar. Você usou a senha
            inicial fornecida pelo administrador.
          </p>
        </div>

        <form className="space-y-4" onSubmit={salvar}>
          <div className="space-y-2">
            <Label htmlFor="nova">Nova senha</Label>
            <Input
              id="nova"
              type="password"
              autoComplete="new-password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmar">Confirmar senha</Label>
            <Input
              id="confirmar"
              type="password"
              autoComplete="new-password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <Button type="submit" className="w-full" disabled={salvando}>
            {salvando ? "Salvando…" : "Salvar e entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
