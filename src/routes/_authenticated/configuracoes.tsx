import { createFileRoute } from "@tanstack/react-router";

import { EmBreve } from "@/components/EmBreve";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações | Sistema Grupo Mandotti" },
      { name: "description", content: "Parâmetros gerais da plataforma." },
      { property: "og:title", content: "Configurações | Sistema Grupo Mandotti" },
      { property: "og:description", content: "Parâmetros gerais da plataforma." },
    ],
  }),
  component: () => <EmBreve titulo="Configurações" descricao="Parâmetros gerais da plataforma." />,
});
