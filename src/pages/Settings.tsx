import React, { useState, useEffect } from "react";
import { Settings2, Trash2, Zap, Radio, Sliders, Check } from "lucide-react";
import { getThresholds, updateThreshold, getSensorLabel, clearReadings, insertReadings, getSensorUnit, DATA_UPDATE_EVENT } from "@/lib/db";
import { SensorType, Threshold } from "@/types/marea";
import { PageHeader, Panel, PanelHeader, SourceNote, StatusChip } from "@/components/marea/primitives";
import { PageId } from "@/components/marea/AppShell";
import { cn } from "@/lib/utils";

export function Settings({ onNavigate }: { onNavigate?: (page: PageId) => void }) {
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  useEffect(() => {
    const loadThresholds = () => setThresholds(getThresholds());
    loadThresholds();
    window.addEventListener(DATA_UPDATE_EVENT, loadThresholds);
    return () => window.removeEventListener(DATA_UPDATE_EVENT, loadThresholds);
  }, []);

  useEffect(() => {
    if (!isAutoSimulating) return;

    const intervalId = window.setInterval(() => {
      simulateRealtimeData();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [isAutoSimulating, thresholds]);

  const handleUpdate = (sensor_type: SensorType, min: number, max: number) => {
    updateThreshold(sensor_type, min, max);
    setSaveToast(`Saved ${getSensorLabel(sensor_type)} threshold.`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const simulateRealtimeData = () => {
    const currentThresholds = getThresholds();
    const sensors: SensorType[] = ["temperature", "ph", "salinity", "turbidity"];
    const randomSensor = sensors[Math.floor(Math.random() * sensors.length)];

    const isAnomalous = Math.random() > 0.75;
    const currentThreshold = currentThresholds.find((t) => t.sensor_type === randomSensor);

    let value = 0;
    if (currentThreshold) {
      if (isAnomalous) {
        value = Math.random() > 0.5
          ? currentThreshold.max_value + (Math.random() * 3 + 0.5)
          : currentThreshold.min_value - (Math.random() * 3 + 0.5);
      } else {
        value = currentThreshold.min_value + Math.random() * (currentThreshold.max_value - currentThreshold.min_value);
      }
    } else {
      value = 20.0 + Math.random() * 5;
    }

    insertReadings([
      {
        timestamp: new Date().toISOString(),
        sensor_type: randomSensor,
        value,
        unit: getSensorUnit(randomSensor),
        source: "sonde",
      },
    ]);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <PageHeader
        eyebrow="System · Configuration"
        title="Settings & Hardware Simulator"
        description="Configure dynamic alert thresholds, run live TTGO LoRa32 simulation streams, and manage local telemetry storage."
        actions={
          saveToast ? (
            <StatusChip tone="positive" icon={<Check className="size-3.5" />}>
              {saveToast}
            </StatusChip>
          ) : undefined
        }
      />

      {/* Threshold Configuration */}
      <Panel className="overflow-hidden">
        <PanelHeader
          eyebrow="Early Warning Criteria"
          title="Environmental Threshold Boundaries"
          description="Readings outside these boundaries trigger immediate warning alerts on the dashboard and log feed."
          actions={<StatusChip tone="neutral">4 Active Bounds</StatusChip>}
        />
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {thresholds.map((threshold) => (
              <ThresholdForm
                key={threshold.id}
                threshold={threshold}
                onSave={(min, max) => handleUpdate(threshold.sensor_type, min, max)}
              />
            ))}
          </div>
        </div>
        <SourceNote>
          Threshold values are evaluated synchronously as each sensor reading is ingested.
        </SourceNote>
      </Panel>

      {/* Simulator & Database Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Simulator Card */}
        <Panel className="overflow-hidden">
          <PanelHeader
            eyebrow="Hardware Test"
            title="TTGO LoRa32 Telemetry Simulator"
            description="Inject simulated 17-field sensor packets into the local stream to test alert responses and chart renders."
            actions={<StatusChip tone={isAutoSimulating ? "positive" : "pending"}>{isAutoSimulating ? "Broadcasting" : "Idle"}</StatusChip>}
          />
          <div className="p-6 space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Generates random DS18B20 temperatures, pH, salinity, or turbidity readings with occasional simulated thermal excursions.
            </p>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={simulateRealtimeData}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Zap className="size-4" />
                Inject Single Telemetry Packet
              </button>
              <button
                type="button"
                onClick={() => setIsAutoSimulating((prev) => !prev)}
                className={cn(
                  "w-full flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-xs font-semibold transition-colors",
                  isAutoSimulating
                    ? "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20"
                    : "bg-surface text-foreground hover:bg-muted"
                )}
              >
                <Radio className="size-4" />
                {isAutoSimulating ? "Stop Automatic Telemetry Stream" : "Start Automatic Telemetry Stream (5s)"}
              </button>
            </div>
          </div>
          <SourceNote>
            Simulated packets are tagged with <code className="text-xs bg-muted px-1 rounded font-mono">source: sonde</code> to mimic field hardware.
          </SourceNote>
        </Panel>

        {/* Database Management Card */}
        <Panel className="overflow-hidden border-destructive/30">
          <PanelHeader
            eyebrow="Maintenance"
            title="Database Management"
            description="Clear stored readings and alert logs from the browser's local database."
            actions={<StatusChip tone="caution">Caution</StatusChip>}
          />
          <div className="p-6 space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Clears all historical and live readings as well as acknowledged and unacknowledged alerts. Configured threshold boundaries are preserved.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete all stored readings and alerts?")) {
                    clearReadings();
                  }
                }}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-colors"
              >
                <Trash2 className="size-4" />
                Clear All Telemetry & Alerts
              </button>
            </div>
          </div>
          <SourceNote>
            This action resets the local storage instance without affecting the python ML package or firmware files.
          </SourceNote>
        </Panel>
      </div>
    </div>
  );
}

const ThresholdForm: React.FC<{ threshold: Threshold; onSave: (min: number, max: number) => void }> = ({
  threshold,
  onSave,
}) => {
  const [min, setMin] = useState(threshold.min_value);
  const [max, setMax] = useState(threshold.max_value);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setMin(threshold.min_value);
    setMax(threshold.max_value);
    setIsDirty(false);
  }, [threshold.min_value, threshold.max_value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(min, max);
    setIsDirty(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 rounded-xl border border-border bg-surface flex flex-col justify-between space-y-3"
    >
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
          {getSensorLabel(threshold.sensor_type)}{" "}
          <span className="text-muted-foreground font-normal">({getSensorUnit(threshold.sensor_type)})</span>
        </label>
        {isDirty && (
          <span className="text-[0.65rem] text-primary font-medium">Unsaved</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[0.7rem] font-medium text-muted-foreground mb-1">Min Threshold</label>
          <input
            type="number"
            step="any"
            value={min}
            onChange={(e) => {
              setMin(parseFloat(e.target.value) || 0);
              setIsDirty(true);
            }}
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-mono font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-[0.7rem] font-medium text-muted-foreground mb-1">Max Threshold</label>
          <input
            type="number"
            step="any"
            value={max}
            onChange={(e) => {
              setMax(parseFloat(e.target.value) || 0);
              setIsDirty(true);
            }}
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-mono font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={!isDirty}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-opacity"
        >
          Save Threshold
        </button>
      </div>
    </form>
  );
};
