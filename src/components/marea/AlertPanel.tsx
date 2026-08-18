import { useEffect, useState } from "react";
import { Bell, BellOff, CheckCircle2, ShieldCheck } from "lucide-react";
import { Panel, PanelHeader, QuietEmpty, SourceNote, StatusChip } from "./primitives";
import { getAlerts, acknowledgeAlert, DATA_UPDATE_EVENT } from "@/lib/db";
import { cn } from "@/lib/utils";

const WATCHLIST = [
  { label: "Unexpected temperature increase", requires: "Live readings + seasonal baseline" },
  { label: "Water changing too fast", requires: "Consecutive measurements (ΔT > 1.5°C)" },
  { label: "Sensor offline or delayed", requires: "32-sec LoRa heartbeat timeout" },
  { label: "Missing or duplicate readings", requires: "Ingestion sequence verification" },
  { label: "Biological threshold exceedance", requires: "User-defined min/max bounds" },
];

export function AlertPanel({
  className,
  compact,
  onNavigate,
}: {
  className?: string;
  compact?: boolean;
  onNavigate?: (page: any) => void;
}) {
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setDataVersion((v) => v + 1);
    window.addEventListener(DATA_UPDATE_EVENT, handleUpdate);
    return () => window.removeEventListener(DATA_UPDATE_EVENT, handleUpdate);
  }, []);

  const alerts = getAlerts();
  const unreadAlerts = alerts.filter((a) => !a.acknowledged);

  return (
    <Panel className={cn("overflow-hidden", className)}>
      <PanelHeader
        eyebrow="Attention"
        title={compact ? "Needs attention" : "Early-warning status"}
        description={
          compact
            ? unreadAlerts.length > 0
              ? `${unreadAlerts.length} active alert(s) requiring acknowledgment.`
              : "No threshold violations detected."
            : "Conditions MAREA evaluates continuously from live sensor readings."
        }
        actions={
          <StatusChip
            tone={unreadAlerts.length > 0 ? "caution" : "pending"}
            icon={unreadAlerts.length > 0 ? <Bell className="size-3.5" /> : <BellOff className="size-3.5" />}
          >
            {unreadAlerts.length} active
          </StatusChip>
        }
      />

      <div className="space-y-4 p-4 sm:p-5">
        {unreadAlerts.length > 0 ? (
          <div className="space-y-2.5">
            <p className="eyebrow text-destructive font-semibold">Active Unacknowledged Alerts</p>
            <ul className="space-y-2">
              {unreadAlerts.slice(0, 3).map((alert) => (
                <li
                  key={alert.id}
                  className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{alert.message}</p>
                    <p className="text-muted-foreground mt-0.5">
                      {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="shrink-0 rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    Dismiss
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <QuietEmpty>
            <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
              <ShieldCheck aria-hidden className="size-4 text-positive" />
              All Clear
            </span>
            <span className="mt-1 block text-xs">
              MAREA raises warnings only from checked threshold violations and verified measurements.
            </span>
          </QuietEmpty>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="eyebrow">Continuous Watchlist</p>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate("alerts")}
                className="text-[0.7rem] text-primary hover:underline font-medium"
              >
                View all alerts →
              </button>
            )}
          </div>
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {WATCHLIST.map((item) => (
              <li
                key={item.label}
                className="flex flex-col gap-0.5 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 bg-surface"
              >
                <span className="text-xs font-medium text-foreground">{item.label}</span>
                <span className="text-[0.7rem] text-muted-foreground sm:text-right">{item.requires}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {compact ? null : (
        <SourceNote>
          Warnings are raised and resolved strictly against local database readings. Every alert records its triggering measurement ID.
        </SourceNote>
      )}
    </Panel>
  );
}
