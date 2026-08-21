import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  FileText,
  FolderOpen,
  Home,
  Search,
  Settings,
  Tractor,
  UserCircle,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { ABAS_PARAMETROS, NAV, podeVerItemNav } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { usePerfil, useSession } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEmissor } from "@/lib/emissor-context";
import { cn } from "@/lib/utils";

type Resultado = {
  id: string;
  grupo: string;
  titulo: string;
  detalhe?: string | undefined;
  to: string;
  search?: { aba: string } | undefined;
  icon: LucideIcon;
};

function normalizar(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function coincide(termo: string, ...campos: (string | null | undefined)[]) {
  return campos.some((c) => c && normalizar(c).includes(termo));
}

export function BuscaGlobal({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { user } = useSession();
  const { pode } = usePerfil(user);
  const { emissores } = useEmissor();
  const [termo, setTermo] = useState("");
  const [aberto, setAberto] = useState(false);
  const [mobileAberto, setMobileAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data } = useQuery({
    queryKey: ["busca-global"],
    enabled: aberto || mobileAberto,
    staleTime: 60_000,
    queryFn: async () => {
      const [fazendas, notas, clientes, maquinas, docs] = await Promise.all([
        supabase
          .from("fazendas")
          .select("id, nome, municipio, codigo")
          .is("deleted_at", null)
          .order("nome"),
        supabase
          .from("notas_fiscais")
          .select("id, numero, serie, chave_acesso")
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase.from("grupo_contatos").select("id, nome, cidade, categoria").order("nome").limit(200),
        supabase
          .from("maquinarios")
          .select("id, nome, marca, modelo")
          .is("deleted_at", null)
          .order("nome")
          .limit(200),
        supabase
          .from("documentos")
          .select("id, titulo, nome_arquivo, tipo")
          .is("deleted_at", null)
          .order("titulo")
          .limit(200),
      ]);
      return {
        fazendas: fazendas.data ?? [],
        notas: notas.data ?? [],
        clientes: clientes.data ?? [],
        maquinas: maquinas.data ?? [],
        docs: docs.data ?? [],
      };
    },
  });

  const resultados = useMemo(() => {
    const q = normalizar(termo.trim());
    const paginas: Resultado[] = [];
    for (const g of NAV) {
      for (const item of g.items) {
        if (!podeVerItemNav(pode, item.to)) continue;
        if (q && !coincide(q, item.label, item.to)) continue;
        paginas.push({
          id: `pagina-${item.to}`,
          grupo: "Páginas",
          titulo: item.label,
          to: item.to,
          icon: item.icon,
        });
        if (paginas.length >= 6) break;
      }
      if (paginas.length >= 6) break;
    }
    if (paginas.length < 6) {
      for (const aba of ABAS_PARAMETROS) {
        if (q && !coincide(q, aba.label)) continue;
        if (aba.id === "emissores" && !(pode("/emissores", "ver") || pode("/configuracoes", "ver"))) {
          continue;
        }
        if (
          aba.id === "certificados" &&
          !(pode("/certificados", "ver") || pode("/configuracoes", "ver"))
        ) {
          continue;
        }
        if (
          aba.id !== "emissores" &&
          aba.id !== "certificados" &&
          !pode("/configuracoes", "ver")
        ) {
          continue;
        }
        paginas.push({
          id: `param-${aba.id}`,
          grupo: "Parâmetros",
          titulo: aba.label,
          to: "/configuracoes",
          search: { aba: aba.id },
          icon: Settings,
        });
        if (paginas.length >= 6) break;
      }
    }

    if (!q) return paginas;

    const lista: Resultado[] = [...paginas];

    for (const e of emissores) {
      if (!coincide(q, e.nome_fantasia, e.razao_social, e.cnpj)) continue;
      lista.push({
        id: `emissor-${e.id}`,
        grupo: "Emissores",
        titulo: e.nome_fantasia || e.razao_social,
        detalhe: e.cnpj,
        to: "/configuracoes",
        search: { aba: "emissores" },
        icon: Building2,
      });
    }
    for (const f of data?.fazendas ?? []) {
      if (!coincide(q, f.nome, f.municipio, f.codigo)) continue;
      lista.push({
        id: `fazenda-${f.id}`,
        grupo: "Fazendas",
        titulo: f.nome,
        detalhe: [f.codigo, f.municipio].filter(Boolean).join(" · ") || undefined,
        to: "/fazendas",
        icon: Home,
      });
    }
    for (const n of data?.notas ?? []) {
      if (!coincide(q, n.numero, n.serie, n.chave_acesso)) continue;
      lista.push({
        id: `nota-${n.id}`,
        grupo: "Notas",
        titulo: n.numero ? `NF ${n.numero}${n.serie ? ` / ${n.serie}` : ""}` : "Nota fiscal",
        detalhe: n.chave_acesso ?? undefined,
        to: "/notas-fiscais",
        icon: FileText,
      });
    }
    for (const c of data?.clientes ?? []) {
      if (!coincide(q, c.nome, c.cidade, c.categoria)) continue;
      lista.push({
        id: `cliente-${c.id}`,
        grupo: "Clientes",
        titulo: c.nome,
        detalhe: c.cidade ?? undefined,
        to: "/clientes",
        icon: UserCircle,
      });
    }
    for (const m of data?.maquinas ?? []) {
      if (!coincide(q, m.nome, m.marca, m.modelo)) continue;
      lista.push({
        id: `maq-${m.id}`,
        grupo: "Maquinário",
        titulo: m.nome,
        detalhe: [m.marca, m.modelo].filter(Boolean).join(" · ") || undefined,
        to: "/maquinario",
        icon: Tractor,
      });
    }
    for (const d of data?.docs ?? []) {
      if (!coincide(q, d.titulo, d.nome_arquivo, d.tipo)) continue;
      lista.push({
        id: `doc-${d.id}`,
        grupo: "Documentos",
        titulo: d.titulo,
        detalhe: d.nome_arquivo ?? undefined,
        to: "/documentos",
        icon: FolderOpen,
      });
    }

    return lista.slice(0, 24);
  }, [termo, data, emissores, pode]);

  const ir = (item: Resultado) => {
    if (item.search) navigate({ to: item.to as never, search: item.search as never });
    else navigate({ to: item.to as never });
    setTermo("");
    setAberto(false);
    setMobileAberto(false);
  };

  useEffect(() => {
    const fora = (ev: MouseEvent) => {
      if (!caixa.current?.contains(ev.target as Node)) {
        setAberto(false);
        setMobileAberto(false);
      }
    };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, []);

  useEffect(() => {
    const atalho = (ev: KeyboardEvent) => {
      if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === "k") {
        ev.preventDefault();
        setAberto(true);
        setMobileAberto(true);
        window.setTimeout(() => inputRef.current?.focus(), 0);
      }
      if (ev.key === "Escape") {
        setAberto(false);
        setMobileAberto(false);
      }
    };
    window.addEventListener("keydown", atalho);
    return () => window.removeEventListener("keydown", atalho);
  }, []);

  const mostrarLista = aberto || mobileAberto;

  const campo = (
    <div className={cn("relative flex min-w-0 items-center gap-2", className)}>
      <Search className="pointer-events-none absolute left-4 size-4 shrink-0 text-muted-foreground" />
      <input
        ref={inputRef}
        type="text"
        value={termo}
        onChange={(e) => {
          setTermo(e.target.value);
          setAberto(true);
        }}
        onFocus={() => setAberto(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && resultados[0]) {
            e.preventDefault();
            ir(resultados[0]);
          }
        }}
        placeholder="Buscar fazendas, emissores, notas…"
        autoComplete="off"
        className="h-10 w-full rounded-full border-0 bg-surface-soft pl-10 pr-10 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
        aria-label="Buscar no sistema"
      />
      {termo ? (
        <button
          type="button"
          className="absolute right-3 text-muted-foreground hover:text-foreground"
          aria-label="Limpar busca"
          onClick={() => {
            setTermo("");
            inputRef.current?.focus();
          }}
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );

  const lista = mostrarLista ? (
    <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-[1.25rem] bg-card py-2 shadow-md">
      {resultados.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
          {termo.trim() ? "Nada encontrado." : "Digite o nome da fazenda, emissor ou nota."}
        </p>
      ) : (
        <ul className="max-h-[min(24rem,70vh)] overflow-y-auto">
          {resultados.map((item, i) => {
            const Icon = item.icon;
            const cabecalho = i === 0 || resultados[i - 1]?.grupo !== item.grupo;
            return (
              <li key={item.id}>
                {cabecalho ? (
                  <p className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {item.grupo}
                  </p>
                ) : null}
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-surface-soft"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => ir(item)}
                >
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{item.titulo}</span>
                    {item.detalhe ? (
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.detalhe}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  ) : null;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Buscar"
        onClick={() => {
          setMobileAberto(true);
          setAberto(true);
          window.setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        <Search className="size-5" />
      </Button>

      {mobileAberto ? (
        <button
          type="button"
          className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-[2px] lg:hidden"
          aria-label="Fechar busca"
          onClick={() => {
            setAberto(false);
            setMobileAberto(false);
          }}
        />
      ) : null}

      <div
        ref={caixa}
        className={cn(
          "relative hidden min-w-[220px] max-w-md flex-1 lg:block",
          mobileAberto &&
            "fixed inset-x-3 top-3 z-[60] block max-w-none lg:static lg:inset-auto lg:z-auto lg:max-w-md",
        )}
      >
        {campo}
        {lista}
      </div>
    </>
  );
}
