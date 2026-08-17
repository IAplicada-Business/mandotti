import { createFileRoute } from "@tanstack/react-router";

import { EmBreve } from "@/components/EmBreve";

export const Route = createFileRoute("/_authenticated/estoque")({
  head: () => ({
    meta: [
      { title: "Estoque | Sistema Grupo Mandotti" },
      { name: "description", content: "Movimentação e saldo de estoque por fazenda." },
      { property: "og:title", content: "Estoque | Sistema Grupo Mandotti" },
      { property: "og:description", content: "Movimentação e saldo de estoque por fazenda." },
    ],
  }),
  component: () => <EmBreve titulo="Estoque" descricao="Movimentação e saldo de estoque por fazenda." />,
});
