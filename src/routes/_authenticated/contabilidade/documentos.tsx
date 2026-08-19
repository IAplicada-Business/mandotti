import { createFileRoute } from "@tanstack/react-router";

import { EmBreve } from "@/components/EmBreve";

export const Route = createFileRoute("/_authenticated/contabilidade/documentos")({
  head: () => ({ meta: [{ title: "Documentos fiscais | Contabilidade | Sistema Grupo Mandotti" }] }),
  component: () => (
    <EmBreve
      titulo="Documentos fiscais"
      descricao="XMLs, notas e anexos disponíveis para o perfil contabilidade (somente leitura)."
    />
  ),
});
