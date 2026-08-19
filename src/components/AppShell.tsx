import { Link, useRouterState } from "@tanstack/react-router";
import {
  Briefcase,
  Building2,
  Calculator,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Handshake,
  Home,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  PenLine,
  Scale,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  Sprout,
  Sun,
  Tractor,
  UserCircle,
  Users,
  Wallet,
  Wheat,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmissorSelector } from "@/components/EmissorSelector";
import { MandottiLogo } from "@/components/MandottiLogo";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { usePerfil, useSession } from "@/hooks/useAuth";
import { useTheme } from "@/lib/theme-context";

export const NAV = [
  {
    group: "Visão geral",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/patrimonio", label: "Patrimônio", icon: Home },
    ],
  },
  {
    group: "Operação",
    items: [
      { to: "/fazendas", label: "Fazendas & Áreas", icon: Sprout },
      { to: "/producao", label: "Produção & Safras", icon: Wheat },
      { to: "/maquinario", label: "Maquinário", icon: Tractor },
    ],
  },
  {
    group: "Financeiro",
    items: [
      { to: "/financeiro", label: "Painel financeiro", icon: Wallet },
      { to: "/financeiro/xml", label: "Importação XML", icon: FileSpreadsheet },
      { to: "/financeiro/conciliacao", label: "Conciliação", icon: Landmark },
      { to: "/passivos", label: "Passivos · SCR", icon: Scale },
    ],
  },
  {
    group: "Fiscal",
    items: [
      { to: "/notas-fiscais", label: "Notas fiscais", icon: ScrollText },
      { to: "/clientes", label: "Clientes & Compradores", icon: UserCircle },
      { to: "/contratos", label: "Contratos · Tradings", icon: Handshake },
    ],
  },
  {
    group: "Documentos",
    items: [
      { to: "/documentos", label: "Biblioteca", icon: FolderOpen },
      { to: "/assinaturas", label: "Assinatura digital", icon: PenLine },
    ],
  },
  {
    group: "Configurações",
    items: [
      { to: "/emissores", label: "Emissores", icon: Building2 },
      { to: "/certificados", label: "Certificados", icon: ShieldCheck },
      { to: "/usuarios", label: "Usuários & Acessos", icon: Users },
      { to: "/configuracoes", label: "Parâmetros", icon: Settings },
    ],
  },
] as const;

/** Rotas visíveis no contexto Contabilidade (HRM) */
export const NAV_CONTABILIDADE = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/financeiro", label: "Painel financeiro", icon: Wallet },
  { to: "/financeiro/xml", label: "Importação XML", icon: FileSpreadsheet },
  { to: "/financeiro/conciliacao", label: "Conciliação", icon: Landmark },
  { to: "/passivos", label: "Passivos · SCR", icon: Scale },
  { to: "/notas-fiscais", label: "Notas fiscais", icon: ScrollText },
  { to: "/contabilidade/extratos", label: "Extratos bancários", icon: Landmark },
  { to: "/contabilidade/relatorios", label: "Relatórios mensais", icon: FileSpreadsheet },
  { to: "/contabilidade/documentos", label: "Documentos fiscais", icon: FileText },
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

const SIDEBAR_KEY = "mandotti.sidebar";

