import { useEffect, useState, type ReactNode } from "react";
import { Clock, MoveHorizontal, Radio, Thermometer, Waves, TrendingUp, TrendingDown } from "lucide-react";
import { Panel, SourceNote, StatusChip } from "./primitives";
import { AskMarea } from "./AskMarea";
import { DATASET, DESCRIPTIVE_RANGE, SITE_CONTEXT } from "@/data/marea";
import { getLatestReading, getReadings, getThresholds, getRateOfChange, DATA_UPDATE_EVENT } from "@/lib/db";
import { cn } from "@/lib/utils";

function SecondaryFact({
  icon,
  label,
  value,
  note,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="min-w-0 bg-surface px-4 py-3.5 sm:px-5">
      <div className="flex items-center gap-2">
        <span aria-hidden className="shrink-0 text-muted-foreground [&_svg]:size-4">
          {icon}
        </span>
        <p className="text-sm font-medium leading-snug text-foreground">{label}</p>
      </div>
      <p className="mt-1.5 text-sm font-medium text-foreground">{value}</p>
      {note ? <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{note}</p> : null}
    </div>
  );
}

export function CurrentCondition({ className }: { className?: string }) {
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setDataVersion((v) => v + 1);
    window.addEventListener(DATA_UPDATE_EVENT, handleUpdate);
    return () => window.removeEventListener(DATA_UPDATE_EVENT, handleUpdate);
  }, []);

  const readings = getReadings();
  const latest = getLatestReading('temperature');
  const rate = getRateOfChange('temperature');
  const thresholds = getThresholds();
  const tempThreshold = thresholds.find((t) => t.sensor_type === 'temperature');

  const hasData = latest !== undefined;

  let tempTone: "positive" | "caution" | "critical" | "pending" = "pending";
  let tempStatusLabel = "Waiting for sensor";

  if (hasData && tempThreshold) {
    if (latest.value > tempThreshold.max_value) {
      tempTone = "critical";
      tempStatusLabel = `High (${latest.value.toFixed(1)}°C > ${tempThreshold.max_value}°C)`;
    } else if (latest.value < tempThreshold.min_value) {
      tempTone = "caution";
      tempStatusLabel = `Low (${latest.value.toFixed(1)}°C < ${tempThreshold.min_value}°C)`;
    } else {
      tempTone = "positive";
      tempStatusLabel = "Within Normal Range";
    }
  }

  // Trend determination
  let trendLabel = "Needs two readings";
  let TrendIcon = MoveHorizontal;
  if (rate) {
    if (Math.abs(rate.delta) < 0.05) {
      trendLabel = "Steady (±0.0°C)";
      TrendIcon = MoveHorizontal;
    } else if (rate.delta > 0) {
      trendLabel = `Rising (+${rate.delta.toFixed(2)} °C)`;
      TrendIcon = TrendingUp;
    } else {
      trendLabel = `Falling (${rate.delta.toFixed(2)} °C)`;
      TrendIcon = TrendingDown;
    }
  }

  const lastTimeStr = latest
    ? new Date(latest.timestamp).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "None received";

  const sourceStr = latest
    ? latest.source === "sonde"
      ? "Live TTGO LoRa32 Node"
      : "Imported Historical Series"
    : "No device registered";

  return (
    <Panel className={cn("overflow-hidden", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* Primary — water temperature */}
        <div className="flex flex-col justify-between gap-6 border-b border-border p-5 sm:p-6 lg:border-b-0 lg:border-r">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <p className="eyebrow">Current water condition</p>
              <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold text-foreground">
                <Thermometer aria-hidden className="size-4.5 shrink-0 text-primary" />
                Water temperature
              </h2>
            </div>
            <StatusChip tone={tempTone}>{tempStatusLabel}</StatusChip>
          </div>

          <div>
            <p className="flex items-baseline gap-3">
              {hasData ? (
                <span className="tabular text-5xl leading-none font-bold text-foreground sm:text-6xl">
                  {latest.value.toFixed(2)}
                </span>
              ) : (
                <span aria-hidden className="tabular text-5xl leading-none font-medium text-border-strong sm:text-6xl">
                  ——
                </span>
              )}
              <span className="text-xl font-semibold text-muted-foreground">°C</span>
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {hasData
                ? `Measured at ${SITE_CONTEXT.name}. Normal operating range: ${tempThreshold?.min_value}°C to ${tempThreshold?.max_value}°C.`
                : "No measurement has reached MAREA yet. This is expected while the site sensor is in setup or waiting for incoming LoRa transmission."}
            </p>
          </div>

          <AskMarea
            variant="ghost"
            className="-ml-2.5 self-start"
            label="Ask about conditions here"
            questions={[
              "Summarize conditions at this site",
              "Is the temperature changing unusually fast?",
              "What does the seasonal reference mean?",
            ]}
          />
        </div>

        {/* Secondary facts */}
        <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2">
          <SecondaryFact
            icon={<TrendIcon className="size-4" />}
            label="Temperature trend"
            value={trendLabel}
            note="Computed from consecutive readings."
          />
          <SecondaryFact
            icon={<Waves />}
            label="Expected seasonal level"
            value={`~${DESCRIPTIVE_RANGE.mean.toFixed(1)} °C`}
            note="Historical lagoon annual average."
          />
          <SecondaryFact
            icon={<Clock />}
            label="Last reading"
            value={lastTimeStr}
            note="Timestamp of most recent accepted reading."
          />
          <SecondaryFact
            icon={<Radio />}
            label="Sensor connection"
            value={sourceStr}
            note="Link status of the site monitoring device."
          />
        </div>
      </div>
      <SourceNote>
        Measured values come from active site sensor streams or imported datasets. Expected seasonal levels come from
        the researcher-supplied historical series ({DATASET.dateRange[0]} → {DATASET.dateRange[1]}).
      </SourceNote>
    </Panel>
  );
}
