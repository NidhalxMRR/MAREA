import React, { useState, useRef } from "react";
import { UploadCloud, CheckCircle, AlertCircle, FileSpreadsheet, ArrowRight } from "lucide-react";
import { parseFile, ParsedData } from "@/lib/parseFile";
import { insertReadings, getSensorLabel, getSensorUnit } from "@/lib/db";
import { SensorType } from "@/types/marea";
import { PageHeader, Panel, PanelHeader, SourceNote, StatusChip } from "@/components/marea/primitives";
import { PageId } from "@/components/marea/AppShell";
import { cn } from "@/lib/utils";

type Mapping = {
  timestamp: string;
  sensor_type: string;
  value: string;
};

export function ImportData({ onNavigate }: { onNavigate?: (page: PageId) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [mapping, setMapping] = useState<Mapping>({ timestamp: "", sensor_type: "", value: "" });
  const [status, setStatus] = useState<"idle" | "parsing" | "mapping" | "importing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setStatus("parsing");
    try {
      const data = await parseFile(selectedFile);
      setParsedData(data);
      // Auto-guess mapping
      setMapping({
        timestamp: data.headers.find((h) => h.toLowerCase().includes("date") || h.toLowerCase().includes("time")) || "",
        sensor_type: data.headers.find((h) => h.toLowerCase().includes("type") || h.toLowerCase().includes("sensor") || h.toLowerCase().includes("param") || h.toLowerCase().includes("capteur")) || "",
        value: data.headers.find((h) => h.toLowerCase().includes("val") || h.toLowerCase().includes("t (°c)") || h.toLowerCase().includes("temp")) || "",
      });
      setStatus("mapping");
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Failed to read file.");
    }
  };

  const handleImport = () => {
    if (!parsedData) return;
    setStatus("importing");

    try {
      const readingsToInsert = parsedData.rows
        .filter((row) => row[mapping.timestamp] && row[mapping.value])
        .map((row) => {
          let sensorStr = mapping.sensor_type ? String(row[mapping.sensor_type] || "").toLowerCase() : "temperature";
          let sensorType: SensorType = "temperature";

          if (sensorStr.includes("ph")) sensorType = "ph";
          else if (sensorStr.includes("sal") || sensorStr.includes("psu")) sensorType = "salinity";
          else if (sensorStr.includes("turb") || sensorStr.includes("ntu")) sensorType = "turbidity";
          else if (sensorStr.includes("temp") || sensorStr.includes("c") || sensorStr.includes("t")) sensorType = "temperature";

          // Timestamp parsing
          let ts = row[mapping.timestamp];
          let timestamp = new Date().toISOString();
          if (typeof ts === "number") {
            // Excel date number
            timestamp = new Date((ts - (25567 + 2)) * 86400 * 1000).toISOString();
          } else if (typeof ts === "string") {
            const parsed = new Date(ts);
            if (!isNaN(parsed.getTime())) {
              timestamp = parsed.toISOString();
            }
          }

          let val = parseFloat(String(row[mapping.value]).replace(",", "."));

          return {
            timestamp,
            sensor_type: sensorType,
            value: isNaN(val) ? 0 : val,
            unit: getSensorUnit(sensorType),
            source: "historical" as const,
          };
        });

      insertReadings(readingsToInsert);
      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setErrorMessage("Error occurred during database insertion.");
    }
  };

  const reset = () => {
    setFile(null);
    setParsedData(null);
    setStatus("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operations · Data Ingestion"
        title="Import Historical Research Data"
        description="Ingest historical oceanographic spreadsheets and CSV files (.csv, .xlsx, .xls) directly into the MAREA analytical database."
        actions={<StatusChip tone="neutral">CSV / XLSX Ingestion</StatusChip>}
      />

      {status === "idle" || status === "error" ? (
        <Panel className="overflow-hidden">
          <div
            className="p-12 text-center bg-surface hover:bg-muted/30 transition-colors cursor-pointer flex flex-col items-center justify-center space-y-3"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <UploadCloud className="size-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Click to upload spreadsheet</h3>
              <p className="text-xs text-muted-foreground mt-1">Supports CSV, XLSX, and XLS format files</p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".csv, .xlsx, .xls"
              onChange={handleFileChange}
            />
          </div>
        </Panel>
      ) : null}

      {status === "error" && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 flex items-center gap-3 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {status === "mapping" && parsedData && (
        <Panel className="overflow-hidden">
          <PanelHeader
            eyebrow="Schema Matcher"
            title={`Map Columns for ${file?.name}`}
            description="Match your spreadsheet columns with MAREA data fields."
            actions={<StatusChip tone="positive">{parsedData.rows.length} rows detected</StatusChip>}
          />

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Timestamp / Date Column
                </label>
                <select
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
                  value={mapping.timestamp}
                  onChange={(e) => setMapping({ ...mapping, timestamp: e.target.value })}
                >
                  <option value="">Select column...</option>
                  {parsedData.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Sensor Type (Optional)
                </label>
                <select
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
                  value={mapping.sensor_type}
                  onChange={(e) => setMapping({ ...mapping, sensor_type: e.target.value })}
                >
                  <option value="">Auto-detect / Default Temperature</option>
                  {parsedData.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Measurement Value Column
                </label>
                <select
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
                  value={mapping.value}
                  onChange={(e) => setMapping({ ...mapping, value: e.target.value })}
                >
                  <option value="">Select column...</option>
                  {parsedData.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table Preview */}
            <div className="space-y-2">
              <p className="eyebrow">Spreadsheet Preview (First 5 Rows)</p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 uppercase tracking-wider text-[0.65rem] text-muted-foreground border-b border-border">
                    <tr>
                      {parsedData.headers.map((h) => (
                        <th key={h} className="px-4 py-2 font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-surface font-mono">
                    {parsedData.rows.slice(0, 5).map((row, idx) => (
                      <tr key={idx}>
                        {parsedData.headers.map((h) => (
                          <td key={h} className="px-4 py-2 text-foreground truncate max-w-xs">
                            {String(row[h] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={reset}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={!mapping.timestamp || !mapping.value}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-opacity"
              >
                Import {parsedData.rows.length.toLocaleString()} Measurements
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        </Panel>
      )}

      {status === "success" && (
        <Panel className="overflow-hidden">
          <div className="p-10 text-center flex flex-col items-center justify-center space-y-4">
            <div className="size-12 rounded-full bg-positive/15 text-positive flex items-center justify-center">
              <CheckCircle className="size-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Import Successfully Completed</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-md">
                Your dataset measurements have been stored into the active monitoring database.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={reset}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
              >
                Import Another File
              </button>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate("overview")}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  View in Dashboard →
                </button>
              )}
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
