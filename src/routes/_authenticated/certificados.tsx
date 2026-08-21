import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/certificados")({
  beforeLoad: () => {
    throw redirect({ to: "/configuracoes", search: { aba: "certificados" } });
  },
});
