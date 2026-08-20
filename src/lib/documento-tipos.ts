export const TIPOS_DOCUMENTO = [
  { id: "ccir", label: "CCIR" },
  { id: "itr", label: "ITR" },
  { id: "arrendamento", label: "Arrendamento" },
  { id: "certidao", label: "Certidão" },
  { id: "seguro", label: "Seguro" },
  { id: "contrato", label: "Contrato" },
  { id: "outros", label: "Outros" },
] as const;

export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number]["id"];

export const TIPO_DOCUMENTO_LABEL: Record<string, string> = Object.fromEntries(
  TIPOS_DOCUMENTO.map((t) => [t.id, t.label]),
);

export function situacaoVencimento(vencimento: string | null, hoje = new Date()) {
  if (!vencimento) return "ok" as const;
  const data = new Date(`${vencimento}T00:00:00`);
  if (Number.isNaN(data.getTime())) return "ok" as const;
  const limite = new Date(hoje);
  limite.setHours(0, 0, 0, 0);
  const em60 = new Date(limite);
  em60.setDate(em60.getDate() + 60);
  if (data < limite) return "vencido" as const;
  if (data <= em60) return "a_vencer" as const;
  return "ok" as const;
}
