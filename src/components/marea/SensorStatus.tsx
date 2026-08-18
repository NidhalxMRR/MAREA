import { CircleDashed, Cpu, MapPin, Radio, Timer, Wifi } from "lucide-react";
import { Panel, PanelHeader, SourceNote, StatusChip } from "./primitives";
import { IOT_CONTRACT, IOT_HARDWARE_SPECS, SITE_CONTEXT } from "@/data/marea";
import { getReadings } from "@/lib/db";
import { cn } from "@/lib/utils";

const COLUMNS = ["Device ID", "Frequency", "Interval", "Position (GPS)", "DS18B20 Temp", "IMU (MPU6050)", "Link State"];

export function SensorStatus({ className }: { className?: string }) {
  const readings = getReadings();
  const hasLiveFeed = readings.some((r) => r.source === "sonde");

  return (
    <Panel className={cn("overflow-hidden", className)}>
      <PanelHeader
        eyebrow="Fleet Telemetry"
        title="Active Sensor Nodes & LoRa Link"
        description="Physical device connectivity, RF parameters, and sensor health flags matching the TTGO LoRa32 firmware (Tx.ino & Rx.ino)."
        actions={
          <StatusChip tone={hasLiveFeed ? "positive" : "pending"} icon={<Wifi className="size-3.5" />}>
            {hasLiveFeed ? "1 Active Node" : "Awaiting Transmission"}
          </StatusChip>
        }
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[50rem] border-collapse text-sm">
          <caption className="sr-only">Registered MAREA telemetry nodes</caption>
          <thead>
            <tr className="border-b border-border text-left bg-muted/30">
              {COLUMNS.map((c) => (
                <th key={c} scope="col" className="eyebrow px-5 py-3 font-semibold whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border bg-surface">
              <td className="px-5 py-4 font-semibold text-foreground">
                NODE1
                <span className="block text-xs font-normal text-muted-foreground">TTGO LoRa32 V1.3</span>
              </td>
              <td className="tabular px-5 py-4 text-muted-foreground">{IOT_HARDWARE_SPECS.frequency}</td>
              <td className="tabular px-5 py-4 text-muted-foreground">{IOT_HARDWARE_SPECS.sendInterval}</td>
              <td className="px-5 py-4 text-foreground text-xs">
                <span className="font-medium">{SITE_CONTEXT.coordinates}</span>
                <span className="block text-[0.7rem] text-muted-foreground">{SITE_CONTEXT.name}</span>
              </td>
              <td className="px-5 py-4">
                <span className="inline-flex items-center gap-1.5 text-xs text-positive font-medium">
                  <span className="size-2 rounded-full bg-positive" />
                  DS18B20 [GPIO 13]
                </span>
              </td>
              <td className="px-5 py-4">
                <span className="inline-flex items-center gap-1.5 text-xs text-positive font-medium">
                  <span className="size-2 rounded-full bg-positive" />
                  MPU6050 [I2C 0x68]
                </span>
              </td>
              <td className="px-5 py-4">
                <StatusChip tone={hasLiveFeed ? "positive" : "pending"}>
                  {hasLiveFeed ? "Connected" : "Listening (868.8MHz)"}
                </StatusChip>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 17-field Telemetry Contract */}
      <div className="border-t border-border p-5 bg-muted/10 space-y-4">
        <div>
          <p className="eyebrow mb-1">LoRa ASCII CSV Payload Contract (17 Fields)</p>
          <p className="text-xs text-muted-foreground">
            Exact packet structure broadcast by <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">Tx.ino</code> and decoded by <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">Rx.ino</code>.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {IOT_CONTRACT.map((item) => (
            <div key={item.field} className="rounded-lg border border-border bg-surface p-3 text-xs">
              <span className="tabular font-mono font-bold text-primary block">{item.field}</span>
              <span className="text-muted-foreground text-[0.7rem] mt-0.5 block">{item.description}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Timer className="size-3.5 text-primary" /> Interval: {IOT_HARDWARE_SPECS.sendInterval}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Radio className="size-3.5 text-primary" /> RF: {IOT_HARDWARE_SPECS.frequency} ({IOT_HARDWARE_SPECS.modulation})
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Cpu className="size-3.5 text-primary" /> Hardware: {IOT_HARDWARE_SPECS.controller}
          </span>
        </div>
      </div>

      <SourceNote>
        Firmware uses 1-Wire protocol for Dallas DS18B20 digital probe, HardwareSerial2 for TinyGPS++ NMEA parser, and Semtech SX1276 SPI LoRa radio.
      </SourceNote>
    </Panel>
  );
}
