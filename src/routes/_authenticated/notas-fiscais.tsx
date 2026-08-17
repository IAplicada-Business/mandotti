import { createFileRoute } from "@tanstack/react-router";

import { EmBreve } from "@/components/EmBreve";

export const Route = createFileRoute("/_authenticated/notas-fiscais")({
  head: () => ({
    meta: [
      { title: "Notas fiscais | Sistema Grupo Mandotti" },
      { name: "description", content: "Emissão e acompanhamento de documentos fiscais." },
      { property: "og:title", content: "Notas fiscais | Sistema Grupo Mandotti" },
      { property: "og:description", content: "Emissão e acompanhamento de documentos fiscais." },
    ],
  }),
  component: () => <EmBreve titulo="Notas fiscais" descricao="Emissão e acompanhamento de documentos fiscais." />,
});
