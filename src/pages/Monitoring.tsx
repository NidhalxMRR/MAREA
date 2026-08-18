import { useState, useEffect } from "react";
import { SiteContextBar } from "@/components/marea/SiteContext";
import { SystemStatusBanner } from "@/components/marea/SystemStatusBanner";
import { TemperatureChart } from "@/components/marea/TemperatureChart";
import { RateOfChangeChart } from "@/components/marea/RateOfChangeChart";
import { EnvironmentalConditions } from "@/components/marea/EnvironmentalConditions";
import { IoTQualityPanel } from "@/components/marea/IoTQualityPanel";
import { PageHeader, Panel, PanelHeader, SourceNote, StatusChip } from "@/components/marea/primitives";
import { AskMarea } from "@/components/marea/AskMarea";
import { getReadings, getSensorLabel, getSensorUnit, getThresholds, DATA_UPDATE_EVENT } from "@/lib/db";
import { SensorType } from "@/types/marea";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { PageId } from "@/components/marea/AppShell";
import { cn } from "@/lib/utils";

export function Monitoring({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  const [selectedSensor, setSelectedSensor] = useState<SensorType>("temperature");
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setDataVersion((v) => v + 1);
    window.addEventListener(DATA_UPDATE_EVENT, handleUpdate);
    return () => window.removeEventListener(DATA_UPDATE_EVENT, handleUpdate);
  }, []);

  const readings = getReadings();
  const thresholds = getThresholds();
  const currentThreshold = thresholds.find((t) => t.sensor_type === selectedSensor);

  const filteredReadings = readings
    .filter((r) => r.sensor_type === selectedSensor)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const chartData = filteredReadings.map((r) => {
    const date = new Date(r.timestamp);
    return {
      timestamp: r.timestamp,
      timeLabel: date.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      value: r.value,
      minThreshold: currentThreshold?.min_value,
      maxThreshold: currentThreshold?.max_value,
    };
  });

  const sensorTypes: SensorType[] = ["temperature", "ph", "salinity", "turbidity"];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operations · Monitoring"
        title="Live Water Quality Telemetry"
        description="Continuous multi-sensor tracking, rate of change analysis, and telemetry validation for lagoon production pens."
        actions={
          <AskMarea
            variant="inline"
            className="w-auto"
            questions={[
              "Explain this temperature trend",
              "Is the temperature changing unusually fast?",
              "Is the sensor reporting normally?",
            ]}
          />
        }
      />

      <SiteContextBar />
      <SystemStatusBanner onNavigate={onNavigate} />

      {/* Multi-Parameter Selector & Detailed Chart */}
      <Panel className="overflow-hidden">
        <PanelHeader
          eyebrow="Sensor Parameter"
          title={`Detailed Trend: ${getSensorLabel(selectedSensor)}`}
          description={`Threshold limits: Min ${currentThreshold?.min_value} ${getSensorUnit(selectedSensor)} — Max ${currentThreshold?.max_value} ${getSensorUnit(selectedSensor)}`}
          actions={
            <div role="group" aria-label="Sensor parameter" className="flex flex-wrap rounded-lg border border-border bg-secondary p-0.5">
              {sensorTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedSensor(type)}
                  className={cn(
                    "min-h-8 rounded-md px-3 text-xs font-medium transition-colors",
                    selectedSensor === type
                      ? "bg-surface text-foreground shadow-card font-semibold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {getSensorLabel(type)}
                </button>
              ))}
            </div>
          }
        />

        <div className="p-5">
          {filteredReadings.length > 0 ? (
            <div className="h-[20rem] sm:h-[24rem] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="timeLabel"
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-border)" }}
                  />
                  <YAxis
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    domain={['auto', 'auto']}
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-border)" }}
                    unit={getSensorUnit(selectedSensor)}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg border border-border bg-surface p-3 shadow-raised text-xs space-y-1">
                            <p className="font-semibold text-foreground">{data.timeLabel}</p>
                            <p className="text-primary font-medium">
                              {getSensorLabel(selectedSensor)}: {Number(data.value).toFixed(2)} {getSensorUnit(selectedSensor)}
                            </p>
                            {data.minThreshold && (
                              <p className="text-muted-foreground">
                                Threshold: {data.minThreshold} – {data.maxThreshold} {getSensorUnit(selectedSensor)}
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {currentThreshold && (
                    <>
                      <ReferenceLine
                        y={currentThreshold.max_value}
                        stroke="oklch(0.52 0.17 25)"
                        strokeDasharray="4 4"
                        label={{ value: `Max ${currentThreshold.max_value}`, fill: "oklch(0.52 0.17 25)", fontSize: 10 }}
                      />
                      <ReferenceLine
                        y={currentThreshold.min_value}
                        stroke="oklch(0.72 0.13 68)"
                        strokeDasharray="4 4"
                        label={{ value: `Min ${currentThreshold.min_value}`, fill: "oklch(0.72 0.13 68)", fontSize: 10 }}
                      />
                    </>
                  )}
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="var(--color-actual)"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "var(--color-actual)" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border-strong bg-muted/30 p-10 text-center">
              <p className="text-sm font-medium text-foreground">No {getSensorLabel(selectedSensor)} readings logged</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                Use the Simulator in Settings or import dataset files to view detailed telemetry graphs.
              </p>
            </div>
          )}
        </div>

        <SourceNote>
          Data updates instantaneously across all active browser windows when new sensor packets arrive.
        </SourceNote>
      </Panel>

      <RateOfChangeChart plain />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        <IoTQualityPanel />
        <EnvironmentalConditions />
      </div>
    </div>
  );
}
