import { ArrowUpRight, Gauge } from "lucide-react";
import { SiteContextBar } from "@/components/marea/SiteContext";
import { SystemStatusBanner } from "@/components/marea/SystemStatusBanner";
import { CurrentCondition } from "@/components/marea/CurrentCondition";
import { TemperatureChart } from "@/components/marea/TemperatureChart";
import { RateOfChangeChart } from "@/components/marea/RateOfChangeChart";
import { AlertPanel } from "@/components/marea/AlertPanel";
import { EnvironmentalConditions } from "@/components/marea/EnvironmentalConditions";
import { PageHeader, Panel, SourceNote, StatusChip } from "@/components/marea/primitives";
import { AskMarea } from "@/components/marea/AskMarea";
import { PIPELINE_STAGES, DATASET } from "@/data/marea";
import { PageId } from "@/components/marea/AppShell";

const stageTone = {
  available: "positive",
  partial: "caution",
  planned: "pending",
} as const;

const stageLabel = {
  available: "Available",
  partial: "In Progress",
  planned: "Planned",
} as const;

export function Overview({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        eyebrow="Operations · Site Overview"
        title="Your Water Today"
        description="Real-time thermal observations, historical seasonal expectations, and early-warning alerts for Bizerte Lagoon aquaculture."
        actions={<AskMarea variant="inline" className="w-auto" />}
      />

      <SiteContextBar />
      <SystemStatusBanner onNavigate={onNavigate} />

      {/* Primary environmental state */}
      <CurrentCondition />

      {/* Main visualization */}
      <TemperatureChart plain />

      {/* Attention & Rate of change */}
      <section aria-label="Attention" className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <RateOfChangeChart plain className="xl:col-span-2" />
        <AlertPanel compact onNavigate={onNavigate} />
      </section>

      {/* Multi-parameter conditions */}
      <EnvironmentalConditions />

      {/* System Readiness Pipeline */}
      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow mb-1">Programme Readiness</p>
            <h2 className="text-base font-semibold text-foreground">MAREA Capability Pipeline</h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("research")}
            className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Data provenance & evidence
            <ArrowUpRight className="size-4" />
          </button>
        </div>
        <ol className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 xl:grid-cols-3">
          {PIPELINE_STAGES.map((stage, i) => (
            <li key={stage.label} className="bg-surface px-5 py-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <p className="min-w-0 text-sm font-medium text-foreground">
                  <span className="tabular mr-2 text-xs text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {stage.label}
                </p>
                <StatusChip tone={stageTone[stage.state]}>{stageLabel[stage.state]}</StatusChip>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{stage.note}</p>
            </li>
          ))}
        </ol>
        <SourceNote icon={<Gauge className="size-3.5" />}>
          Current historical series: {DATASET.dateRange[0]} → {DATASET.dateRange[1]}. Authorized for research modeling and seasonal baseline reference.
        </SourceNote>
      </Panel>
    </div>
  );
}
