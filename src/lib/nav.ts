import {
  Building2,
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
  ShieldCheck,
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
      { to: "/emissores", label: "Emissores", icon: Building2 },
      { to: "/certificados", label: "Certificados", icon: ShieldCheck },
      { to: "/usuarios", label: "Usuários & Acessos", icon: Users },
      { to: "/configuracoes", label: "Parâmetros", icon: Settings },
    ],
  },
] as const;

export const NAV_CONTABILIDADE = [
  { to: "/contabilidade", label: "Dashboard", icon: LayoutDashboard },
  { to: "/contabilidade/financeiro", label: "Dados financeiros", icon: Wallet },
  { to: "/contabilidade/documentos", label: "Documentos fiscais", icon: FileText },
  { to: "/contabilidade/relatorios", label: "Relatórios", icon: FileSpreadsheet },
  { to: "/contabilidade/extratos", label: "Extratos bancários", icon: Landmark },
] as const;
