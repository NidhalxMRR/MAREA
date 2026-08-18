import { useState, useEffect } from "react";
import { Bell, BellOff, Check, Filter, AlertTriangle, ShieldCheck } from "lucide-react";
import { PageHeader, Panel, PanelHeader, SourceNote, StatusChip, QuietEmpty } from "@/components/marea/primitives";
import { SystemStatusBanner } from "@/components/marea/SystemStatusBanner";
import { AlertPanel } from "@/components/marea/AlertPanel";
import { getAlerts, acknowledgeAlert, getSensorLabel, DATA_UPDATE_EVENT } from "@/lib/db";
import { Alert } from "@/types/marea";
import { PageId } from "@/components/marea/AppShell";
import { cn } from "@/lib/utils";

export function Alerts({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    const loadAlerts = () => {
      setAlerts(
        getAlerts().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      );
    };
    loadAlerts();
    window.addEventListener(DATA_UPDATE_EVENT, loadAlerts);
    return () => window.removeEventListener(DATA_UPDATE_EVENT, loadAlerts);
  }, [dataVersion]);

  const unreadAlerts = alerts.filter((a) => !a.acknowledged);
  const displayedAlerts = alerts.filter((a) => filter === "all" || !a.acknowledged);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operations · Early Warning"
        title="Active Alerts & Anomaly History"
        description="Environmental threshold violations, rate-of-change warnings, and hardware communication alerts."
        actions={
          <div className="flex bg-muted p-1 rounded-lg border border-border">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                filter === "all" ? "bg-surface text-foreground shadow-card font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              All ({alerts.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5",
                filter === "unread" ? "bg-surface text-foreground shadow-card font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Unread ({unreadAlerts.length})
              {unreadAlerts.length > 0 && <span className="size-2 rounded-full bg-destructive animate-pulse" />}
            </button>
          </div>
        }
      />

      <SystemStatusBanner onNavigate={onNavigate} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Main Alert Feed */}
        <Panel className="xl:col-span-2 overflow-hidden">
          <PanelHeader
            eyebrow="Feed"
            title="Warning Incident Log"
            description="Detailed record of environmental deviations and operator dismissals."
            actions={
              <StatusChip tone={unreadAlerts.length > 0 ? "caution" : "positive"}>
                {unreadAlerts.length > 0 ? `${unreadAlerts.length} Unresolved` : "All Clear"}
              </StatusChip>
            }
          />

          <div className="p-0">
            {displayedAlerts.length === 0 ? (
              <div className="p-10">
                <QuietEmpty>
                  <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                    <ShieldCheck className="size-4 text-positive" />
                    No warnings found
                  </span>
                  <span className="mt-1 block text-xs">
                    {filter === "unread"
                      ? "All previous warnings have been acknowledged."
                      : "No threshold violations have been recorded yet."}
                  </span>
                </QuietEmpty>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {displayedAlerts.map((alert) => (
                  <li
                    key={alert.id}
                    className={cn(
                      "p-4 sm:px-5 flex items-start justify-between gap-4 transition-colors",
                      !alert.acknowledged ? "bg-destructive/5" : "bg-surface hover:bg-muted/30"
                    )}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={cn(
                          "mt-0.5 rounded-full p-1.5 shrink-0",
                          !alert.acknowledged
                            ? "bg-destructive/15 text-destructive"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <AlertTriangle className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                            {getSensorLabel(alert.sensor_type)}
                          </span>
                          <span className="text-[0.7rem] text-muted-foreground">
                            · {new Date(alert.created_at).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {alert.acknowledged && (
                            <span className="text-[0.65rem] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                              Dismissed
                            </span>
                          )}
                        </div>
                        <p
                          className={cn(
                            "text-sm mt-1",
                            !alert.acknowledged ? "font-semibold text-foreground" : "text-muted-foreground"
                          )}
                        >
                          {alert.message}
                        </p>
                      </div>
                    </div>

                    {!alert.acknowledged && (
                      <button
                        type="button"
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="shrink-0 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-xs"
                      >
                        Acknowledge
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <SourceNote>
            Alerts trigger automatically whenever a measured value exceeds the configured min or max threshold.
          </SourceNote>
        </Panel>

        {/* Watchlist conditions */}
        <AlertPanel compact />
      </div>
    </div>
  );
}
