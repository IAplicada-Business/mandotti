import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/emissores")({
  beforeLoad: () => {
    throw redirect({ to: "/configuracoes", search: { aba: "emissores" } });
  },
});
