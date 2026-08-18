import { useState } from "react";
import { Info, BarChart2 } from "lucide-react";
import { Panel, PanelHeader, StatusChip } from "./primitives";
import {
  DAILY_BASELINES,
  PERSISTENCE_EVALUATION,
  SCIENTIFIC_INTERPRETATION,
  DATASET,
} from "@/data/marea";
import { cn } from "@/lib/utils";

const fmt = (n: number) => (n === 0 ? "0.000" : n.toFixed(3));

export function ModelMetrics({ className }: { className?: string }) {
  const [horizon, setHorizon] = useState(1);
  const active = DAILY_BASELINES.find((h) => h.horizonDays === horizon) ?? DAILY_BASELINES[0]!;

  return (
    <Panel className={cn("overflow-hidden", className)}>
      <PanelHeader
        eyebrow="ML Baseline Benchmarks"
        title="Daily Temperature Forecast Baselines"
        description="Empirical benchmark scores derived from ml/reports/metrics/daily_temperature_baselines.json. Strict chronological time-series evaluation."
        actions={
          <div role="group" aria-label="Forecast horizon" className="flex rounded-lg border border-border bg-secondary p-0.5">
            {DAILY_BASELINES.map((h) => (
              <button
                key={h.horizonDays}
                type="button"
                aria-pressed={horizon === h.horizonDays}
                onClick={() => setHorizon(h.horizonDays)}
                className={cn(
                  "min-h-8 rounded-md px-3 text-xs font-medium transition-colors",
                  horizon === h.horizonDays
                    ? "bg-surface text-foreground shadow-card font-bold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {h.horizonDays}d Horizon
              </button>
            ))}
          </div>
        }
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-sm">
          <caption className="sr-only">
            MAE and RMSE by baseline at a {horizon}-day horizon
          </caption>
          <thead>
            <tr className="border-b border-border text-left bg-muted/30">
              <th scope="col" className="eyebrow px-5 py-3 font-semibold">Forecasting Baseline</th>
              <th scope="col" className="eyebrow px-5 py-3 text-right font-semibold">MAE (°C)</th>
              <th scope="col" className="eyebrow px-5 py-3 text-right font-semibold">RMSE (°C)</th>
              <th scope="col" className="eyebrow px-5 py-3 text-right font-semibold">Evaluated Samples</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border bg-surface">
              <th scope="row" className="px-5 py-3.5 text-left font-medium text-foreground">
                Persistence (Naive Baseline)
                <span className="block text-xs font-normal text-muted-foreground">
                  Carries the last observed temperature forward: ŷ(t+h) = y(t)
                </span>
              </th>
              <td className="tabular px-5 py-3.5 text-right font-mono font-medium">{fmt(active.persistence.mae)}</td>
              <td className="tabular px-5 py-3.5 text-right font-mono font-medium">{fmt(active.persistence.rmse)}</td>
              <td className="tabular px-5 py-3.5 text-right text-muted-foreground">
                {active.persistence.nSamples.toLocaleString("en-US")}
              </td>
            </tr>
            <tr className="bg-surface">
              <th scope="row" className="px-5 py-3.5 text-left font-medium text-foreground">
                Seasonal Persistence (365 Days)
                <span className="block text-xs font-normal text-muted-foreground">
                  {active.seasonal.start} → {active.seasonal.end}
                </span>
              </th>
              <td className="tabular px-5 py-3.5 text-right font-mono font-medium text-positive-foreground">{fmt(active.seasonal.mae)}</td>
              <td className="tabular px-5 py-3.5 text-right font-mono font-medium text-positive-foreground">{fmt(active.seasonal.rmse)}</td>
              <td className="tabular px-5 py-3.5 text-right text-muted-foreground">
                {active.seasonal.nSamples.toLocaleString("en-US")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="space-y-3 border-t border-border bg-muted/20 px-5 py-4">
        <div className="flex items-start gap-2.5">
          <Info className="mt-0.5 size-4 shrink-0 text-caution-foreground" />
          <div className="text-xs sm:text-sm">
            <p className="font-semibold text-foreground">
              Why Seasonal Baseline Error is 0.000 °C:
            </p>
            <p className="mt-1 text-muted-foreground leading-relaxed">
              In the supplied research file, daily temperatures repeat identically every {DATASET.repetition.lagRows} rows (
              {DATASET.repetition.matchingPairs.toLocaleString("en-US")} of {DATASET.repetition.comparedPairs.toLocaleString("en-US")} pairs match). 
              A 365-day seasonal baseline therefore reproduces the target identically. {SCIENTIFIC_INTERPRETATION}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-3 text-xs flex flex-wrap items-center justify-between gap-2">
          <span className="text-muted-foreground">
            Held-out Persistence Test ({PERSISTENCE_EVALUATION.nSamples} samples): MAE <strong className="text-foreground">{fmt(PERSISTENCE_EVALUATION.mae)}°C</strong> · RMSE <strong className="text-foreground">{fmt(PERSISTENCE_EVALUATION.rmse)}°C</strong> · R² <strong className="text-foreground">{PERSISTENCE_EVALUATION.r2.toFixed(4)}</strong>
          </span>
          <StatusChip tone="neutral" icon={<BarChart2 className="size-3" />}>
            Chronological Split
          </StatusChip>
        </div>
      </div>
    </Panel>
  );
}
