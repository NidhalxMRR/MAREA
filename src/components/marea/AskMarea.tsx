import { useState, useEffect } from "react";
import { MessageSquareText, Sparkle, SendHorizonal, ShieldCheck, HelpCircle, KeyRound, Check, AlertCircle, Loader2 } from "lucide-react";
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

const GUARDRAIL_REFUSAL = 
  "I am MAREA's specialized marine environmental assistant. I am strictly restricted to assisting with Project MAREA, Bizerte Lagoon aquaculture, buoy telemetry, and environmental early warning analytics. Please ask a question related to lagoon water conditions, sensor readings, or thermal risk thresholds.";

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
  const [isThinking, setIsThinking] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [tempKey, setTempKey] = useState("");

  const [chatHistory, setChatHistory] = useState<Message[]>([
    {
      role: "assistant",
      content:
        `Hello. I am MAREA's environmental intelligence copilot for Bizerte Lagoon. Ask any question about real-time IoT buoy telemetry, wave dynamics, water temperature, historical baselines, or aquaculture risk thresholds.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("marea_gemini_api_key") || "";
      setApiKey(savedKey);
      setTempKey(savedKey);
    }
  }, []);

  const saveApiKey = () => {
    const trimmed = tempKey.trim();
    setApiKey(trimmed);
    if (typeof window !== "undefined") {
      localStorage.setItem("marea_gemini_api_key", trimmed);
    }
    setShowKeyInput(false);
  };

  const list = questions ?? DEFAULT_QUESTIONS;

  const handleAsk = async (queryText: string) => {
    if (!queryText.trim() || isThinking) return;

    const userMsg: Message = {
      role: "user",
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatHistory((prev) => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);

    const readings = getReadings();
    const thresholds = getThresholds();
    const latestTemp = getLatestReading('temperature');

    // If Gemini API Key is configured, use live Gemini 1.5 Flash with strict guardrails
    if (apiKey) {
      try {
        const systemPrompt = `You are MAREA Environmental Intelligence Assistant for Project MAREA and Bizerte Lagoon Marine Aquaculture Zone in Tunisia.
CRITICAL DOMAIN GUARDRAIL:
You ONLY answer questions directly related to:
1. Project MAREA architecture, IoT hardware (TTGO LoRa32, DS18B20, MPU6050, GPS NEO-6M).
2. Bizerte Lagoon oceanography, sea-water temperature, and coastal environmental conditions.
3. European Seabass (Dicentrarchus labrax), Gilthead Seabream (Sparus aurata), and Mussel aquaculture physiological limits (optimal 18-24°C, stress >26.5°C, critical >29°C).
4. Real-time buoy telemetry, wave dynamics/acceleration, GPS coordinates, RSSI/SNR.
5. Temperature rate-of-change, marine heatwave risks, hypoxia early warnings.
6. Historical dataset provenance and seasonal baselines.

REJECTION RULE:
If the user asks ANY question outside this domain (e.g. recipes, cocktails like mochitos, general programming, jokes, politics, weather outside Bizerte, non-marine topics):
You MUST politely refuse using this exact message:
"${GUARDRAIL_REFUSAL}"

GROUND TRUTH SITE CONTEXT:
- Site: ${SITE_CONTEXT.name} (${SITE_CONTEXT.coordinates}, Region: ${SITE_CONTEXT.region})
- Latest Water Temp: ${latestTemp ? `${latestTemp.value.toFixed(2)} °C` : 'Awaiting live stream (default ~22.0 °C)'}
- Normal Temperature Range: ${thresholds.find(t => t.sensor_type === 'temperature')?.min_value}°C – ${thresholds.find(t => t.sensor_type === 'temperature')?.max_value}°C
- Historical Annual Mean: ${DESCRIPTIVE_RANGE.mean.toFixed(2)} °C (${DATASET.dateRange[0]} to ${DATASET.dateRange[1]})
- Total Logged Telemetry Readings: ${readings.length}
- Baseline MAE: ${DAILY_BASELINES[0].persistence.mae.toFixed(3)} °C (1-day horizon)`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${systemPrompt}\n\nOperator User Question: ${queryText}` }]
              }
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 600,
            }
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || "Gemini API request failed");
        }

        const data = await res.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to generate a response from Gemini.";

        const assistantMsg: Message = {
          role: "assistant",
          content: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setChatHistory((prev) => [...prev, assistantMsg]);
        setIsThinking(false);
        return;
      } catch (err) {
        console.error("Gemini API error, falling back to local grounded reasoning:", err);
      }
    }

    // Local Grounded Engine with Guardrails (when no key or fallback)
    const q = queryText.toLowerCase();
    let responseText = "";

    // 1. Off-topic guardrail checks
    const offTopicKeywords = [
      "mochito", "mojito", "cocktail", "recipe", "cook", "drink", "food",
      "joke", "song", "movie", "game", "politics", "president", "bitcoin",
      "crypto", "weather in paris", "weather in london", "who made you"
    ];

    const isOffTopic = offTopicKeywords.some(w => q.includes(w));

    if (isOffTopic) {
      responseText = GUARDRAIL_REFUSAL;
    } else if (q.includes("summarize") || q.includes("condition")) {
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

    setChatHistory((prev) => [...prev, assistantMsg]);
    setIsThinking(false);
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
              {apiKey ? "Gemini Live" : "Grounded"}
            </span>
          ) : null}
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md bg-surface">
        <SheetHeader className="border-b border-border p-5 text-left bg-muted/30">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkle aria-hidden className="size-4 text-primary" />
              <SheetTitle className="text-base">Ask MAREA</SheetTitle>
            </div>
            <button
              type="button"
              onClick={() => setShowKeyInput(!showKeyInput)}
              title={apiKey ? "Gemini API Key Configured" : "Configure Gemini API Key"}
              className={cn(
                "flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border transition-colors",
                apiKey
                  ? "border-positive/40 bg-positive/10 text-positive"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
              )}
            >
              <KeyRound className="size-3" />
              {apiKey ? "Gemini Active" : "Set API Key"}
            </button>
          </div>
          <SheetDescription className="text-xs leading-relaxed text-muted-foreground">
            Environmental assistant grounded in MAREA's data, Bizerte Lagoon seasonal records, and site checks.
          </SheetDescription>
          <div className="flex items-center gap-2 mt-1">
            <StatusChip tone={apiKey ? "positive" : "neutral"} className="w-fit">
              {apiKey ? "Gemini AI Active" : "Strict Guardrails Enforced"}
            </StatusChip>
          </div>

          {/* Gemini API Key Configuration Drawer */}
          {showKeyInput && (
            <div className="mt-3 rounded-lg border border-border bg-surface p-3 space-y-2">
              <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <KeyRound className="size-3.5 text-primary" />
                Google Gemini API Key
              </p>
              <p className="text-[0.7rem] text-muted-foreground leading-relaxed">
                Enter your Google AI Studio API key to enable live Gemini 1.5/2.0 reasoning.
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="flex-1 rounded border border-border bg-muted/30 px-2.5 py-1 text-xs text-foreground outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={saveApiKey}
                  className="rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </SheetHeader>

        {/* API Key Prompt Banner if not configured */}
        {!apiKey && !showKeyInput && (
          <div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-amber-700 dark:text-amber-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0 text-amber-500" />
              <span>Connect Google Gemini for dynamic reasoning.</span>
            </div>
            <button
              type="button"
              onClick={() => setShowKeyInput(true)}
              className="text-[0.7rem] font-semibold underline underline-offset-2 shrink-0 hover:opacity-80"
            >
              Insert Key
            </button>
          </div>
        )}

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
                  <span>{msg.role === "assistant" ? (apiKey ? "MAREA Gemini Agent" : "MAREA System") : "Operator"}</span>
                  <span>{msg.timestamp}</span>
                </div>
                <p className="whitespace-pre-line">{msg.content}</p>
              </div>
            ))}

            {isThinking && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin text-primary" />
                <span>MAREA Gemini Agent analyzing telemetry & guardrails...</span>
              </div>
            )}
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
                    disabled={isThinking}
                    className="w-full text-left rounded-lg border border-border bg-surface px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <p className="flex items-start gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-[0.75rem] leading-relaxed text-muted-foreground">
            <ShieldCheck aria-hidden className="mt-px size-3.5 shrink-0 text-positive" />
            Strict domain guardrails active: Responses are strictly restricted to Bizerte Lagoon environmental telemetry and aquaculture early warning.
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
              disabled={isThinking}
              aria-label="Ask MAREA a question"
              placeholder="Ask about temperature, sensors, thresholds..."
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isThinking}
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
