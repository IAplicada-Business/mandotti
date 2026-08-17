import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, ShieldCheck, Sprout, TriangleAlert } from "lucide-react";

import { PageHeader } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { resumoEmissores, useEmissor } from "@/lib/emissor-context";

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
  const { emissores, emissorIds } = useEmissor();

  const { data } = useQuery({
    queryKey: ["dashboard", emissorIds],
    enabled: emissorIds.length > 0,
    queryFn: async () => {
      const [fazendas, certificados] = await Promise.all([
        supabase
          .from("fazendas")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .in("emissor_id", emissorIds),
        supabase
          .from("certificados")
          .select("validade")
          .is("deleted_at", null)
          .in("emissor_id", emissorIds),
      ]);

      const hoje = new Date();
      const limite = new Date(hoje.getTime() + 30 * 86400000);
      const vencendo = (certificados.data ?? []).filter(
        (c) => c.validade && new Date(c.validade) <= limite,
      ).length;

      return {
        fazendas: fazendas.count ?? 0,
        certificados: certificados.data?.length ?? 0,
        vencendo,
      };
    },
  });

  if (!emissorIds.length) {
    return (
      <div>
        <PageHeader
          title="Dashboard"
          description="Selecione ao menos um emissor para ver os indicadores."
        />
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Selecione ao menos um emissor no topo da tela.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={resumoEmissores(
          emissores.filter((e) => emissorIds.includes(e.id)),
          emissores.length,
        )}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric titulo="Emissores selecionados" valor={emissorIds.length} icone={Building2} />
        <Metric titulo="Fazendas" valor={data?.fazendas ?? 0} icone={Sprout} />
        <Metric titulo="Certificados" valor={data?.certificados ?? 0} icone={ShieldCheck} />
        <Metric titulo="Vencendo em 30 dias" valor={data?.vencendo ?? 0} icone={TriangleAlert} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Próximos módulos</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Produtos, notas fiscais, estoque e relatórios já possuem rota reservada na navegação e
          serão liberados nas próximas entregas.
        </CardContent>
      </Card>
    </div>
  );
}
