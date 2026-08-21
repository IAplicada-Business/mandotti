import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";

import { PageHeader } from "@/components/AppShell";
import { LayoutAbasFiltros } from "@/components/LayoutAbasFiltros";
import { AutomacoesPainel } from "@/components/parametros/AutomacoesPainel";
import { CertificadosPainel } from "@/components/parametros/CertificadosPainel";
import { DadosPainel } from "@/components/parametros/DadosPainel";
import { EmissoresPainel } from "@/components/parametros/EmissoresPainel";
import { FiltrosPainel } from "@/components/parametros/FiltrosPainel";
import { usePerfil, useSession } from "@/hooks/useAuth";
import { abasParametrosVisiveis, type AbaParametros } from "@/lib/nav";

const ABAS_VALIDAS: AbaParametros[] = [
  "emissores",
  "certificados",
  "filtros",
  "automacoes",
  "dados",
];

function parseAba(valor: unknown): AbaParametros | undefined {
  return ABAS_VALIDAS.includes(valor as AbaParametros) ? (valor as AbaParametros) : undefined;
}

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({ meta: [{ title: "Parâmetros | Sistema Grupo Mandotti" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    aba: parseAba(s["aba"]),
  }),
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const navigate = useNavigate({ from: "/configuracoes" });
  const search = Route.useSearch();
  const { user } = useSession();
  const { pode } = usePerfil(user);

  const abas = useMemo(
    () => abasParametrosVisiveis(pode).map((a) => ({ id: a.id, label: a.label })),
    [pode],
  );

  const abaAtiva: AbaParametros =
    (search.aba && abas.some((a) => a.id === search.aba) ? search.aba : abas[0]?.id) ?? "emissores";

  const irPara = (id: string) => {
    void navigate({ search: { aba: id as AbaParametros }, replace: true });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parâmetros"
        description="Emissores, certificados, filtros, automações da contabilidade e dados cadastrais."
      />

      {abas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem permissão para os parâmetros.</p>
      ) : (
        <LayoutAbasFiltros
          abas={abas}
          abaAtiva={abaAtiva}
          onAbaChange={irPara}
          encapsular={false}
        >
          {abaAtiva === "emissores" ? <EmissoresPainel /> : null}
          {abaAtiva === "certificados" ? <CertificadosPainel /> : null}
          {abaAtiva === "filtros" ? <FiltrosPainel /> : null}
          {abaAtiva === "automacoes" ? <AutomacoesPainel /> : null}
          {abaAtiva === "dados" ? <DadosPainel /> : null}
        </LayoutAbasFiltros>
      )}
    </div>
  );
}
