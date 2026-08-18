import { useState, useEffect } from "react";
import { Thermometer, WifiOff } from "lucide-react";
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
import { EmptyState, Panel, PanelHeader, SourceNote, StatusChip } from "./primitives";
import { AskMarea } from "./AskMarea";
import { DATASET, DESCRIPTIVE_RANGE } from "@/data/marea";
import { getReadings, getThresholds, DATA_UPDATE_EVENT } from "@/lib/db";
import { cn } from "@/lib/utils";

export type RangeKey = "30D" | "90D" | "SEASON" | "ALL";

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "30D", label: "30D" },
  { key: "90D", label: "90D" },
  { key: "SEASON", label: "Season" },
  { key: "ALL", label: "All" },
];

export function TemperatureChart({
  className,
  plain,
}: {
  className?: string;
  plain?: boolean;
}) {
  const [range, setRange] = useState<RangeKey>("30D");
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setDataVersion((v) => v + 1);
    window.addEventListener(DATA_UPDATE_EVENT, handleUpdate);
    return () => window.removeEventListener(DATA_UPDATE_EVENT, handleUpdate);
  }, []);

  const readings = getReadings().filter((r) => r.sensor_type === "temperature");
  const thresholds = getThresholds();
  const tempThreshold = thresholds.find((t) => t.sensor_type === "temperature");

  const hasData = readings.length > 0;

  // Prepare chart data
  const chartData = readings
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((r) => {
      const date = new Date(r.timestamp);
      return {
        timestamp: r.timestamp,
        timeLabel: date.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        temperature: r.value,
        reference: DESCRIPTIVE_RANGE.mean,
        minThreshold: tempThreshold?.min_value,
        maxThreshold: tempThreshold?.max_value,
      };
    });

  return (
    <Panel className={cn("overflow-hidden", className)}>
      <PanelHeader
        eyebrow="Water temperature"
        title={plain ? "Temperature over time" : "Sea-water temperature series"}
        description={
          plain
            ? "One view for the measured temperature at your site and the level normally expected at this time of year."
            : "A single canvas for measured IoT temperature, the researcher-derived seasonal reference and configured alert thresholds."
        }
        actions={
          <div
            role="group"
            aria-label="Time range"
            className="flex rounded-lg border border-border bg-secondary p-0.5"
          >
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                aria-pressed={range === r.key}
                onClick={() => setRange(r.key)}
                className={cn(
                  "min-h-8 rounded-md px-3 text-xs font-medium transition-colors",
                  range === r.key
                    ? "bg-surface text-foreground shadow-card font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {/* Series legend bar */}
      <ul className="flex flex-col gap-2 border-b border-border px-5 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 bg-muted/20">
        <li className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden
            className="h-1 w-5 shrink-0 rounded-full bg-[var(--color-actual)]"
          />
          <span className="text-xs font-medium text-foreground">Measured water temperature</span>
          <span className="text-xs text-muted-foreground">
            · {hasData ? `${readings.length} readings` : "Waiting for live telemetry"}
          </span>
        </li>
        <li className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden
            className="h-1 w-5 shrink-0 rounded-full bg-[var(--color-reference)]"
          />
          <span className="text-xs font-medium text-foreground">Seasonal reference (~{DESCRIPTIVE_RANGE.mean.toFixed(1)}°C)</span>
          <span className="text-xs text-muted-foreground">· Bizerte historical model</span>
        </li>
        {tempThreshold && (
          <li className="flex min-w-0 items-center gap-2">
            <span
              aria-hidden
              className="h-0.5 w-4 shrink-0 rounded-full border-t border-dashed border-destructive"
            />
            <span className="text-xs font-medium text-foreground">Threshold bounds</span>
            <span className="text-xs text-muted-foreground">
              · [{tempThreshold.min_value}°C – {tempThreshold.max_value}°C]
            </span>
          </li>
        )}
      </ul>

      <div className="p-4 sm:p-5">
        {hasData ? (
          <div className="h-[18rem] sm:h-[22rem] lg:h-[24rem] w-full">
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
                  domain={['dataMin - 1', 'dataMax + 1']}
                  tickLine={false}
                  axisLine={{ stroke: "var(--color-border)" }}
                  unit="°C"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-border bg-surface p-3 shadow-raised text-xs space-y-1">
                          <p className="font-semibold text-foreground">{data.timeLabel}</p>
                          <p className="text-[var(--color-actual)] font-medium">
                            Measured: {Number(data.temperature).toFixed(2)} °C
                          </p>
                          <p className="text-muted-foreground">
                            Seasonal Ref: {Number(data.reference).toFixed(2)} °C
                          </p>
                          {data.minThreshold && (
                            <p className="text-muted-foreground">
                              Threshold: {data.minThreshold}°C – {data.maxThreshold}°C
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {tempThreshold && (
                  <>
                    <ReferenceLine
                      y={tempThreshold.max_value}
                      stroke="oklch(0.52 0.17 25)"
                      strokeDasharray="4 4"
                      label={{ value: `Max ${tempThreshold.max_value}°C`, fill: "oklch(0.52 0.17 25)", fontSize: 10, position: "top" }}
                    />
                    <ReferenceLine
                      y={tempThreshold.min_value}
                      stroke="oklch(0.72 0.13 68)"
                      strokeDasharray="4 4"
                      label={{ value: `Min ${tempThreshold.min_value}°C`, fill: "oklch(0.72 0.13 68)", fontSize: 10, position: "bottom" }}
                    />
                  </>
                )}
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="var(--color-actual)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "var(--color-actual)" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            icon={<WifiOff />}
            title="No temperature series to plot yet"
            description={
              plain
                ? "Your site has no live readings stored yet. Once measurements arrive from your TTGO LoRa32 node or from historical import, the continuous curve renders here."
                : "No live IoT stream stored and no production forecast published. The researcher daily series is held in the analytics repository."
            }
            footer={
              <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                <StatusChip tone="pending" icon={<Thermometer />}>
                  Waiting for telemetry
                </StatusChip>
                <AskMarea
                  variant="ghost"
                  label="Ask about this chart"
                  questions={[
                    "Explain this temperature trend",
                    "What does the seasonal reference mean?",
                    "Is the temperature changing unusually fast?",
                  ]}
                />
              </div>
            }
            className="h-[16rem] sm:h-[22rem] lg:h-[24rem]"
          />
        )}
      </div>

      <SourceNote>
        {plain ? (
          <>
            Expected seasonal levels come from the Bizerte historical series ({DATASET.dateRange[0]} →{" "}
            {DATASET.dateRange[1]}). It describes a normal year — it is not a forecast.
          </>
        ) : (
          <>
            Reference source: <span className="tabular font-medium">{DATASET.id}</span> · {DATASET.samplingFrequency}{" "}
            sampling · {DATASET.dateRange[0]} → {DATASET.dateRange[1]}. Approved for research; requires live site measurements for operational validation.
          </>
        )}
      </SourceNote>
    </Panel>
  );
}
