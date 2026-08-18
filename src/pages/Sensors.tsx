import { SiteContextBar } from "@/components/marea/SiteContext";
import { SystemStatusBanner } from "@/components/marea/SystemStatusBanner";
import { SensorStatus } from "@/components/marea/SensorStatus";
import { IoTQualityPanel } from "@/components/marea/IoTQualityPanel";
import { PageHeader, Panel, PanelHeader, SourceNote, StatusChip } from "@/components/marea/primitives";
import { PageId } from "@/components/marea/AppShell";

const ROADMAP = [
  { label: "1. Device Provisioning", note: "Flash TTGO LoRa32 V1.3 with Tx.ino & calibrate DS18B20 1-Wire probe." },
  { label: "2. RF Link & Gateway", note: "Deploy Rx.ino receiver gateway on 868.8 MHz (SF7/BW125kHz)." },
  { label: "3. Ingestion & Quality Audits", note: "Validate CRC, reject duplicate timestamps & flag implausible jumps." },
  { label: "4. Live Lagoon Telemetry", note: "Continuous 32-second broadcast into monitoring and early-warning pipeline." },
];

export function Sensors({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operations · Equipment"
        title="Sensor Nodes & LoRa Telemetry Fleet"
        description="Physical IoT hardware monitoring, RF transceiver parameters, and live telemetry payload verification for Bizerte Lagoon."
        actions={<StatusChip tone="positive">868.8 MHz Active</StatusChip>}
      />

      <SiteContextBar />
      <SystemStatusBanner onNavigate={onNavigate} />

      {/* Fleet & Telemetry Contract */}
      <SensorStatus />

      {/* Reading Quality Checks */}
      <IoTQualityPanel />

      {/* Deployment Roadmap */}
      <Panel className="overflow-hidden">
        <PanelHeader
          eyebrow="Deployment Programme"
          title="From Hardware Prototype to Continuous Operation"
          description="Standard operating sequence for provisioning and maintaining aquaculture sensor buoys."
        />
        <ol className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
          {ROADMAP.map((step) => (
            <li key={step.label} className="bg-surface px-5 py-4 space-y-1">
              <p className="text-sm font-semibold text-foreground">{step.label}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{step.note}</p>
            </li>
          ))}
        </ol>
        <SourceNote>
          Hardware utilizes 18650 Li-ion power cells with IP67 marine enclosure and vertical external SMA antenna mounting.
        </SourceNote>
      </Panel>
    </div>
  );
}
