import { createFileRoute } from "@tanstack/react-router";

import { EmBreve } from "@/components/EmBreve";

export const Route = createFileRoute("/_authenticated/clientes")({
  head: () => ({ meta: [{ title: "Clientes & Compradores | Sistema Grupo Mandotti" }] }),
  component: () => (
    <EmBreve
      titulo="Clientes & Compradores"
      descricao="Cadastro com validação de pagamento via extrato antes de liberar emissão de NF (Pix/transferência, sem boleto)."
    />
  ),
});
