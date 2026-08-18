import type { ReactNode } from "react";
import { CheckCircle2, CircleHelp, FileSpreadsheet, ShieldAlert, ShieldCheck } from "lucide-react";
import { Panel, PanelHeader, StatusChip } from "./primitives";
import { DATASET, DESCRIPTIVE_RANGE } from "@/data/marea";
import { cn } from "@/lib/utils";

function Section({
  title,
  status,
  children,
}: {
  title: string;
  status?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="bg-surface px-5 py-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <h3 className="eyebrow min-w-0">{title}</h3>
        {status}
      </div>
      <dl className="mt-3 space-y-2.5">{children}</dl>
    </section>
  );
}

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="w-44 shrink-0 text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm leading-relaxed text-foreground">{children}</dd>
    </div>
  );
}

export function DataProvenance({ className }: { className?: string }) {
  return (
    <Panel className={cn("overflow-hidden", className)}>
      <PanelHeader
        eyebrow="Provenance & Scientific Governance"
        title="Bizerte Lagoon Dataset Evidence Record"
        description="Dataset origin, verified coverage, cycle repetition diagnostics, and operational clearance boundaries."
        actions={
          <StatusChip tone="neutral" icon={<FileSpreadsheet className="size-3.5" />}>
            {DATASET.id}
          </StatusChip>
        }
      />

      <div className="grid grid-cols-1 gap-px bg-border lg:grid-cols-2">
        <Section title="Raw Source Metadata">
          <Item label="Source Workbook">
            <span className="tabular font-mono text-xs text-primary">{DATASET.workbook}</span>
          </Item>
          <Item label="Worksheet">
            <span className="tabular font-mono text-xs">{DATASET.worksheet}</span>
          </Item>
          <Item label="Extracted Columns">
            <span className="tabular font-mono text-xs">{DATASET.timestampColumn}</span> ·{" "}
            <span className="tabular font-mono text-xs">{DATASET.temperatureColumn}</span>
          </Item>
        </Section>

        <Section title="Temporal Coverage">
          <Item label="Supplied Period">
            {DATASET.dateRange[0]} → {DATASET.dateRange[1]}
          </Item>
          <Item label="Total Daily Rows">{DATASET.rows.toLocaleString("en-US")} rows</Item>
          <Item label="Reported History">{DATASET.statedHistory}</Item>
        </Section>

        <Section title="Statistical Distribution">
          <Item label="Sampling Frequency">{DATASET.samplingFrequency}</Item>
          <Item label="Descriptive Range">
            {DESCRIPTIVE_RANGE.min.toFixed(2)} – {DESCRIPTIVE_RANGE.max.toFixed(2)} °C
          </Item>
          <Item label="Lagoon Mean">{DESCRIPTIVE_RANGE.mean.toFixed(2)} °C</Item>
          <Item label="Threshold Status">No arbitrary biological limits inferred.</Item>
        </Section>

        <Section
          title="Lag-365 Cycle Verification"
          status={<StatusChip tone="caution">100% Repetition</StatusChip>}
        >
          <Item label="Audit Methodology">
            <span className="inline-flex items-start gap-1.5">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-positive" />
              Automated lag-365 comparison across all years
            </span>
          </Item>
          <Item label="Matched Pairs">
            <span className="inline-flex items-start gap-1.5 font-semibold text-foreground">
              {DATASET.repetition.matchingPairs.toLocaleString("en-US")}/
              {DATASET.repetition.comparedPairs.toLocaleString("en-US")} (100% exact match)
            </span>
          </Item>
        </Section>

        <Section title="Known Dataset Characteristics">
          <Item label="Annual Structure">
            Values repeat identically at lag 365. Represents expected climatological/seasonal reference cycle for the lagoon.
          </Item>
          <Item label="Scientific Query">
            <span className="inline-flex items-start gap-1.5 text-xs text-caution-foreground">
              <CircleHelp className="mt-0.5 size-4 shrink-0" />
              {DATASET.openQuestion}
            </span>
          </Item>
        </Section>

        <Section
          title="Research Track Clearance"
          status={<StatusChip tone="positive">Authorized</StatusChip>}
        >
          <Item label="Authorization">{DATASET.research.authorization}</Item>
          <Item label="Clearance Scope">
            Approved for seasonal baseline reference, baseline benchmarking, and model architecture research.
          </Item>
        </Section>
      </div>

      <div className="border-t border-border bg-muted/30 px-5 py-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <h3 className="eyebrow min-w-0">Operational Forecasting Deployment Boundary</h3>
          <StatusChip tone="caution">Site Stream Required</StatusChip>
        </div>
        <p className="mt-2 flex items-start gap-2 text-xs sm:text-sm leading-relaxed text-foreground">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-caution-foreground" />
          <span>
            {DATASET.operational.reason} Real-time TTGO LoRa32 buoy measurements are required to evaluate live year-over-year generalization before operational forecasting clearance.
          </span>
        </p>
      </div>
    </Panel>
  );
}
