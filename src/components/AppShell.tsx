import { Link, useRouterState } from "@tanstack/react-router";
import {
  Building2,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  Sprout,
  Sun,
  Users,
  Warehouse,
  X,
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
import { EmissorSelector } from "@/components/EmissorSelector";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { usePerfil, useSession } from "@/hooks/useAuth";
import { useTheme } from "@/lib/theme-context";

export const NAV = [
  {
    group: "Visão geral",
    items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
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

const PERFIL_LABEL: Record<string, string> = {
  admin: "Admin",
  funcionario: "Funcionário",
  contabilidade: "Contabilidade",
};

function initials(email?: string | null) {
  if (!email) return "GM";
  return email.slice(0, 2).toUpperCase();
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [ctx, setCtx] = useState<"gestao" | "contabilidade">("gestao");
  const { user } = useSession();
  const { perfil, pode } = usePerfil(user);
  const { theme, toggleTheme } = useTheme();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const navVisivel = NAV.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (ctx === "contabilidade") {
        return (
          item.to === "/dashboard" ||
          item.to === "/notas-fiscais" ||
          item.to === "/relatorios" ||
          item.to === "/certificados"
        );
      }
      return pode(item.to, "ver");
    }),
  })).filter((section) => section.items.length > 0);

  const sair = async () => {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
    window.location.href = "/auth";
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[272px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div
          className="h-[3px] w-full"
          style={{
            background:
              "linear-gradient(90deg, #2E6636 0%, #7FA832 30%, #C99012 60%, #B5541C 85%, #6E5537 100%)",
          }}
        />

        <div className="flex items-center gap-3 border-b border-sidebar-border px-4 py-4">
          <div className="relative grid size-11 place-items-center rounded-full bg-card">
            <span
              className="absolute -inset-0.5 rounded-full"
              style={{
                background:
                  "conic-gradient(from 130deg, #2E6636, #7FA832, #C99012, #B5541C, #6E5537, #2E6636)",
                WebkitMask: "radial-gradient(circle, transparent 18px, #000 19.5px)",
                mask: "radial-gradient(circle, transparent 18px, #000 19.5px)",
              }}
            />
            <span className="relative z-10 text-sm font-extrabold text-primary">GM</span>
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-extrabold tracking-wide">GRUPO MANDOTTI</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Gestão Agrícola
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="mx-3 mt-4 flex rounded-xl border border-primary/10 bg-surface-soft p-1">
          {(
            [
              ["gestao", "Gestão"],
              ["contabilidade", "Contabilidade"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setCtx(key)}
              className={cn(
                "flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
                ctx === key
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <nav className="mt-3 flex-1 space-y-5 overflow-y-auto px-3 pb-4">
          {navVisivel.map((section) => (
            <div key={section.group}>
              <p className="px-2.5 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {section.group}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = pathname.startsWith(item.to);
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-surface-soft font-semibold text-primary"
                            : "text-sidebar-foreground/75 hover:bg-surface-soft hover:text-foreground",
                        )}
                      >
                        {active ? (
                          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                        ) : null}
                        <item.icon className={cn("size-4", active ? "opacity-100" : "opacity-60")} />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mx-3 mb-4 mt-3 flex items-center gap-3 rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
          <div className="grid size-10 place-items-center rounded-full bg-primary/12 text-xs font-bold text-primary">
            {initials(user?.email)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user?.email ?? "Conta"}</p>
            <p className="text-xs text-muted-foreground">
              {perfil ? PERFIL_LABEL[perfil] : "sem perfil"}
            </p>
          </div>
        </div>
      </aside>

      {open ? (
        <div
          className="fixed inset-0 z-30 bg-foreground/30 backdrop-blur-[2px] lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-[68px] items-center gap-3 border-b border-border/80 bg-card/85 px-4 backdrop-blur-md lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menu"
          >
            <Menu className="size-5" />
          </Button>

          <div className="hidden min-w-[220px] items-center gap-2 rounded-xl border border-border bg-surface-soft px-3 py-2 text-sm text-muted-foreground md:flex">
            <Search className="size-4 shrink-0 opacity-60" />
            <span className="truncate">Buscar fazendas, emissores, notas…</span>
          </div>

          <div className="min-w-0 flex-1">
            <EmissorSelector />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Tema claro" : "Tema escuro"}
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 rounded-full pl-1.5 pr-3">
                <span className="grid size-7 place-items-center rounded-full bg-primary/12 text-[11px] font-bold text-primary">
                  {initials(user?.email)}
                </span>
                <span className="hidden max-w-[10rem] truncate text-sm sm:inline">
                  {user?.email?.split("@")[0] ?? "Conta"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium">{user?.email}</p>
                <p className="text-xs text-muted-foreground">
                  {perfil ? PERFIL_LABEL[perfil] : "sem perfil definido"}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={sair}>
                <LogOut className="mr-2 size-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
  breadcrumb,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  breadcrumb?: string;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {breadcrumb ? (
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            {breadcrumb}
          </p>
        ) : null}
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{title}</h1>
        {description ? <p className="mt-1.5 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
