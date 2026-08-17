import { createFileRoute } from "@tanstack/react-router";

import { EmBreve } from "@/components/EmBreve";

export const Route = createFileRoute("/_authenticated/produtos")({
  head: () => ({
    meta: [
      { title: "Produtos | Sistema Grupo Mandotti" },
      { name: "description", content: "Cadastro de produtos e insumos do grupo." },
      { property: "og:title", content: "Produtos | Sistema Grupo Mandotti" },
      { property: "og:description", content: "Cadastro de produtos e insumos do grupo." },
    ],
  }),
  component: () => <EmBreve titulo="Produtos" descricao="Cadastro de produtos e insumos do grupo." />,
});
