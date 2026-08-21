import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SectionCard } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { formatDateBR } from "@/lib/format";

function labelTipoPessoa(tipo: string) {
  if (tipo === "titular") return "Titular";
  if (tipo === "conjuge") return "Cônjuge";
  return "Correspondência";
}

export function DadosPainel() {
  const qc = useQueryClient();
  const { user } = useSession();
  const { perfil } = usePerfil(user);
  const isAdmin = perfil === "admin";

  const { data: grupo } = useQuery({
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

  const [metaHa, setMetaHa] = useState("10000");
  useEffect(() => {
    if (grupo) setMetaHa(String(grupo.meta_hectares_grupo ?? 10000));
  }, [grupo]);

  const salvarMeta = useMutation({
    mutationFn: async () => {
      if (!grupo?.id) throw new Error("Configuração não encontrada");
      const { error } = await supabase
        .from("configuracoes_grupo")
        .update({ meta_hectares_grupo: Number(metaHa) || 10000 })
        .eq("id", grupo.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Dados do grupo salvos");
      qc.invalidateQueries({ queryKey: ["configuracoes_grupo"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <SectionCard title="Grupo" description="Parâmetros cadastrais usados nos relatórios.">
        <div className="grid max-w-md gap-3">
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
          {isAdmin ? (
            <Button className="w-fit" onClick={() => salvarMeta.mutate()} disabled={salvarMeta.isPending}>
              Salvar
            </Button>
          ) : (
            <Badge variant="secondary" className="w-fit">
              Somente admin edita
            </Badge>
          )}
        </div>
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
                  {p.email ? (
                    <div>
                      <dt className="text-muted-foreground">E-mail</dt>
                      <dd>{p.email}</dd>
                    </div>
                  ) : null}
                  {p.telefone ? (
                    <div>
                      <dt className="text-muted-foreground">Telefone</dt>
                      <dd>{p.telefone}</dd>
                    </div>
                  ) : null}
                  {p.endereco ? (
                    <div>
                      <dt className="text-muted-foreground">Endereço</dt>
                      <dd>{p.endereco}</dd>
                    </div>
                  ) : null}
                  {p.cidade || p.cep ? (
                    <div>
                      <dt className="text-muted-foreground">Cidade / CEP</dt>
                      <dd>{[p.cidade, p.uf, p.cep].filter(Boolean).join(" · ")}</dd>
                    </div>
                  ) : null}
                  {p.profissao ? (
                    <div>
                      <dt className="text-muted-foreground">Profissão</dt>
                      <dd>{p.profissao}</dd>
                    </div>
                  ) : null}
                  {p.data_nascimento ? (
                    <div>
                      <dt className="text-muted-foreground">Nascimento</dt>
                      <dd>{formatDateBR(p.data_nascimento)}</dd>
                    </div>
                  ) : null}
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
