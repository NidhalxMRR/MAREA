import { FileText, ShieldAlert } from "lucide-react";
import { DataProvenance } from "@/components/marea/DataProvenance";
import { IoTQualityPanel } from "@/components/marea/IoTQualityPanel";
import { PageHeader, Panel, PanelHeader, SourceNote, StatusChip } from "@/components/marea/primitives";
import { DATASET, SCIENTIFIC_INTERPRETATION } from "@/data/marea";
import { PageId } from "@/components/marea/AppShell";

export function Research({ onNavigate }: { onNavigate?: (page: PageId) => void }) {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Research · Transparency"
        title="Dataset Provenance & Scientific Evidence"
        description="Full audit record of source files, cycle diagnostics, researcher authorizations, and operational validation criteria."
        actions={<StatusChip tone="neutral">{DATASET.id}</StatusChip>}
      />

      {/* Complete Data Provenance Card */}
      <DataProvenance />

      {/* Scientific Governance Statement */}
      <Panel className="overflow-hidden">
        <PanelHeader
          eyebrow="Statement"
          title="Scientific Interpretation & Operational Criteria"
          actions={
            <StatusChip tone="neutral" icon={<FileText className="size-3.5" />}>
              ml/reports/metrics
            </StatusChip>
          }
        />
        <div className="px-5 py-5 text-sm leading-relaxed text-foreground space-y-3">
          <p>{SCIENTIFIC_INTERPRETATION}</p>
          <p className="text-muted-foreground text-xs">
            To graduate models from research to operational production, MAREA mandates that all training datasets undergo strict immutable logging, chronological split without random shuffling, and out-of-sample live site validation.
          </p>
        </div>
        <SourceNote>
          When additional researcher datasets arrive, they are parsed via the automated ingestion script and verified for lag cycles before incorporation.
        </SourceNote>
      </Panel>

      {/* Reading Ingestion Quality Panel */}
      <IoTQualityPanel />
    </div>
  );
}
