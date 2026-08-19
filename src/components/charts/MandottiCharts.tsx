import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";
import {
  CHART_SERIES,
  formatAxisCompact,
  TOOLTIP_STYLE,
  tooltipBRL,
  tooltipBRLWithShare,
  withShare,
  type ChartSlice,
} from "@/lib/chart-utils";
import { formatBRL } from "@/lib/format";

type RankedBarListProps = {
  items: ChartSlice[];
  className?: string;
  emptyLabel?: string;
};

/** Lista ranqueada com barras horizontais — ideal para bancos / categorias */
export function RankedBarList({
  items,
  className,
  emptyLabel = "Sem dados",
}: RankedBarListProps) {
  const sorted = withShare([...items].sort((a, b) => b.value - a.value));
  const max = sorted[0]?.value ?? 0;

  if (!sorted.length) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">{emptyLabel}</p>
    );
  }

  return (
    <ul className={cn("space-y-4", className)}>
      {sorted.map((item, index) => {
        const color = item.color ?? CHART_SERIES[index % CHART_SERIES.length];
        const widthPct = max > 0 ? (item.value / max) * 100 : 0;
        return (
          <li key={item.label}>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2.5 text-sm font-medium">
                <span className="grid size-6 shrink-0 place-items-center rounded-md bg-surface-soft text-[11px] font-bold text-muted-foreground">
                  {index + 1}
                </span>
                <span className="truncate">{item.label}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-mono-nums text-sm font-bold">{formatBRL(item.value)}</span>
                <span className="text-[11px] text-muted-foreground">{item.shareLabel}</span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-soft">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${widthPct}%`, background: color }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

type DonutDistributionProps = {
  items: ChartSlice[];
  className?: string;
  centerLabel?: string;
  emptyLabel?: string;
};

/** Donut com total central e legenda lateral interativa */
export function DonutDistribution({
  items,
  className,
  centerLabel = "Total",
  emptyLabel = "Sem dados",
}: DonutDistributionProps) {
  const slices = withShare(items.filter((i) => i.value > 0));
  const total = slices.reduce((acc, s) => acc + s.value, 0);

  if (!slices.length) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">{emptyLabel}</p>
    );
  }

  return (
    <div className={cn("grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]", className)}>
      <div className="relative mx-auto aspect-square w-full max-w-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={3}
              stroke="var(--card)"
              strokeWidth={2}
              cursor="pointer"
            >
              {slices.map((entry, i) => (
                <Cell key={entry.label} fill={entry.color ?? CHART_SERIES[i % CHART_SERIES.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={tooltipBRLWithShare}
              contentStyle={TOOLTIP_STYLE}
              itemStyle={{ color: "var(--foreground)" }}
            />
            <Label
              content={({ viewBox }) => {
                if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
                const { cx, cy } = viewBox as { cx: number; cy: number };
                return (
                  <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan x={cx} y={cy - 6} className="fill-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                      {centerLabel}
                    </tspan>
                    <tspan x={cx} y={cy + 14} className="fill-foreground text-[13px] font-bold">
                      {formatAxisCompact(total)}
                    </tspan>
                  </text>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-2" aria-label="Legenda">
        {slices.map((item, i) => {
          const color = item.color ?? CHART_SERIES[i % CHART_SERIES.length];
          return (
            <li
              key={item.label}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-surface-soft/80 px-3 py-2.5 transition-colors hover:border-primary/25 hover:bg-surface-soft"
            >
              <span className="inline-flex min-w-0 items-center gap-2 text-sm font-medium">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: color }} />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-mono-nums text-sm font-bold">{formatBRL(item.value)}</span>
                <span className="text-[11px] text-muted-foreground">{item.shareLabel}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type HorizontalBarChartProps = {
  items: ChartSlice[];
  height?: number;
  dataKey?: string;
  labelKey?: string;
  emptyLabel?: string;
};

/** Barras horizontais ordenadas — rótulos legíveis à esquerda */
export function HorizontalBarChart({
  items,
  height = 280,
  emptyLabel = "Sem dados",
}: HorizontalBarChartProps) {
  const data = [...items]
    .sort((a, b) => b.value - a.value)
    .map((item, i) => ({
      label: item.label,
      value: item.value,
      fill: item.color ?? CHART_SERIES[i % CHART_SERIES.length],
    }));

  if (!data.length) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">{emptyLabel}</p>
    );
  }

  const chartHeight = Math.max(height, data.length * 52 + 40);

  return (
    <div style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
          barCategoryGap="28%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickFormatter={formatAxisCompact}
          />
          <YAxis
            type="category"
            dataKey="label"
            tickLine={false}
            axisLine={false}
            width={128}
            tick={{ fill: "var(--foreground)", fontSize: 12, fontWeight: 500 }}
          />
          <Tooltip
            formatter={tooltipBRL}
            cursor={{ fill: "var(--surface-soft)" }}
            contentStyle={TOOLTIP_STYLE}
            labelStyle={{ fontWeight: 600, marginBottom: 4 }}
          />
          <Bar dataKey="value" radius={[0, 8, 8, 0]} maxBarSize={28}>
            {data.map((entry) => (
              <Cell key={entry.label} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

type TimelineBarChartProps = {
  items: { label: string; value: number }[];
  height?: number;
  color?: string;
  emptyLabel?: string;
};

/** Cronograma / evolução temporal com barras verticais */
export function TimelineBarChart({
  items,
  height = 260,
  color = "var(--chart-2)",
  emptyLabel = "Sem dados",
}: TimelineBarChartProps) {
  const data = items.filter((i) => i.value >= 0);

  if (!data.some((d) => d.value > 0)) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">{emptyLabel}</p>
    );
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }} barCategoryGap="22%">
          <defs>
            <linearGradient id="timelineBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.95} />
              <stop offset="100%" stopColor={color} stopOpacity={0.45} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            interval={0}
            angle={-18}
            textAnchor="end"
            height={52}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickFormatter={formatAxisCompact}
            width={48}
          />
          <Tooltip
            formatter={tooltipBRL}
            cursor={{ fill: "var(--surface-soft)" }}
            contentStyle={TOOLTIP_STYLE}
          />
          <Bar dataKey="value" fill="url(#timelineBarGrad)" radius={[8, 8, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

type CompositionDonutProps = {
  items: ChartSlice[];
  total?: number;
  emptyLabel?: string;
};

/** Composição patrimonial — donut + legenda (dashboard / patrimônio) */
export function CompositionDonut({ items, total, emptyLabel = "Sem dados" }: CompositionDonutProps) {
  const slices = withShare(items.filter((i) => i.value > 0));
  const computedTotal = total ?? slices.reduce((acc, s) => acc + s.value, 0);

  if (!slices.length) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">{emptyLabel}</p>
    );
  }

  return (
    <div className="grid items-center gap-6 lg:grid-cols-2">
      <div className="relative mx-auto aspect-square w-full max-w-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={2}
              stroke="var(--card)"
              strokeWidth={2}
              cursor="pointer"
            >
              {slices.map((entry, i) => (
                <Cell key={entry.label} fill={entry.color ?? CHART_SERIES[i % CHART_SERIES.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={tooltipBRLWithShare}
              contentStyle={TOOLTIP_STYLE}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-2">
        {slices.map((item, i) => {
          const color = item.color ?? CHART_SERIES[i % CHART_SERIES.length];
          const pct =
            computedTotal > 0 ? ((item.value / computedTotal) * 100).toFixed(1) : "0";
          return (
            <li
              key={item.label}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-surface-soft px-3 py-2.5"
            >
              <span className="inline-flex min-w-0 items-center gap-2 text-sm font-medium">
                <span className="size-2.5 shrink-0 rounded-sm" style={{ background: color }} />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-mono-nums text-sm font-bold">{formatBRL(item.value)}</span>
                <span className="text-[11px] text-muted-foreground">{pct}%</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
