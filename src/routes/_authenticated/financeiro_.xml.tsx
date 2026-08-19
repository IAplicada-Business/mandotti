import { createFileRoute, redirect } from "@tanstack/react-router";

/** URL antiga — não aninha em /financeiro (que não tem Outlet). */
export const Route = createFileRoute("/_authenticated/financeiro_/xml")({
  beforeLoad: () => {
    throw redirect({ to: "/importacao-xml" });
  },
});