/** Recolhida por padrão; a preferência do usuário sobrescreve nas próximas visitas. */
function colapsoInicial() {
  try {
    return localStorage.getItem(SIDEBAR_KEY) !== "expanded";
  } catch {
    return true;
  }
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  // A rota autenticada é client-only (ssr: false), então ler localStorage no
  // inicializador não causa divergência de hidratação.
  const [colapsada, setColapsada] = useState(colapsoInicial);
  const [ctx, setCtx] = useState<"gestao" | "contabilidade">("gestao");
  const { user } = useSession();
  const { perfil, pode } = usePerfil(user);
  const { theme, toggleTheme } = useTheme();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const navVisivel =
    ctx === "contabilidade"
      ? [
          {
            group: "Contabilidade",
            items: NAV_CONTABILIDADE.filter((item) => pode(item.to, "ver")),
          },
        ].filter((section) => section.items.length > 0)
      : NAV.map((section) => ({
          ...section,
          items: section.items.filter((item) => pode(item.to, "ver")),
        })).filter((section) => section.items.length > 0);

  const grupoComRotaAtiva = useMemo(
    () =>
      navVisivel.find((section) =>
        section.items.some((item) => pathname.startsWith(item.to)),
      )?.group,
    [navVisivel, pathname],
  );

  const [gruposAbertos, setGruposAbertos] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!grupoComRotaAtiva) return;
    setGruposAbertos((prev) => {
      if (prev.has(grupoComRotaAtiva)) return prev;
      const next = new Set(prev);
      next.add(grupoComRotaAtiva);
      return next;
    });
  }, [grupoComRotaAtiva]);

  const toggleGrupo = (group: string) => {
    setGruposAbertos((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const soRail = colapsada ? "lg:hidden" : undefined;

  const renderNavItem = (
    item: { to: string; label: string; icon: typeof LayoutDashboard },
    rail: boolean,
  ) => {
    const active = pathname.startsWith(item.to);
    const link = (
      <Link
        to={item.to}
        onClick={() => setOpen(false)}
        className={cn(
          "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
          active
            ? "bg-surface-soft font-semibold text-primary"
            : "text-sidebar-foreground/75 hover:bg-surface-soft hover:text-foreground",
          rail && "lg:justify-center lg:gap-0 lg:px-0",
        )}
      >
        {active ? (
          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
        ) : null}
        <item.icon className={cn("size-4 shrink-0", active ? "opacity-100" : "opacity-60")} />
        <span className={cn("truncate", soRail)}>{item.label}</span>
      </Link>
    );

    return (
      <li key={item.to}>
        {rail ? (
          <Tooltip>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        ) : (
          link
        )}
      </li>
    );
  };

  const sair = async () => {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
    window.location.href = "/auth";
  };

  const definirColapso = (valor: boolean) => {
    setColapsada(valor);
    try {
      localStorage.setItem(SIDEBAR_KEY, valor ? "collapsed" : "expanded");
    } catch {
      /* preferência é opcional */
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen bg-background">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex w-[272px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[transform,width] duration-300 lg:static lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full",
            colapsada ? "lg:w-[76px]" : "lg:w-[272px]",
          )}
        >
          <div
            className="h-[3px] w-full"
            style={{
              background:
                "linear-gradient(90deg, #2E6636 0%, #7FA832 30%, #C99012 60%, #B5541C 85%, #6E5537 100%)",
            }}
          />

          <div
            className={cn(
              "flex items-center gap-3 border-b border-sidebar-border px-4 py-4",
              colapsada && "lg:justify-center lg:px-2",
            )}
          >
            {/* Recolhida, a própria marca é o gatilho para expandir */}
            <button
              type="button"
              onClick={() => definirColapso(false)}
              disabled={!colapsada}
              aria-label="Expandir menu"
              className="grid size-11 shrink-0 place-items-center rounded-full bg-white ring-1 ring-black/5 transition-transform disabled:cursor-default enabled:hover:scale-105"
            >
              <MandottiLogo className="size-8" />
            </button>
            <div className={cn("min-w-0 leading-tight", soRail)}>
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

          <div
            className={cn(
              "mx-3 mt-4 flex rounded-xl border border-primary/10 bg-surface-soft p-1",
              soRail,
            )}
          >
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

          {/* Recolhida, o seletor de contexto vira um botão que alterna entre os dois */}
          {colapsada ? (
            <div className="mx-2 mt-4 hidden justify-center lg:flex">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setCtx(ctx === "gestao" ? "contabilidade" : "gestao")}
                    className="grid size-10 place-items-center rounded-xl border border-primary/10 bg-surface-soft text-primary transition-colors hover:bg-card"
                    aria-label={`Contexto: ${ctx === "gestao" ? "Gestão" : "Contabilidade"}. Alternar.`}
                  >
                    {ctx === "gestao" ? (
                      <Briefcase className="size-4" />
                    ) : (
                      <Calculator className="size-4" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {ctx === "gestao" ? "Gestão" : "Contabilidade"} · alternar
                </TooltipContent>
              </Tooltip>
            </div>
          ) : null}

          <nav
            className={cn(
              "mt-3 flex-1 space-y-2 overflow-y-auto overflow-x-hidden px-3 pb-4",
              colapsada && "lg:px-2",
            )}
          >
            {navVisivel.map((section) => {
              const aberto = gruposAbertos.has(section.group);

              return (
                <div key={section.group}>
                  {/* Desktop recolhido: só ícones, sem agrupamento */}
                  {colapsada ? (
                    <div className="hidden lg:block">
                      <div className="mx-2 mb-2 h-px bg-sidebar-border" />
                      <ul className="space-y-0.5">
                        {section.items.map((item) => renderNavItem(item, true))}
                      </ul>
                    </div>
                  ) : null}

                  {/* Mobile + desktop expandido: grupos colapsáveis */}
                  <div className={cn("space-y-0.5", colapsada && "lg:hidden")}>
                    <button
                      type="button"
                      onClick={() => toggleGrupo(section.group)}
                      aria-expanded={aberto}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-[11px] font-bold uppercase tracking-[0.12em] transition-colors",
                        aberto
                          ? "bg-surface-soft text-primary"
                          : "text-muted-foreground hover:bg-surface-soft/70 hover:text-foreground",
                      )}
                    >
                      <span className="truncate">{section.group}</span>
                      <ChevronDown
                        className={cn(
                          "size-3.5 shrink-0 opacity-70 transition-transform duration-200",
                          aberto ? "rotate-0" : "-rotate-90",
                        )}
                      />
                    </button>
                    {aberto ? (
                      <ul className="space-y-0.5 pb-1 pl-1">
                        {section.items.map((item) => renderNavItem(item, false))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </nav>

          <div
            className={cn(
              "mx-3 mb-4 mt-3 flex items-center gap-3 rounded-2xl border border-border/80 bg-card p-3 shadow-xs",
              colapsada && "lg:mx-2 lg:justify-center lg:p-2",
            )}
          >
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/12 text-xs font-bold text-primary">
              {initials(user?.email)}
            </div>
            <div className={cn("min-w-0 flex-1", soRail)}>
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

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden lg:inline-flex"
                  onClick={() => definirColapso(!colapsada)}
                  aria-label={colapsada ? "Expandir menu" : "Recolher menu"}
                  aria-expanded={!colapsada}
                >
                  {colapsada ? (
                    <PanelLeftOpen className="size-5" />
                  ) : (
                    <PanelLeftClose className="size-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {colapsada ? "Expandir menu" : "Recolher menu"}
              </TooltipContent>
            </Tooltip>

            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-white ring-1 ring-black/5 lg:hidden">
              <MandottiLogo className="size-7" />
            </div>

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

          {/* Fluido de propósito: o conteúdo acompanha a largura da tela em vez de
            ficar preso a uma coluna central com sobra nas laterais. */}
          <main className="w-full flex-1 px-4 py-6 lg:px-8 lg:py-8 2xl:px-10">{children}</main>
        </div>
      </div>
    </TooltipProvider>
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
