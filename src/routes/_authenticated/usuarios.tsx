import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useRoles, useSession, type AppRole } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários | Sistema Grupo Mandotti" },
      { name: "description", content: "Gestão de usuários e papéis de acesso da plataforma." },
      { property: "og:title", content: "Usuários | Sistema Grupo Mandotti" },
      {
        property: "og:description",
        content: "Gestão de usuários e papéis de acesso da plataforma.",
      },
    ],
  }),
  component: UsuariosPage,
});

const PAPEIS: AppRole[] = ["administrador", "gestor", "operador", "visualizador"];

function UsuariosPage() {
  const qc = useQueryClient();
  const { user } = useSession();
  const { isAdmin, loading } = useRoles(user);

  const { data } = useQuery({
    queryKey: ["usuarios"],
    enabled: isAdmin,
    queryFn: async () => {
      const [perfis, papeis] = await Promise.all([
        supabase.from("perfis").select("*").order("nome"),
        supabase.from("papeis_usuario").select("user_id, role"),
      ]);
      if (perfis.error) throw perfis.error;
      if (papeis.error) throw papeis.error;
      return (perfis.data ?? []).map((p) => ({
        ...p,
        papel: (papeis.data ?? []).find((r) => r.user_id === p.user_id)?.role ?? null,
      }));
    },
  });

  const alterarPapel = useMutation({
    mutationFn: async ({ userId, papel }: { userId: string; papel: AppRole }) => {
      const del = await supabase.from("papeis_usuario").delete().eq("user_id", userId);
      if (del.error) throw del.error;
      const ins = await supabase.from("papeis_usuario").insert({ user_id: userId, role: papel });
      if (ins.error) throw ins.error;
    },
    onSuccess: () => {
      toast.success("Papel atualizado");
      qc.invalidateQueries({ queryKey: ["usuarios"] });
      qc.invalidateQueries({ queryKey: ["papeis"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

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
      <PageHeader title="Usuários" description="Perfis cadastrados e seus papéis de acesso." />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-56">Papel</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!data?.length ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
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
                      <Select
                        value={u.papel ?? "visualizador"}
                        onValueChange={(v) =>
                          alterarPapel.mutate({ userId: u.user_id, papel: v as AppRole })
                        }
                      >
                        <SelectTrigger aria-label={`Papel de ${u.nome || u.email}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAPEIS.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
