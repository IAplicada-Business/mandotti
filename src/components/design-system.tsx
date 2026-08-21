import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Tone = "default" | "success" | "warning" | "danger" | "info";

const toneIcon: Record<Tone, string> = {
  default: "bg-primary/12 text-primary",
  success: "bg-primary/12 text-primary",
  warning: "bg-warning/15 text-warning",
  danger: "bg-destructive/12 text-destructive",
  info: "bg-surface-soft text-foreground",
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
        "flex items-center gap-4 rounded-[1.5rem] bg-primary/5 p-4 shadow-sm sm:p-5",
        className,
      )}
    >
      {Icon ? (
        <span
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-2xl",
            toneIcon[tone],
          )}
        >
          <Icon className="size-5" />
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 font-mono-nums text-2xl font-extrabold tracking-tight text-foreground sm:text-[1.75rem]">
          {value}
        </p>
        {hint ? <div className="mt-1 text-xs font-medium text-muted-foreground">{hint}</div> : null}
      </div>
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
    <div className={cn("flex items-center gap-4 rounded-[1.5rem] bg-primary/5 p-4 shadow-sm sm:p-5", className)}>
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
    <div className={cn("rounded-[1.5rem] bg-primary/5 p-4 shadow-sm sm:p-6", className)}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold tracking-tight">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

const calloutTone: Record<"info" | "warning" | "danger", string> = {
  info: "bg-primary/8 text-foreground",
  warning: "bg-warning/12 text-foreground",
  danger: "bg-destructive/8 text-foreground",
};

/** Faixa de aviso sem borda — mesmo idioma dos cards */
export function Callout({
  children,
  tone = "info",
  className,
}: {
  children: ReactNode;
  tone?: "info" | "warning" | "danger";
  className?: string;
}) {
  return (
    <div className={cn("rounded-[1.25rem] px-4 py-3.5 text-sm", calloutTone[tone], className)}>
      {children}
    </div>
  );
}
