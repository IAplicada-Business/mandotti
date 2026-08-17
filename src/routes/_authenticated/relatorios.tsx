import { createFileRoute } from "@tanstack/react-router";

import { EmBreve } from "@/components/EmBreve";

export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios | Sistema Grupo Mandotti" },
      { name: "description", content: "Relatórios gerenciais e operacionais." },
      { property: "og:title", content: "Relatórios | Sistema Grupo Mandotti" },
      { property: "og:description", content: "Relatórios gerenciais e operacionais." },
    ],
  }),
  component: () => <EmBreve titulo="Relatórios" descricao="Relatórios gerenciais e operacionais." />,
});
