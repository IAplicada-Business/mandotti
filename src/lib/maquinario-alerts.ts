/** Limiar: manutenção acumulada > X% do valor ou > depreciação anual → avaliar troca */
export const ALERTA_TROCA_PCT_VALOR = 0.12;

export type StatusManutencao = "saudavel" | "atencao" | "avaliar_troca";

export function depreciacaoAnual(
  valorAquisicao: number | null | undefined,
  pct: number | null | undefined,
): number {
  if (!valorAquisicao || valorAquisicao <= 0) return 0;
  const taxa = pct ?? 10;
  return valorAquisicao * (taxa / 100);
}

export function statusManutencao(
  valorAquisicao: number | null | undefined,
  custoManutencao: number | null | undefined,
  depreciacaoPct: number | null | undefined,
): StatusManutencao {
  if (!valorAquisicao || valorAquisicao <= 0) return "saudavel";
  const manut = custoManutencao ?? 0;
  if (manut <= 0) return "saudavel";

  const depAnual = depreciacaoAnual(valorAquisicao, depreciacaoPct);
  const limiarValor = valorAquisicao * ALERTA_TROCA_PCT_VALOR;

  if (manut >= limiarValor || (depAnual > 0 && manut >= depAnual)) return "avaliar_troca";
  if (manut >= limiarValor * 0.6 || (depAnual > 0 && manut >= depAnual * 0.7)) return "atencao";
  return "saudavel";
}

export const STATUS_MANUTENCAO_LABEL: Record<StatusManutencao, string> = {
  saudavel: "Saudável",
  atencao: "Atenção",
  avaliar_troca: "Avaliar troca",
};
