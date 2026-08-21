import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { EmissorProvider } from "@/lib/emissor-context";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // getSession lê o token local — getUser() iria à rede a cada clique do menu.
    const { data, error } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (error || !user) throw redirect({ to: "/auth" });
    if (user.user_metadata?.["must_change_password"]) {
      throw redirect({ to: "/trocar-senha" });
    }
    return { user };
  },
  component: () => (
    <EmissorProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </EmissorProvider>
  ),
});
