import { Link, useRouterState } from "@tanstack/react-router";
import {
  Building2,
  ChevronDown,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ScrollText,
  Settings,
  ShieldCheck,
  Sprout,
  Users,
  Warehouse,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEmissor } from "@/lib/emissor-context";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useRoles, useSession } from "@/hooks/useAuth";

const NAV = [
  { group: "Visão geral", items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  {
    group: "Cadastros",
    items: [
      { to: "/emissores", label: "Emissores", icon: Building2 },
      { to: "/fazendas", label: "Fazendas", icon: Sprout },
      { to: "/certificados", label: "Certificados", icon: ShieldCheck },
      { to: "/produtos", label: "Produtos", icon: Package },
    ],
  },
  {
    group: "Operação",
    items: [
      { to: "/notas-fiscais", label: "Notas fiscais", icon: ScrollText },
      { to: "/estoque", label: "Estoque", icon: Warehouse },
      { to: "/relatorios", label: "Relatórios", icon: FileSpreadsheet },
    ],
  },
  {
    group: "Administração",
    items: [
      { to: "/usuarios", label: "Usuários", icon: Users },
      { to: "/configuracoes", label: "Configurações", icon: Settings },
    ],
  },
] as const;

function EmissorSelector() {
  const { emissores, emissorId, setEmissorId, loading } = useEmissor();

  if (loading) {
    return <div className="h-9 w-64 animate-pulse rounded-md bg-muted" />;
  }

  if (!emissores.length) {
    return (
      <Link to="/emissores" className="text-sm text-muted-foreground underline underline-offset-4">
        Nenhum emissor cadastrado — cadastrar
      </Link>
    );
  }

  return (
    <Select value={emissorId ?? ""} onValueChange={setEmissorId}>
      <SelectTrigger className="w-[18rem]" aria-label="Emissor ativo">
        <SelectValue placeholder="Selecione o emissor" />
      </SelectTrigger>
      <SelectContent>
        {emissores.map((e) => (
          <SelectItem key={e.id} value={e.id}>
            {e.nome_fantasia || e.razao_social}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user } = useSession();
  const { roles } = useRoles(user);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const sair = async () => {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
    window.location.href = "/auth";
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
          <Sprout className="size-5 text-sidebar-primary" />
          <div className="leading-tight">
            <p className="font-display text-sm font-semibold">Grupo Mandotti</p>
            <p className="text-[11px] text-sidebar-foreground/60">Plataforma de gestão</p>
          </div>
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {NAV.map((section) => (
            <div key={section.group}>
              <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                {section.group}
              </p>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const active = pathname.startsWith(item.to);
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60",
                        )}
                      >
                        <item.icon className="size-4" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {open ? (
        <div
          className="fixed inset-0 z-30 bg-foreground/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menu"
          >
            <Menu className="size-5" />
          </Button>
          <EmissorSelector />
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <span className="max-w-[12rem] truncate text-sm">{user?.email ?? "Conta"}</span>
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium">{user?.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {roles.length ? roles.join(", ") : "sem papel definido"}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={sair}>
                  <LogOut className="mr-2 size-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
