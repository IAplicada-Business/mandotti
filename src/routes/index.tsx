import { createFileRoute, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sistema Grupo Mandotti | Gestão agrícola" },
      {
        name: "description",
        content:
          "Plataforma interna do Grupo Mandotti para gestão de emissores, fazendas, certificados e operação agrícola.",
      },
      { property: "og:title", content: "Sistema Grupo Mandotti | Gestão agrícola" },
      {
        property: "og:description",
        content:
          "Plataforma interna do Grupo Mandotti para gestão de emissores, fazendas, certificados e operação agrícola.",
      },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    throw redirect({ to: data.session ? "/dashboard" : "/auth" });
  },
  component: () => null,
});
