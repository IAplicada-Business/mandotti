import { createFileRoute, redirect } from "@tanstack/react-router";

/** Rota legada — redireciona para a rota plana de conciliação. */
export const Route = createFileRoute("/_authenticated/financeiro/conciliacao")({
  beforeLoad: () => {
    throw redirect({ to: "/conciliacao" });
  },
});
