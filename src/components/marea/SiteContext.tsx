import type { ReactNode } from "react";
import { MapPin, Radio, Clock, Waves } from "lucide-react";
import { StatusChip, type StatusTone } from "./primitives";
import { SITE_CONTEXT } from "@/data/marea";
import { getLatestReading, getReadings } from "@/lib/db";
import { cn } from "@/lib/utils";

export interface SiteDescriptor {
  name?: string;
  location?: string;
  device?: string;
  lastMeasurement?: string;
  status?: { tone: StatusTone; label: string };
}

export function SiteContextBar({
  site,
  actions,
  className,
}: {
  site?: SiteDescriptor;
  actions?: ReactNode;
  className?: string;
}) {
  const readings = getReadings();
  const latest = getLatestReading();

  const defaultSite: SiteDescriptor = {
    name: SITE_CONTEXT.name,
    location: `${SITE_CONTEXT.region} (${SITE_CONTEXT.coordinates})`,
    device: readings.length > 0 ? "TTGO LoRa32 Node 1" : "TTGO LoRa32 (Pending Tx)",
    lastMeasurement: latest
      ? new Date(latest.timestamp).toLocaleString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : "No readings yet",
    status: readings.length > 0
      ? { tone: "positive", label: "Active Telemetry" }
      : { tone: "pending", label: "Awaiting Live Readings" },
  };

  const currentSite = { ...defaultSite, ...site };
  const status = currentSite.status!;

  return (
    <section
      aria-label="Site context"
      className={cn("panel overflow-hidden", className)}
    >
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3.5 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-muted text-muted-foreground"
          >
            <Waves className="size-4.5 text-primary" />
          </span>
          <div className="min-w-0">
            <p className="eyebrow">Production Site</p>
            <h2 className="text-base font-semibold leading-snug text-foreground truncate">
              {currentSite.name}
            </h2>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <StatusChip tone={status.tone}>{status.label}</StatusChip>
          {actions}
        </div>
      </div>
      <dl className="grid grid-cols-1 gap-px bg-border sm:grid-cols-3">
        <div className="bg-surface px-4 py-3 sm:px-5">
          <Field icon={<MapPin />} label="Location" value={currentSite.location} />
        </div>
        <div className="bg-surface px-4 py-3 sm:px-5">
          <Field icon={<Radio />} label="Hardware Node" value={currentSite.device} />
        </div>
        <div className="bg-surface px-4 py-3 sm:px-5">
          <Field icon={<Clock />} label="Latest Reading" value={currentSite.lastMeasurement} />
        </div>
      </dl>
    </section>
  );
}

function Field({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <span aria-hidden className="mt-0.5 shrink-0 text-muted-foreground [&_svg]:size-4">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p
          className={cn(
            "mt-0.5 text-sm leading-snug",
            value ? "font-medium text-foreground" : "text-muted-foreground",
          )}
        >
          {value ?? "Not configured"}
        </p>
      </div>
    </div>
  );
}
