import { FlaskConical, Database, Info } from "lucide-react";
import { ModelMetrics } from "@/components/marea/ModelMetrics";
import { RateOfChangeChart } from "@/components/marea/RateOfChangeChart";
import {
  PageHeader,
  Panel,
  PanelHeader,
  QuietEmpty,
  SourceNote,
  StatusChip,
} from "@/components/marea/primitives";
import { DATASET, DESCRIPTIVE_RANGE, SCIENTIFIC_INTERPRETATION } from "@/data/marea";
import { PageId } from "@/components/marea/AppShell";

const SUMMARY = [
  { label: "Observations", value: DATASET.rows.toLocaleString("en-US"), unit: "daily rows" },
  { label: "Time Coverage", value: "2004 → 2013", unit: "~10 years" },
  {
    label: "Observed Range",
    value: `${DESCRIPTIVE_RANGE.min.toFixed(2)}–${DESCRIPTIVE_RANGE.max.toFixed(2)}`,
    unit: "°C",
  },
  { label: "Lagoon Mean", value: DESCRIPTIVE_RANGE.mean.toFixed(2), unit: "°C" },
];

function pct(v: number) {
  const { min, max } = DESCRIPTIVE_RANGE;
  return ((v - min) / (max - min)) * 100;
}

const MARKERS = [
  { label: "Mean", value: DESCRIPTIVE_RANGE.mean },
  { label: "P90 (90th percentile)", value: DESCRIPTIVE_RANGE.q90Cutoff },
  { label: "P95 (95th percentile)", value: DESCRIPTIVE_RANGE.q95Cutoff },
];

export function Analytics({ onNavigate }: { onNavigate?: (page: PageId) => void }) {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Research · Analytics"
        title="Predictive Analytics & Baseline Benchmarks"
        description="Empirical distribution statistics, seasonal structure, rate of change, and baseline forecast models for Bizerte Lagoon."
        actions={
          <StatusChip tone="caution" icon={<FlaskConical className="size-3.5" />}>
            Research Track
          </StatusChip>
        }
      />

      {/* Dataset Summary Cards */}
      <section aria-label="Dataset summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {SUMMARY.map((s) => (
          <div key={s.label} className="panel px-5 py-4 bg-surface">
            <p className="eyebrow">{s.label}</p>
            <p className="tabular mt-2 text-2xl font-bold text-foreground">
              {s.value}
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">{s.unit}</span>
            </p>
          </div>
        ))}
      </section>

      {/* Temperature Distribution */}
      <Panel className="overflow-hidden">
        <PanelHeader
          eyebrow="Distribution"
          title="Descriptive Temperature Distribution"
          description="Empirical distribution statistics of the supplied historical dataset. These represent statistical percentiles, not operational biological danger limits."
          actions={<StatusChip tone="positive">Verified ML Metrics</StatusChip>}
        />
        <div className="px-5 py-6">
          <div className="relative h-3 w-full rounded-full bg-gradient-to-r from-[var(--color-actual)]/30 via-[var(--color-reference)]/50 to-[var(--color-caution)]/70">
            {MARKERS.map((m) => (
              <span
                key={m.label}
                className="absolute top-1/2 h-6 w-0.5 -translate-y-1/2 bg-foreground"
                style={{ left: `${pct(m.value)}%` }}
                title={`${m.label}: ${m.value.toFixed(2)}°C`}
              />
            ))}
          </div>
          <div className="tabular mt-2 flex justify-between text-xs text-muted-foreground font-mono">
            <span>Min: {DESCRIPTIVE_RANGE.min.toFixed(2)} °C</span>
            <span>Max: {DESCRIPTIVE_RANGE.max.toFixed(2)} °C</span>
          </div>

          <dl className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
            {MARKERS.map((m) => (
              <div key={m.label} className="bg-surface px-5 py-4">
                <dt className="eyebrow">{m.label}</dt>
                <dd className="tabular mt-1.5 text-xl font-bold text-foreground">
                  {m.value.toFixed(2)}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">°C</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <SourceNote>{DESCRIPTIVE_RANGE.note}</SourceNote>
      </Panel>

      {/* Baseline Models Benchmark */}
      <ModelMetrics />

      {/* Rate of change component */}
      <RateOfChangeChart />

      {/* Scientific Governance Statement */}
      <Panel className="overflow-hidden">
        <PanelHeader
          eyebrow="Scientific Governance"
          title="Seasonal Baseline Structure vs. Real-World Forecast Generalization"
          description="Core distinction between climatological expectations and predictive machine learning models."
        />
        <div className="grid grid-cols-1 gap-px bg-border md:grid-cols-2">
          <div className="bg-surface px-5 py-5 space-y-2">
            <StatusChip tone="positive">Empirically Supported</StatusChip>
            <p className="text-sm leading-relaxed text-foreground">
              The historical series exhibits a deterministic annual cycle that serves as an excellent seasonal baseline for Bizerte Lagoon. It establishes the expected reference temperature against which live measurements are compared.
            </p>
          </div>
          <div className="bg-surface px-5 py-5 space-y-2">
            <StatusChip tone="caution">Operational Boundary</StatusChip>
            <p className="text-sm leading-relaxed text-foreground">
              A 0.000 °C error on the 365-day seasonal baseline is a mathematical consequence of exact annual lag-365 repetition in the archive. Operational early-warning forecasting models must be trained and validated on independent live site measurements.
            </p>
          </div>
        </div>
        <SourceNote>{SCIENTIFIC_INTERPRETATION}</SourceNote>
      </Panel>
    </div>
  );
}
