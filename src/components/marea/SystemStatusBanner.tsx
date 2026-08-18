import type { ReactNode } from "react";
import { ArrowUpRight, PlugZap, ShieldCheck, AlertTriangle } from "lucide-react";
import { getAlerts, getReadings } from "@/lib/db";
import { cn } from "@/lib/utils";

export function SystemStatusBanner({
  title,
  detail,
  action,
  className,
  onNavigate,
}: {
  title?: string;
  detail?: string;
  action?: ReactNode;
  className?: string;
  onNavigate?: (page: any) => void;
}) {
  const readings = getReadings();
  const alerts = getAlerts();
  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged);

  let defaultTitle = "Awaiting live sensor stream";
  let defaultDetail = "No TTGO LoRa32 readings received yet. Use the Simulator in Settings or import historical datasets to view operational charts.";
  let Icon = PlugZap;
  let iconTone = "text-muted-foreground";

  if (unacknowledgedAlerts.length > 0) {
    defaultTitle = `${unacknowledgedAlerts.length} Threshold Alert${unacknowledgedAlerts.length > 1 ? 's' : ''} Active`;
    defaultDetail = `Water conditions require attention: ${unacknowledgedAlerts[0].message}.`;
    Icon = AlertTriangle;
    iconTone = "text-caution-foreground";
  } else if (readings.length > 0) {
    defaultTitle = "Live Telemetry Normal";
    defaultDetail = `Sensors reporting normally. ${readings.length} readings stored. All environmental variables are within configured threshold boundaries.`;
    Icon = ShieldCheck;
    iconTone = "text-positive";
  }

  const finalTitle = title ?? defaultTitle;
  const finalDetail = detail ?? defaultDetail;

  return (
    <div
      role="status"
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-5",
        className,
      )}
    >
      <span
        aria-hidden
        className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-surface text-muted-foreground"
      >
        <Icon className={cn("size-4.5", iconTone)} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{finalTitle}</p>
        <p className="mt-0.5 text-xs sm:text-sm leading-relaxed text-muted-foreground">{finalDetail}</p>
      </div>
      {action ?? (
        <button
          type="button"
          onClick={() => onNavigate?.("sensors")}
          className="inline-flex min-h-9 shrink-0 items-center gap-1.5 self-start rounded-lg border border-border bg-surface px-3 text-xs sm:text-sm font-medium text-foreground transition-colors hover:border-border-strong sm:self-auto"
        >
          Sensor telemetry
          <ArrowUpRight aria-hidden className="size-4" />
        </button>
      )}
    </div>
  );
}
