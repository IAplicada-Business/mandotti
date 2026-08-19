import { createFileRoute } from "@tanstack/react-router";

import { EmBreve } from "@/components/EmBreve";

export const Route = createFileRoute("/_authenticated/assinaturas")({
  head: () => ({ meta: [{ title: "Assinatura Digital | Sistema Grupo Mandotti" }] }),
  component: () => (
    <EmBreve
      titulo="Assinatura Digital Multicertificado"
      descricao="Quatro certificados no celular, com trilha de auditoria — backlog acoplado aos módulos."
    />
  ),
});
