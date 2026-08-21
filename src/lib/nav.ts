import {
  Calculator,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Handshake,
  Home,
  Landmark,
  LayoutDashboard,
  PenLine,
  Scale,
  ScrollText,
  Settings,
  Sprout,
  Tractor,
  UserCircle,
  Users,
  Wallet,
  Wheat,
} from "lucide-react";

export const NAV = [
  {
    group: "Visão geral",
    icon: LayoutDashboard,
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/patrimonio", label: "Patrimônio", icon: Home },
      { to: "/relatorios", label: "Relatórios", icon: FileSpreadsheet },
    ],
  },
  {
    group: "Operação",
    icon: Sprout,
    items: [
      { to: "/fazendas", label: "Fazendas & Áreas", icon: Sprout },
      { to: "/producao", label: "Produção & Safras", icon: Wheat },
      { to: "/maquinario", label: "Maquinário", icon: Tractor },
    ],
  },
  {
    group: "Financeiro",
    icon: Wallet,
    items: [
      { to: "/financeiro", label: "Painel financeiro", icon: Wallet },
      { to: "/conciliacao", label: "Conciliação", icon: Landmark },
      { to: "/passivos", label: "Passivos · SCR", icon: Scale },
    ],
  },
  {
    group: "Fiscal",
    icon: ScrollText,
    items: [
      { to: "/notas-fiscais", label: "Notas fiscais", icon: ScrollText },
      { to: "/importacao-xml", label: "Importação XML", icon: FileSpreadsheet },
      { to: "/clientes", label: "Clientes & Compradores", icon: UserCircle },
      { to: "/contratos", label: "Contratos · Tradings", icon: Handshake },
    ],
  },
  {
    group: "Documentos",
    icon: FolderOpen,
    items: [
      { to: "/documentos", label: "Biblioteca", icon: FolderOpen },
      { to: "/assinaturas", label: "Assinatura digital", icon: PenLine },
    ],
  },
  {
    group: "Configurações",
    icon: Settings,
    items: [
      { to: "/usuarios", label: "Usuários & Acessos", icon: Users },
      { to: "/configuracoes", label: "Parâmetros", icon: Settings },
    ],
  },
] as const;

export const ABAS_PARAMETROS = [
  { id: "emissores", label: "Emissores", rota: "/emissores" },
  { id: "certificados", label: "Certificados", rota: "/certificados" },
  { id: "filtros", label: "Filtros", rota: "/configuracoes" },
  { id: "automacoes", label: "Automações", rota: "/configuracoes" },
  { id: "dados", label: "Dados", rota: "/configuracoes" },
] as const;

export type AbaParametros = (typeof ABAS_PARAMETROS)[number]["id"];

/** Telas da matriz de acesso — inclui abas de Parâmetros que saíram da sidebar. */
export const ROTAS_ACESSO: { to: string; label: string }[] = [
  ...NAV.flatMap((g) => g.items.map((i) => ({ to: i.to as string, label: i.label as string }))),
  { to: "/emissores", label: "Emissores" },
  { to: "/certificados", label: "Certificados" },
];

export function podeVerItemNav(
  pode: (rota: string, acao: "ver" | "editar") => boolean,
  to: string,
) {
  if (to === "/configuracoes") {
    return pode("/configuracoes", "ver") || pode("/emissores", "ver") || pode("/certificados", "ver");
  }
  return pode(to, "ver");
}

export function abasParametrosVisiveis(pode: (rota: string, acao: "ver" | "editar") => boolean) {
  return ABAS_PARAMETROS.filter((aba) => {
    if (aba.id === "emissores") return pode("/emissores", "ver") || pode("/configuracoes", "ver");
    if (aba.id === "certificados") return pode("/certificados", "ver") || pode("/configuracoes", "ver");
    return pode("/configuracoes", "ver");
  });
}

export const NAV_CONTABILIDADE = [
  { to: "/contabilidade", label: "Dashboard", icon: LayoutDashboard },
  { to: "/contabilidade/financeiro", label: "Dados financeiros", icon: Wallet },
  { to: "/contabilidade/documentos", label: "Documentos fiscais", icon: FileText },
  { to: "/contabilidade/relatorios", label: "Relatórios", icon: FileSpreadsheet },
  { to: "/contabilidade/extratos", label: "Extratos bancários", icon: Landmark },
] as const;
