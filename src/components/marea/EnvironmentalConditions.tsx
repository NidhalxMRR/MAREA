import { useEffect, useState } from "react";
import { CloudSun, Droplets, Thermometer, Waves, Wind } from "lucide-react";
import { Panel, PanelHeader, SourceNote, StatusChip } from "./primitives";
import { getLatestReading, getThresholds, DATA_UPDATE_EVENT } from "@/lib/db";
import { SensorType } from "@/types/marea";
import { cn } from "@/lib/utils";

interface MetricDef {
  type: SensorType;
  label: string;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultMin: number;
  defaultMax: number;
}

const METRICS: MetricDef[] = [
  { type: "temperature", label: "Water Temperature", unit: "°C", icon: Thermometer, defaultMin: 14, defaultMax: 28.5 },
  { type: "ph", label: "pH Level", unit: "pH", icon: Droplets, defaultMin: 6.8, defaultMax: 8.4 },
  { type: "salinity", label: "Salinity", unit: "PSU", icon: Waves, defaultMin: 34, defaultMax: 39.5 },
  { type: "turbidity", label: "Turbidity", unit: "NTU", icon: Wind, defaultMin: 0, defaultMax: 4.5 },
];

export function EnvironmentalConditions({ className }: { className?: string }) {
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setDataVersion((v) => v + 1);
    window.addEventListener(DATA_UPDATE_EVENT, handleUpdate);
    return () => window.removeEventListener(DATA_UPDATE_EVENT, handleUpdate);
  }, []);

  const thresholds = getThresholds();

  return (
    <Panel className={cn("overflow-hidden", className)}>
      <PanelHeader
        eyebrow="Multi-Parameter Quality"
        title="Water Quality & Environmental Metrics"
        description="Comprehensive physical and chemical measurements supporting aquaculture health and harvest security."
        actions={<StatusChip tone="positive">Configured</StatusChip>}
      />

      <ul className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map(({ type, label, unit, icon: Icon }) => {
          const reading = getLatestReading(type);
          const threshold = thresholds.find((t) => t.sensor_type === type);
          const hasValue = reading !== undefined;

          let statusTone: "positive" | "caution" | "pending" = "pending";
          if (hasValue && threshold) {
            if (reading.value < threshold.min_value || reading.value > threshold.max_value) {
              statusTone = "caution";
            } else {
              statusTone = "positive";
            }
          }

          return (
            <li key={type} className="bg-surface p-5 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icon className="size-4 text-primary shrink-0" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground">{label}</span>
                </div>
                {hasValue ? (
                  <StatusChip tone={statusTone}>{statusTone === "positive" ? "Normal" : "Alert"}</StatusChip>
                ) : (
                  <span className="text-[0.65rem] text-muted-foreground font-medium">Awaiting input</span>
                )}
              </div>

              <div>
                <p className="flex items-baseline gap-1.5">
                  {hasValue ? (
                    <span className="tabular text-3xl font-bold text-foreground">
                      {reading.value.toFixed(2)}
                    </span>
                  ) : (
                    <span aria-hidden className="tabular text-2xl font-medium text-border-strong">
                      ——
                    </span>
                  )}
                  <span className="text-xs font-medium text-muted-foreground">{unit}</span>
                </p>
                {threshold && (
                  <p className="mt-1 text-[0.7rem] text-muted-foreground">
                    Target: {threshold.min_value} – {threshold.max_value} {unit}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <SourceNote>
        Thresholds are configurable in Settings. Live readings arrive via TTGO LoRa32 node transmission or manual CSV/XLSX imports.
      </SourceNote>
    </Panel>
  );
}
