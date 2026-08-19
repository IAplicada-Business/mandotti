import { formatBRL } from "@/lib/format";

/** Paleta Mandotti para séries de gráficos */
export const CHART_SERIES = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

export function formatAxisCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return value.toLocaleString("pt-BR");
}

export function pctOf(value: number, total: number, digits = 1): string {
  if (total <= 0) return "0%";
  return `${((value / total) * 100).toFixed(digits)}%`;
}

export type ChartSlice = {
  label: string;
  value: number;
  color?: string;
};

export function withShare(items: ChartSlice[]): (ChartSlice & { share: number; shareLabel: string })[] {
  const total = items.reduce((acc, item) => acc + item.value, 0);
  return items.map((item) => ({
    ...item,
    share: total > 0 ? item.value / total : 0,
    shareLabel: pctOf(item.value, total),
  }));
}

export function tooltipBRL(value: unknown): [string, string] {
  const n = typeof value === "number" ? value : Number(value);
  return [formatBRL(Number.isFinite(n) ? n : 0), ""];
}

export function tooltipBRLWithShare(value: unknown, _name: string, item: { payload?: ChartSlice & { shareLabel?: string } }): string {
  const n = typeof value === "number" ? value : Number(value);
  const share = item.payload?.shareLabel;
  return share ? `${formatBRL(n)} · ${share}` : formatBRL(n);
}

/** Estilo padrão de tooltip Recharts */
export const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--card)",
  boxShadow: "var(--shadow-sm-token)",
  fontSize: 13,
} as const;
