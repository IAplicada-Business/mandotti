import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { NAV } from "@/components/AppShell";
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { supabase } from "@/integrations/supabase/client";
import { usePerfil, useSession, type Perfil } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários | Sistema Grupo Mandotti" },
      { name: "description", content: "Gestão de usuários e perfis de acesso da plataforma." },
      { property: "og:title", content: "Usuários | Sistema Grupo Mandotti" },
      {
        property: "og:description",
        content: "Gestão de usuários e perfis de acesso da plataforma.",
      },
    ],
  }),
  component: UsuariosPage,
});

const PERFIS: Perfil[] = ["admin", "funcionario", "contabilidade"];
const PERFIL_LABEL: Record<Perfil, string> = {
  admin: "Admin",
  funcionario: "Funcionário",
  contabilidade: "Contabilidade",
};
const ROTAS: { to: string; label: string }[] = NAV.flatMap((g) =>
  g.items.map((i) => ({ to: i.to as string, label: i.label as string })),
);

type Grant = { rota: string; pode_ver: boolean; pode_editar: boolean };

type Usuario = {
  id: string;
  user_id: string;
  nome: string;
  email: string | null;
  ativo: boolean;
  perfil: Perfil;
};

function grantsIniciais(): Grant[] {
  return ROTAS.map((r) => ({ rota: r.to, pode_ver: false, pode_editar: false }));
}

function GradeDeAcessos({
  grants,
  onChange,
}: {
  grants: Grant[];
  onChange: (grants: Grant[]) => void;
}) {
  const set = (rota: string, campo: "pode_ver" | "pode_editar", valor: boolean) => {
    onChange(
      grants.map((g) =>
        g.rota === rota
          ? {
              ...g,
              [campo]: valor,
              ...(campo === "pode_editar" && valor ? { pode_ver: true } : {}),
            }
          : g,
      ),
    );
  };

  return (
    <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-3">
      {ROTAS.map((r) => {
        const g = grants.find((x) => x.rota === r.to) ?? {
          rota: r.to,
          pode_ver: false,
          pode_editar: false,
        };
        return (
          <div key={r.to} className="flex items-center justify-between gap-4 text-sm">
            <span className="min-w-0 flex-1 truncate">{r.label}</span>
            <label className="flex items-center gap-2">
              <Checkbox
                checked={g.pode_ver}
                onCheckedChange={(v) => set(r.to, "pode_ver", v === true)}
              />
              Ver
            </label>
            <label className="flex items-center gap-2">
              <Checkbox
                checked={g.pode_editar}
                onCheckedChange={(v) => set(r.to, "pode_editar", v === true)}
              />
              Editar
            </label>
          </div>
        );
      })}
    </div>
  );
}

function UsuariosPage() {
  const qc = useQueryClient();
  const { user } = useSession();
  const { perfil: meuPerfil, loading } = usePerfil(user);
  const isAdmin = meuPerfil === "admin";

  const [convidarAberto, setConvidarAberto] = useState(false);
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [novoPerfil, setNovoPerfil] = useState<Perfil>("funcionario");
  const [grants, setGrants] = useState<Grant[]>(grantsIniciais());

  const [acessosAberto, setAcessosAberto] = useState<Usuario | null>(null);
  const [grantsEdicao, setGrantsEdicao] = useState<Grant[]>(grantsIniciais());

  const { data } = useQuery({
    queryKey: ["usuarios"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("perfis")
        .select("id, user_id, nome, email, ativo, perfil")
        .order("nome");
      if (error) throw error;
      return data as Usuario[];
    },
  });

  const { data: acessosPorUsuario } = useQuery({
    queryKey: ["perfis_acesso", "todos"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("perfis_acesso")
        .select("user_id, rota, pode_ver, pode_editar");
      if (error) throw error;
      return data;
    },
  });

  const convidar = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: {
          email,
          nome,
          perfil: novoPerfil,
          grants:
            novoPerfil === "funcionario" ? grants.filter((g) => g.pode_ver || g.pode_editar) : [],
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success("Convite enviado");
      setConvidarAberto(false);
      setEmail("");
      setNome("");
      setNovoPerfil("funcionario");
      setGrants(grantsIniciais());
      qc.invalidateQueries({ queryKey: ["usuarios"] });
      qc.invalidateQueries({ queryKey: ["perfis_acesso"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const salvarAcessos = useMutation({
    mutationFn: async () => {
      if (!acessosAberto) return;
      const payload = grantsEdicao
        .filter((g) => g.pode_ver || g.pode_editar)
        .map((g) => ({
          user_id: acessosAberto.user_id,
          rota: g.rota,
          pode_ver: g.pode_ver,
          pode_editar: g.pode_editar,
        }));

      const { error: delError } = await supabase
        .from("perfis_acesso")
        .delete()
        .eq("user_id", acessosAberto.user_id);
      if (delError) throw delError;

      if (payload.length) {
        const { error: insError } = await supabase.from("perfis_acesso").insert(payload);
        if (insError) throw insError;
      }
    },
    onSuccess: () => {
      toast.success("Acessos atualizados");
      setAcessosAberto(null);
      qc.invalidateQueries({ queryKey: ["perfis_acesso"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const abrirEdicaoAcessos = (u: Usuario) => {
    const existentes = (acessosPorUsuario ?? []).filter((g) => g.user_id === u.user_id);
    setGrantsEdicao(
      ROTAS.map((r) => {
        const g = existentes.find((x) => x.rota === r.to);
        return { rota: r.to, pode_ver: g?.pode_ver ?? false, pode_editar: g?.pode_editar ?? false };
      }),
    );
    setAcessosAberto(u);
  };

  if (!loading && !isAdmin) {
    return (
      <div>
        <PageHeader title="Usuários" description="Área restrita a administradores." />
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Você não tem permissão para gerenciar usuários.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Usuários"
        description="Perfis cadastrados e seus acessos por tela."
        action={
          <Button onClick={() => setConvidarAberto(true)}>
            <Plus className="mr-2 size-4" />
            Convidar usuário
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!data?.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.nome || "—"}</TableCell>
                    <TableCell>{u.email ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={u.ativo ? "default" : "secondary"}>
                        {u.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{PERFIL_LABEL[u.perfil]}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {u.perfil === "funcionario" ? (
                        <Button variant="ghost" size="sm" onClick={() => abrirEdicaoAcessos(u)}>
                          Editar acessos
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

      <Dialog open={convidarAberto} onOpenChange={setConvidarAberto}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Convidar usuário</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              convidar.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="perfil">Perfil *</Label>
              <Select value={novoPerfil} onValueChange={(v) => setNovoPerfil(v as Perfil)}>
                <SelectTrigger id="perfil">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERFIS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PERFIL_LABEL[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {novoPerfil === "funcionario" ? (
              <div className="space-y-2">
                <Label>Acessos por tela</Label>
                <GradeDeAcessos grants={grants} onChange={setGrants} />
              </div>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setConvidarAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={convidar.isPending}>
                <Mail className="mr-2 size-4" />
                Enviar convite
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!acessosAberto} onOpenChange={(v) => !v && setAcessosAberto(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Acessos de {acessosAberto?.nome || acessosAberto?.email}</DialogTitle>
          </DialogHeader>
          <GradeDeAcessos grants={grantsEdicao} onChange={setGrantsEdicao} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAcessosAberto(null)}>
              Cancelar
            </Button>
            <Button onClick={() => salvarAcessos.mutate()} disabled={salvarAcessos.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
