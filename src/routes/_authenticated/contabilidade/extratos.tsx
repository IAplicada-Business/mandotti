import { createFileRoute } from "@tanstack/react-router";

import { EmBreve } from "@/components/EmBreve";

export const Route = createFileRoute("/_authenticated/contabilidade/extratos")({
  head: () => ({ meta: [{ title: "Extratos | Contabilidade | Sistema Grupo Mandotti" }] }),
  component: () => (
    <EmBreve
      titulo="Extratos bancários"
      descricao="Visão contabilidade (HRM) — extratos importados por emissor, enviados até o dia 5 de cada mês."
    />
  ),
});
