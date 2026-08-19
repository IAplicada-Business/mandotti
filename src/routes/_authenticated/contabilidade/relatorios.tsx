import { createFileRoute } from "@tanstack/react-router";

import { EmBreve } from "@/components/EmBreve";

export const Route = createFileRoute("/_authenticated/contabilidade/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios | Contabilidade | Sistema Grupo Mandotti" }] }),
  component: () => (
    <EmBreve
      titulo="Relatórios mensais"
      descricao="Pacote contábil automático para HRM quando o escritório não acessa o sistema diretamente."
    />
  ),
});
