import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, ShieldCheck, Sprout, TriangleAlert } from "lucide-react";

import { PageHeader } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useEmissor } from "@/lib/emissor-context";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | Sistema Grupo Mandotti" },
      {
        name: "description",
        content: "Panorama de emissores, fazendas e certificados do Grupo Mandotti.",
      },
      { property: "og:title", content: "Dashboard | Sistema Grupo Mandotti" },
      {
        property: "og:description",
        content: "Panorama de emissores, fazendas e certificados do Grupo Mandotti.",
      },
    ],
  }),
  component: Dashboard,
});

function Metric({
  titulo,
  valor,
  icone: Icone,
}: {
  titulo: string;
  valor: number | string;
  icone: typeof Building2;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{titulo}</CardTitle>
        <Icone className="size-4 text-primary" />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{valor}</p>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { emissor, emissorId } = useEmissor();

  const { data } = useQuery({
    queryKey: ["dashboard", emissorId],
    queryFn: async () => {
      const [emissores, fazendas, certificados] = await Promise.all([
        supabase.from("emissores").select("id", { count: "exact", head: true }).is("deleted_at", null),
        supabase
          .from("fazendas")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .eq("emissor_id", emissorId ?? ""),
        supabase
          .from("certificados")
          .select("validade")
          .is("deleted_at", null)
          .eq("emissor_id", emissorId ?? ""),
      ]);

      const hoje = new Date();
      const limite = new Date(hoje.getTime() + 30 * 86400000);
      const vencendo = (certificados.data ?? []).filter(
        (c) => c.validade && new Date(c.validade) <= limite,
      ).length;

      return {
        emissores: emissores.count ?? 0,
        fazendas: fazendas.count ?? 0,
        certificados: certificados.data?.length ?? 0,
        vencendo,
      };
    },
  });

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={
          emissor
            ? `Emissor ativo: ${emissor.nome_fantasia || emissor.razao_social}`
            : "Selecione um emissor para ver os indicadores."
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric titulo="Emissores" valor={data?.emissores ?? 0} icone={Building2} />
        <Metric titulo="Fazendas do emissor" valor={data?.fazendas ?? 0} icone={Sprout} />
        <Metric titulo="Certificados" valor={data?.certificados ?? 0} icone={ShieldCheck} />
        <Metric titulo="Vencendo em 30 dias" valor={data?.vencendo ?? 0} icone={TriangleAlert} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Próximos módulos</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Produtos, notas fiscais, estoque e relatórios já possuem rota reservada na navegação e serão
          liberados nas próximas entregas.
        </CardContent>
      </Card>
    </div>
  );
}
