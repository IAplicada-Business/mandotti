import { createFileRoute } from "@tanstack/react-router";

import { EmBreve } from "@/components/EmBreve";

export const Route = createFileRoute("/_authenticated/documentos")({
  head: () => ({ meta: [{ title: "Biblioteca de Documentos | Sistema Grupo Mandotti" }] }),
  component: () => (
    <EmBreve
      titulo="Biblioteca de Documentos"
      descricao="Pastas por fazenda, alertas de vencimento e links seguros para ver ou baixar."
    />
  ),
});
