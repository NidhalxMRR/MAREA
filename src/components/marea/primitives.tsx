import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* StatusChip — status is always communicated by text + icon, not colour alone */
/* ------------------------------------------------------------------ */

export type StatusTone = "pending" | "positive" | "caution" | "neutral" | "critical";

const toneClasses: Record<StatusTone, string> = {
  pending: "border-border-strong bg-muted text-muted-foreground",
  positive: "border-positive/35 bg-positive/10 text-positive-foreground",
  caution: "border-caution/40 bg-caution/12 text-caution-foreground",
  neutral: "border-border bg-secondary text-secondary-foreground",
  critical: "border-destructive/35 bg-destructive/10 text-destructive",
};

export function StatusChip({
  tone = "neutral",
  children,
  icon,
  className,
}: {
  tone?: StatusTone;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
    >
      {icon ? <span aria-hidden className="shrink-0 [&_svg]:size-3.5">{icon}</span> : null}
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Panel — the single card primitive used everywhere                    */
/* ------------------------------------------------------------------ */

export function Panel({
  children,
  className,
  as: As = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
}) {
  return <As className={cn("panel", className)}>{children}</As>;
}

export function PanelHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? <p className="eyebrow mb-1">{eyebrow}</p> : null}
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* EmptyState — used when data streams or sensors are pending          */
/* ------------------------------------------------------------------ */

export function EmptyState({
  icon,
  title,
  description,
  footer,
  className,
  compact,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  footer?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-muted/40 text-center",
        compact ? "gap-2 px-4 py-6" : "gap-3 px-6 py-10",
        className,
      )}
    >
      {icon ? (
        <span aria-hidden className="text-muted-foreground [&_svg]:size-5">
          {icon}
        </span>
      ) : null}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? (
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      {footer}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* PageHeader                                                           */
/* ------------------------------------------------------------------ */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* SourceNote — every data surface states where its values come from    */
/* ------------------------------------------------------------------ */

export function SourceNote({
  children,
  icon,
  className,
}: {
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 border-t border-border bg-muted/40 px-5 py-3 text-xs leading-relaxed text-muted-foreground",
        className,
      )}
    >
      {icon ? (
        <span aria-hidden className="mt-px shrink-0 [&_svg]:size-3.5">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0">{children}</span>
    </p>
  );
}

/* Quiet inline placeholder used when a source is not connected yet. */
export function QuietEmpty({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 rounded-lg bg-muted/50 px-4 py-6 text-center",
        className,
      )}
    >
      <span aria-hidden className="tabular text-lg leading-none text-border-strong">
        ——
      </span>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

export function MetricValue({
  value,
  unit,
  muted,
}: {
  value: string;
  unit?: string;
  muted?: boolean;
}) {
  return (
    <p
      className={cn(
        "tabular text-[1.75rem] leading-none font-medium",
        muted ? "text-muted-foreground" : "text-foreground",
      )}
    >
      {value}
      {unit ? <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span> : null}
    </p>
  );
}
