import { createFileRoute } from "@tanstack/react-router";

import { EmBreve } from "@/components/EmBreve";

export const Route = createFileRoute("/_authenticated/contratos")({
  head: () => ({ meta: [{ title: "Contratos · Tradings | Sistema Grupo Mandotti" }] }),
  component: () => (
    <EmBreve
      titulo="Contratos · Tradings"
      descricao="Banco de contratos forward (soja, milho, sorgo, milheto) — sem histórico anterior, só daqui pra frente."
    />
  ),
});
