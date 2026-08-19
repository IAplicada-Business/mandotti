import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Tone = "default" | "success" | "warning" | "danger" | "info";

const toneBar: Record<Tone, string> = {
  default: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
  info: "bg-chart-5",
};

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-sm",
        className,
      )}
    >
      <span className={cn("absolute inset-x-0 top-0 h-[3px]", toneBar[tone])} />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        {Icon ? (
          <span className="rounded-xl bg-surface-soft p-2 text-primary">
            <Icon className="size-4" />
          </span>
        ) : null}
      </div>
      <p className="mt-2 font-mono-nums text-3xl font-extrabold tracking-tight text-foreground">
        {value}
      </p>
      {hint ? <div className="mt-2 text-xs font-medium text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

export function RingStat({
  label,
  value,
  total,
  color = "var(--primary)",
  className,
}: {
  label: string;
  value: number;
  total: number;
  color?: string;
  className?: string;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div
      className={cn(
        // Linha em vez de coluna: o anel centralizado deixava muito vazio
        // lateral quando o card cresce em telas largas.
        "flex items-center gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-sm",
        className,
      )}
    >
      <div className="relative size-[88px] shrink-0">
        <svg viewBox="0 0 96 96" className="size-full -rotate-90">
          <circle cx="48" cy="48" r={r} fill="none" stroke="var(--surface-soft)" strokeWidth="10" />
          <circle
            cx="48"
            cy="48"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="font-mono-nums text-sm font-bold text-foreground">
            {value}/{total}
          </span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold leading-tight text-foreground">{label}</p>
        <p className="mt-1 font-mono-nums text-xs font-semibold text-muted-foreground">
          {pct}% do total
        </p>
      </div>
    </div>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
        <div>
          <h3 className="text-base font-bold tracking-tight">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
