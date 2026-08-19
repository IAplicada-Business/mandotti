import { createFileRoute, redirect } from "@tanstack/react-router";

/** Rota legada — redireciona para a tela fiscal de importação. */
export const Route = createFileRoute("/_authenticated/financeiro/xml")({
  beforeLoad: () => {
    throw redirect({ to: "/importacao-xml" });
  },
});
