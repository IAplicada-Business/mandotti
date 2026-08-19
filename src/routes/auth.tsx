import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sprout } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar | Sistema Grupo Mandotti" },
      {
        name: "description",
        content: "Acesse a plataforma de gestão agrícola do Grupo Mandotti.",
      },
      { property: "og:title", content: "Entrar | Sistema Grupo Mandotti" },
      {
        property: "og:description",
        content: "Acesse a plataforma de gestão agrícola do Grupo Mandotti.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setCarregando(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/dashboard" });
  };

  const cadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { nome },
      },
    });
    setCarregando(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Cadastro criado. Verifique seu e-mail se a confirmação estiver ativa.");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 600px at 10% -10%, rgba(63,125,73,0.18), transparent 55%), radial-gradient(900px 500px at 100% 0%, rgba(127,168,50,0.14), transparent 50%), linear-gradient(180deg, #f1f7f1 0%, #f4f7f5 45%, #eef3ef 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
        style={{
          background:
            "linear-gradient(90deg, #2E6636 0%, #7FA832 30%, #C99012 60%, #B5541C 85%, #6E5537 100%)",
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="mb-7 flex items-center gap-3">
          <div className="relative grid size-12 place-items-center rounded-full bg-card shadow-sm">
            <span
              className="absolute -inset-0.5 rounded-full"
              style={{
                background:
                  "conic-gradient(from 130deg, #2E6636, #7FA832, #C99012, #B5541C, #6E5537, #2E6636)",
                WebkitMask: "radial-gradient(circle, transparent 19px, #000 20.5px)",
                mask: "radial-gradient(circle, transparent 19px, #000 20.5px)",
              }}
            />
            <Sprout className="relative z-10 size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Sistema Grupo Mandotti</h1>
            <p className="text-sm text-muted-foreground">Gestão agrícola integrada</p>
          </div>
        </div>

        <Card className="shadow-md">
          <CardHeader className="border-b-0 pb-2">
            <CardTitle className="text-lg">Acesso à plataforma</CardTitle>
            <CardDescription>Use suas credenciais corporativas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="entrar">
              <TabsList className="mb-5 grid w-full grid-cols-2">
                <TabsTrigger value="entrar">Entrar</TabsTrigger>
                <TabsTrigger value="cadastrar">Criar conta</TabsTrigger>
              </TabsList>

              <TabsContent value="entrar">
                <form className="space-y-4" onSubmit={entrar}>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="senha">Senha</Label>
                    <Input
                      id="senha"
                      type="password"
                      required
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={carregando}>
                    {carregando ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="cadastrar">
                <form className="space-y-4" onSubmit={cadastrar}>
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome completo</Label>
                    <Input
                      id="nome"
                      required
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email2">E-mail</Label>
                    <Input
                      id="email2"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="senha2">Senha</Label>
                    <Input
                      id="senha2"
                      type="password"
                      required
                      minLength={6}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={carregando}>
                    {carregando ? "Criando..." : "Criar conta"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Novas contas entram como <strong>visualizador</strong>. Um administrador ajusta o
                    papel depois.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
