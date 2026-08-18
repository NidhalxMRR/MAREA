import { useState } from "react";
import { MessageSquareText, Sparkle, SendHorizonal, ShieldCheck, HelpCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { StatusChip } from "./primitives";
import { cn } from "@/lib/utils";
import { DATASET, DESCRIPTIVE_RANGE, DAILY_BASELINES, SITE_CONTEXT } from "@/data/marea";
import { getReadings, getThresholds, getLatestReading } from "@/lib/db";

const DEFAULT_QUESTIONS = [
  "Summarize conditions at this site",
  "Explain this temperature trend",
  "Is the temperature changing unusually fast?",
  "What does the seasonal reference mean?",
  "Is the sensor reporting normally?",
];

export type AskMareaVariant = "rail" | "inline" | "ghost";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export function AskMarea({
  className,
  variant = "rail",
  label = "Ask MAREA",
  questions,
}: {
  className?: string;
  variant?: AskMareaVariant;
  label?: string;
  questions?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState<Message[]>([
    {
      role: "assistant",
      content:
        `Hello. I am MAREA's environmental analytical assistant, grounded in Bizerte Lagoon data and your local sensor observations. Select a prompt below or ask any question about the site, dataset, baselines, or telemetry.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const list = questions ?? DEFAULT_QUESTIONS;

  const handleAsk = (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg: Message = {
      role: "user",
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Synthesize a truthful, grounded response based on actual system facts
    const q = queryText.toLowerCase();
    const readings = getReadings();
    const thresholds = getThresholds();
    const latestTemp = getLatestReading('temperature');

    let responseText = "";

    if (q.includes("summarize") || q.includes("condition")) {
      if (latestTemp) {
        const thresh = thresholds.find(t => t.sensor_type === 'temperature');
        responseText = `Current observation for ${SITE_CONTEXT.name}: latest water temperature is ${latestTemp.value.toFixed(2)} °C (threshold bounds: ${thresh?.min_value}°C – ${thresh?.max_value}°C). Total measurements logged: ${readings.length}. Historical annual average for this lagoon is ${DESCRIPTIVE_RANGE.mean.toFixed(1)} °C.`;
      } else {
        responseText = `At ${SITE_CONTEXT.name} (${SITE_CONTEXT.coordinates}), no live sensor reading has arrived yet. The historical reference indicates an expected annual mean temperature of ${DESCRIPTIVE_RANGE.mean.toFixed(2)} °C across 10 years of data (${DATASET.dateRange[0]} to ${DATASET.dateRange[1]}).`;
      }
    } else if (q.includes("seasonal reference") || q.includes("reference")) {
      responseText = `The seasonal reference is extracted from the researcher workbook (${DATASET.workbook}). In this dataset, daily values repeat identically every 365 days across 3,275 compared pairs. It represents the expected historical seasonal cycle for Bizerte Lagoon, but is not an operational forecast.`;
    } else if (q.includes("fast") || q.includes("rate") || q.includes("change")) {
      const tempReadings = readings.filter(r => r.sensor_type === 'temperature');
      if (tempReadings.length >= 2) {
        const last = tempReadings[tempReadings.length - 1];
        const prev = tempReadings[tempReadings.length - 2];
        const diff = (last.value - prev.value).toFixed(2);
        responseText = `The temperature change between the last two readings is ${diff} °C. In marine aquaculture, rapid swings exceeding 1.5 °C within a few hours indicate potential thermal stress or sensor placement movement.`;
      } else {
        responseText = `Rate of change tracking requires at least two consecutive timestamped sensor readings. Once telemetry arrives from your TTGO LoRa32 sensor, abrupt shifts and day-over-day deltas are computed automatically.`;
      }
    } else if (q.includes("sensor") || q.includes("reporting") || q.includes("hardware")) {
      responseText = `The MAREA sensor node uses a TTGO LoRa32 V1.3 with a DS18B20 1-Wire water probe, MPU6050 IMU, and GPS. It broadcasts a 17-field CSV telemetry packet every 32 seconds at 868.8 MHz. Sensor health flags (tempOK, mpuOK, gpsOK) isolate hardware malfunctions from water anomalies.`;
    } else if (q.includes("baseline") || q.includes("model") || q.includes("forecast")) {
      const b1 = DAILY_BASELINES[0];
      responseText = `Persistence baseline achieves MAE ${b1.persistence.mae.toFixed(3)} °C (1-day horizon). The 365-day seasonal baseline achieves 0.000 °C error due to the exact 365-day cycle in the researcher workbook. Deep learning models (LSTM) will be trained once independent live site stream measurements are validated.`;
    } else {
      responseText = `Understood. Based on MAREA's records for ${SITE_CONTEXT.name}: ${readings.length} live readings in database, active temperature thresholds [${thresholds.find(t=>t.sensor_type==='temperature')?.min_value}°C – ${thresholds.find(t=>t.sensor_type==='temperature')?.max_value}°C], and historical series coverage from ${DATASET.dateRange[0]} to ${DATASET.dateRange[1]}.`;
    }

    const assistantMsg: Message = {
      role: "assistant",
      content: responseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatHistory((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 rounded-lg text-sm font-medium transition-colors",
            variant === "rail" &&
              "min-h-11 w-full border border-ink-border bg-ink-foreground/5 px-3 text-ink-foreground hover:bg-ink-foreground/10",
            variant === "inline" &&
              "min-h-11 w-full border border-border bg-surface px-3 text-foreground hover:border-border-strong",
            variant === "ghost" &&
              "min-h-9 px-2.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground",
            className,
          )}
        >
          <MessageSquareText aria-hidden className={cn("shrink-0", variant === "ghost" ? "size-3.5" : "size-4")} />
          {label}
          {variant !== "ghost" ? (
            <span
              className={cn(
                "ml-auto text-[0.65rem] font-normal",
                variant === "rail" ? "text-ink-muted" : "text-muted-foreground",
              )}
            >
              Live
            </span>
          ) : null}
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md bg-surface">
        <SheetHeader className="border-b border-border p-5 text-left bg-muted/30">
          <div className="flex items-center gap-2">
            <Sparkle aria-hidden className="size-4 text-primary" />
            <SheetTitle className="text-base">Ask MAREA</SheetTitle>
          </div>
          <SheetDescription className="text-xs leading-relaxed text-muted-foreground">
            Environmental assistant grounded in MAREA's data, Bizerte Lagoon seasonal records, and site checks.
          </SheetDescription>
          <StatusChip tone="positive" className="mt-1 w-fit">
            Grounded & Active
          </StatusChip>
        </SheetHeader>

        {/* Conversation history */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div className="space-y-3">
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex flex-col rounded-lg p-3 text-xs sm:text-sm leading-relaxed",
                  msg.role === "assistant"
                    ? "border border-border bg-muted/40 text-foreground"
                    : "bg-primary text-primary-foreground ml-6"
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-1 text-[0.65rem] font-semibold opacity-70">
                  <span>{msg.role === "assistant" ? "MAREA System" : "Operator"}</span>
                  <span>{msg.timestamp}</span>
                </div>
                <p>{msg.content}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="eyebrow mb-2 flex items-center gap-1.5">
              <HelpCircle className="size-3 text-muted-foreground" />
              Suggested questions
            </p>
            <ul className="space-y-1.5">
              {list.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => handleAsk(s)}
                    className="w-full text-left rounded-lg border border-border bg-surface px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <p className="flex items-start gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-[0.75rem] leading-relaxed text-muted-foreground">
            <ShieldCheck aria-hidden className="mt-px size-3.5 shrink-0 text-positive" />
            Answers are strictly referenced against local measurements and researcher repository artefacts.
          </p>
        </div>

        {/* Prompt Input */}
        <div className="border-t border-border p-4 bg-muted/20">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk(input);
            }}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 focus-within:ring-1 focus-within:ring-primary"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Ask MAREA a question"
              placeholder="Ask about temperature, sensors, thresholds..."
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send message"
              className="text-primary disabled:text-border-strong hover:opacity-80 transition-opacity"
            >
              <SendHorizonal className="size-4" />
            </button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
