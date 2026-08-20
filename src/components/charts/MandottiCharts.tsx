import { useId } from "react";
import {
  Area,
  AreaChart,
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
import type { TooltipProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";

import { cn } from "@/lib/utils";
import {
  CHART_SERIES,
  formatAxisCompact,
  withShare,
  type ChartSlice,
} from "@/lib/chart-utils";
import { formatBRL } from "@/lib/format";

const AXIS_TICK = { fill: "var(--muted-foreground)", fontSize: 11, fontWeight: 500 } as const;

export function MandottiTooltip({
  active,
  payload,
  label,
}: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const first = payload[0];
  const share = (first?.payload as { shareLabel?: string } | undefined)?.shareLabel;
  const n = Number(first?.value);

  return (
    <div className="rounded-2xl bg-card px-3.5 py-2.5 shadow-md">
      {label ? (
        <p className="mb-0.5 text-xs font-medium text-muted-foreground">{String(label)}</p>
      ) : null}
      <p className="font-mono-nums text-sm font-bold text-foreground">
        {Number.isFinite(n) ? formatBRL(n) : "—"}
      </p>
      {share ? <p className="text-[11px] text-muted-foreground">{share}</p> : null}
    </div>
  );
}

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
    <ul className={cn("space-y-5", className)}>
      {sorted.map((item, index) => {
        const color = item.color ?? CHART_SERIES[index % CHART_SERIES.length];
        const widthPct = max > 0 ? (item.value / max) * 100 : 0;
        return (
          <li key={item.label}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2.5 text-sm font-medium">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  {index + 1}
                </span>
                <span className="truncate">{item.label}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-mono-nums text-sm font-bold">{formatBRL(item.value)}</span>
                <span className="text-[11px] text-muted-foreground">{item.shareLabel}</span>
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-surface-soft">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${widthPct}%`,
                  background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function DonutLegend({
  slices,
}: {
  slices: ReturnType<typeof withShare>;
}) {
  return (
    <ul className="space-y-2.5" aria-label="Legenda">
      {slices.map((item, i) => {
        const color = item.color ?? CHART_SERIES[i % CHART_SERIES.length];
        return (
          <li key={item.label} className="flex items-center justify-between gap-3">
            <span className="inline-flex min-w-0 items-center gap-2.5 text-sm font-medium">
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
  );
}

type DonutDistributionProps = {
  items: ChartSlice[];
  className?: string;
  centerLabel?: string;
  emptyLabel?: string;
};

/** Donut com total central e legenda lateral */
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
    <div className={cn("grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]", className)}>
      <div className="relative mx-auto aspect-square w-full max-w-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              innerRadius="64%"
              outerRadius="92%"
              paddingAngle={4}
              cornerRadius={8}
              stroke="transparent"
              cursor="pointer"
            >
              {slices.map((entry, i) => (
                <Cell key={entry.label} fill={entry.color ?? CHART_SERIES[i % CHART_SERIES.length]} />
              ))}
              <Label
                position="center"
                content={({ viewBox }) => {
                  if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
                  const { cx, cy } = viewBox as { cx: number; cy: number };
                  return (
                    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan
                        x={cx}
                        y={cy - 8}
                        className="fill-muted-foreground text-[10px] font-semibold uppercase tracking-wider"
                      >
                        {centerLabel}
                      </tspan>
                      <tspan x={cx} y={cy + 14} className="fill-foreground text-sm font-extrabold">
                        {formatAxisCompact(total)}
                      </tspan>
                    </text>
                  );
                }}
              />
            </Pie>
            <Tooltip content={<MandottiTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <DonutLegend slices={slices} />
    </div>
  );
}

type HorizontalBarChartProps = {
  items: ChartSlice[];
  height?: number;
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

  const chartHeight = Math.max(height, data.length * 56 + 32);

  return (
    <div style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
          barCategoryGap="32%"
        >
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
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
          <Tooltip cursor={{ fill: "var(--surface-soft)", radius: 12 }} content={<MandottiTooltip />} />
          <Bar dataKey="value" radius={[999, 999, 999, 999]} maxBarSize={18} background={{ fill: "var(--surface-soft)", radius: 999 }}>
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

/** Cronograma / evolução temporal com barras arredondadas */
export function TimelineBarChart({
  items,
  height = 260,
  color = "var(--chart-1)",
  emptyLabel = "Sem dados",
}: TimelineBarChartProps) {
  const data = items.filter((i) => i.value >= 0);
  const gradId = `tl-${useId().replace(/:/g, "")}`;

  if (!data.some((d) => d.value > 0)) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">{emptyLabel}</p>
    );
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 4 }} barCategoryGap="28%">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={1} />
              <stop offset="100%" stopColor={color} stopOpacity={0.35} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" vertical={false} strokeOpacity={0.7} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
            interval={0}
            angle={-16}
            textAnchor="end"
            height={52}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
            tickFormatter={formatAxisCompact}
            width={48}
          />
          <Tooltip cursor={{ fill: "var(--surface-soft)", radius: 16 }} content={<MandottiTooltip />} />
          <Bar dataKey="value" fill={`url(#${gradId})`} radius={[14, 14, 14, 14]} maxBarSize={42} />
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

/** Composição patrimonial — donut + legenda */
export function CompositionDonut({ items, total, emptyLabel = "Sem dados" }: CompositionDonutProps) {
  const slices = withShare(items.filter((i) => i.value > 0));
  const computedTotal = total ?? slices.reduce((acc, s) => acc + s.value, 0);

  if (!slices.length) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">{emptyLabel}</p>
    );
  }

  const withPct = slices.map((item) => ({
    ...item,
    shareLabel:
      computedTotal > 0 ? `${((item.value / computedTotal) * 100).toFixed(1)}%` : "0%",
  }));

  return (
    <div className="grid items-center gap-8 lg:grid-cols-2">
      <div className="relative mx-auto aspect-square w-full max-w-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={withPct}
              dataKey="value"
              nameKey="label"
              innerRadius="62%"
              outerRadius="90%"
              paddingAngle={4}
              cornerRadius={8}
              stroke="transparent"
              cursor="pointer"
            >
              {withPct.map((entry, i) => (
                <Cell key={entry.label} fill={entry.color ?? CHART_SERIES[i % CHART_SERIES.length]} />
              ))}
              <Label
                position="center"
                content={({ viewBox }) => {
                  if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
                  const { cx, cy } = viewBox as { cx: number; cy: number };
                  return (
                    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan
                        x={cx}
                        y={cy - 8}
                        className="fill-muted-foreground text-[10px] font-semibold uppercase tracking-wider"
                      >
                        Total
                      </tspan>
                      <tspan x={cx} y={cy + 14} className="fill-foreground text-sm font-extrabold">
                        {formatAxisCompact(computedTotal)}
                      </tspan>
                    </text>
                  );
                }}
              />
            </Pie>
            <Tooltip content={<MandottiTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <DonutLegend slices={withPct} />
    </div>
  );
}

type AreaSeriesChartProps = {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  emptyLabel?: string;
};

/** Área suave para evolução temporal (encaixe, tendência) */
export function AreaSeriesChart({
  data,
  height = 260,
  color = "var(--primary)",
  emptyLabel = "Sem dados",
}: AreaSeriesChartProps) {
  const gradId = `area-${useId().replace(/:/g, "")}`;

  if (!data.length) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">{emptyLabel}</p>
    );
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.32} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" vertical={false} strokeOpacity={0.55} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
            tickFormatter={formatAxisCompact}
            width={48}
          />
          <Tooltip content={<MandottiTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={`url(#${gradId})`}
            strokeWidth={3}
            strokeLinecap="round"
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
