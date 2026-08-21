import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Briefcase,
  Calculator,
  ChevronDown,
  CircleHelp,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  type LucideIcon,
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
import { BuscaGlobal } from "@/components/BuscaGlobal";
import { MandottiLogo } from "@/components/MandottiLogo";
import { NAV, NAV_CONTABILIDADE } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { usePerfil, useSession } from "@/hooks/useAuth";

export { NAV, NAV_CONTABILIDADE } from "@/lib/nav";

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
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isNavigating = useRouterState({ select: (s) => s.status === "pending" });

  const podeAlternarContexto = perfil === "admin";
  const ctxEfetivo: "gestao" | "contabilidade" =
    perfil === "contabilidade" ? "contabilidade" : ctx;

  useEffect(() => {
    if (perfil === "contabilidade") {
      setCtx("contabilidade");
      if (!pathname.startsWith("/contabilidade")) {
        navigate({ to: "/contabilidade", replace: true });
      }
    }
  }, [perfil, pathname, navigate]);

  const navVisivel =
    ctxEfetivo === "contabilidade"
      ? [
          {
            group: "Contabilidade",
            icon: Calculator,
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
        section.items.some(
          (item) => pathname === item.to || pathname.startsWith(`${item.to}/`),
        ),
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

  const itemAtivo = (to: string) =>
    pathname === to || (to !== "/" && pathname.startsWith(`${to}/`));

  const renderRailGroup = (section: (typeof navVisivel)[number]) => {
    const ativo = section.group === grupoComRotaAtiva;
    const Icon = section.icon;
    return (
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={section.group}
                className={cn(
                  "grid size-11 place-items-center rounded-2xl transition-colors",
                  ativo
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-surface-soft text-primary hover:bg-card",
                )}
              >
                <Icon className="size-4" />
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">{section.group}</TooltipContent>
        </Tooltip>
        <DropdownMenuContent side="right" align="start" sideOffset={12} className="min-w-[13.5rem]">
          <DropdownMenuLabel>{section.group}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {section.items.map((item) => {
            const active = itemAtivo(item.to);
            return (
              <DropdownMenuItem key={item.to} asChild>
                <Link
                  to={item.to}
                  preload="intent"
                  onClick={() => setOpen(false)}
                  className={cn("flex cursor-pointer items-center gap-2", active && "bg-surface-soft font-semibold")}
                >
                  <item.icon className="size-4 text-primary" />
                  {item.label}
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderNavItem = (
    item: { to: string; label: string; icon: LucideIcon },
    rail: boolean,
  ) => {
    const active = itemAtivo(item.to);
    const link = (
      <Link
        to={item.to}
        preload="intent"
        onClick={() => setOpen(false)}
        className={cn(
          "flex items-center gap-3 rounded-2xl px-2.5 py-2 text-sm font-medium transition-all",
          active
            ? "bg-primary text-primary-foreground shadow-xs"
            : "text-muted-foreground hover:bg-surface-soft hover:text-foreground",
          rail && "lg:justify-center lg:gap-0 lg:px-1.5 lg:py-2",
        )}
      >
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-xl",
            active ? "bg-white/15" : "bg-surface-soft text-primary",
          )}
        >
          <item.icon className="size-4" />
        </span>
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
      <div className="flex min-h-dvh bg-background">
        <aside
          className={cn(
            "no-print fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col bg-sidebar text-sidebar-foreground shadow-md transition-[transform,width,border-radius] duration-300 lg:sticky lg:top-3 lg:m-3 lg:h-[calc(100dvh-1.5rem)] lg:translate-x-0 lg:rounded-[1.75rem]",
            open ? "translate-x-0" : "-translate-x-full",
            colapsada ? "lg:w-[88px]" : "lg:w-[280px]",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-3 px-4 py-5",
              colapsada && "lg:justify-center lg:px-2",
            )}
          >
            {/* Recolhida, a própria marca é o gatilho para expandir */}
            <button
              type="button"
              onClick={() => definirColapso(false)}
              disabled={!colapsada}
              aria-label="Expandir menu"
              className="grid size-11 shrink-0 place-items-center rounded-2xl bg-surface-soft transition-transform disabled:cursor-default enabled:hover:scale-105"
            >
              <MandottiLogo className="size-8" />
            </button>
            <div className={cn("min-w-0 leading-tight", soRail)}>
              <p className="truncate text-sm font-extrabold tracking-wide">GRUPO MANDOTTI</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {ctxEfetivo === "contabilidade" ? "Contabilidade" : "Gestão Agrícola"}
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

          {podeAlternarContexto ? (
            <div
              className={cn(
                "mx-3 mt-2 flex rounded-full bg-surface-soft p-1",
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
                    "flex-1 rounded-full px-3 py-2 text-xs font-semibold transition-all",
                    ctx === key
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}

          {/* Recolhida: admin alterna contexto; contabilidade não vê este controle */}
          {podeAlternarContexto && colapsada ? (
            <div className="mx-2 mt-4 hidden justify-center lg:flex">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setCtx(ctx === "gestao" ? "contabilidade" : "gestao")}
                    className="grid size-10 place-items-center rounded-2xl bg-surface-soft text-primary transition-colors hover:bg-card"
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
                  {/* Desktop recolhido: só o ícone do grupo pai */}
                  {colapsada ? (
                    <div className="hidden justify-center py-0.5 lg:flex">{renderRailGroup(section)}</div>
                  ) : null}

                  {/* Mobile + desktop expandido: grupos colapsáveis */}
                  <div className={cn("space-y-0.5", colapsada && "lg:hidden")}>
                    <button
                      type="button"
                      onClick={() => toggleGrupo(section.group)}
                      aria-expanded={aberto}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-2xl px-3 py-2 text-left text-[11px] font-semibold tracking-[0.08em] text-muted-foreground transition-colors hover:bg-surface-soft hover:text-foreground",
                        aberto && "text-foreground",
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

          <div className={cn("mx-3 mb-4 mt-3", colapsada && "lg:mx-2 lg:flex lg:justify-center")}>
            {colapsada ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="hidden rounded-full lg:flex"
                    onClick={sair}
                    aria-label="Sair"
                  >
                    <LogOut className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Sair</TooltipContent>
              </Tooltip>
            ) : null}
            <Button
              variant="outline"
              className={cn("w-full justify-start gap-2 rounded-full", colapsada && "lg:hidden")}
              onClick={sair}
            >
              <LogOut className="size-4" />
              Sair
            </Button>
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
          <header className="no-print sticky top-0 z-20 flex h-16 items-center gap-2 bg-background/90 px-3 backdrop-blur-xl sm:h-[72px] sm:gap-3 sm:px-5 lg:px-6">
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

            <div className="grid size-9 shrink-0 place-items-center rounded-2xl bg-surface-soft lg:hidden">
              <MandottiLogo className="size-7" />
            </div>

            <BuscaGlobal />

            <div className="min-w-0 flex-1">
              <EmissorSelector />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 rounded-full pl-1.5 pr-3">
                  <span className="grid size-7 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    {initials(user?.email)}
                  </span>
                  <span className="hidden max-w-[10rem] truncate text-sm sm:inline">
                    {user?.email?.split("@")[0] ?? "Conta"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl">
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
          <main className="relative w-full flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
            {isNavigating ? (
              <div
                className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-primary/10"
                aria-hidden
              >
                <div className="h-full w-full animate-pulse bg-primary" />
              </div>
            ) : null}
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
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
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-7 sm:gap-4">
      <div className="flex min-w-0 items-center gap-2">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {description ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Sobre: ${title}`}
              >
                <CircleHelp className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-sm text-left font-normal leading-relaxed">
              {description}
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>
      {action}
    </div>
  );
}
