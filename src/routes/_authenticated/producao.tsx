import { createFileRoute } from "@tanstack/react-router";

import { EmBreve } from "@/components/EmBreve";

export const Route = createFileRoute("/_authenticated/producao")({
  head: () => ({ meta: [{ title: "Produção & Safras | Sistema Grupo Mandotti" }] }),
  component: () => (
    <EmBreve
      titulo="Produção & Safras"
      descricao="Romaneios PDF, comparativo por safra/fazenda/cultura, câmbio e clima — prioridade #3 da call."
    />
  ),
});
