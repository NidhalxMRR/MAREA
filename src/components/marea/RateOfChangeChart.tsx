import { useEffect, useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { EmptyState, Panel, PanelHeader, SourceNote, StatusChip } from "./primitives";
import { AskMarea } from "./AskMarea";
import { getRateOfChange, DATA_UPDATE_EVENT } from "@/lib/db";
import { cn } from "@/lib/utils";

export function RateOfChangeChart({
  className,
  plain,
}: {
  className?: string;
  plain?: boolean;
}) {
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setDataVersion((v) => v + 1);
    window.addEventListener(DATA_UPDATE_EVENT, handleUpdate);
    return () => window.removeEventListener(DATA_UPDATE_EVENT, handleUpdate);
  }, []);

  const rate = getRateOfChange("temperature");

  const hasData = rate !== null;

  return (
    <Panel className={cn("overflow-hidden", className)}>
      <PanelHeader
        eyebrow={plain ? "Recent change" : "Change detection"}
        title={plain ? "How fast the water is changing" : "Temperature rate of change"}
        description={
          plain
            ? "Sudden thermal swings matter more than absolute values. This shows how much water temperature moved between readings."
            : "Day-over-day and hourly difference in °C. Once 15-minute IoT readings arrive this switches to °C/hour for abrupt-change detection."
        }
        actions={
          hasData ? (
            <StatusChip
              tone={Math.abs(rate.delta) > 1.5 ? "caution" : "positive"}
              icon={
                rate.delta > 0 ? (
                  <ArrowUpRight className="size-3.5" />
                ) : rate.delta < 0 ? (
                  <ArrowDownRight className="size-3.5" />
                ) : (
                  <Minus className="size-3.5" />
                )
              }
            >
              {rate.delta > 0 ? `+${rate.delta.toFixed(2)}` : rate.delta.toFixed(2)} °C
            </StatusChip>
          ) : (
            <AskMarea
              variant="ghost"
              label="Ask about change"
              questions={[
                "Is the temperature changing unusually fast?",
                "What counts as an abrupt change?",
                "Explain the recent change at this site",
              ]}
            />
          )
        }
      />

      <div className="p-4 sm:p-5">
        {hasData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-px rounded-lg border border-border bg-border sm:grid-cols-3">
              <div className="bg-surface p-4">
                <p className="eyebrow">Previous Measurement</p>
                <p className="tabular mt-1.5 text-xl font-semibold text-foreground">
                  {rate.previousReading?.value.toFixed(2)}{" "}
                  <span className="text-xs font-normal text-muted-foreground">°C</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground truncate">
                  {new Date(rate.previousReading!.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div className="bg-surface p-4">
                <p className="eyebrow">Current Measurement</p>
                <p className="tabular mt-1.5 text-xl font-semibold text-foreground">
                  {rate.currentReading?.value.toFixed(2)}{" "}
                  <span className="text-xs font-normal text-muted-foreground">°C</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground truncate">
                  {new Date(rate.currentReading!.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div className="bg-surface p-4">
                <p className="eyebrow">Delta Step (ΔT)</p>
                <p className={cn(
                  "tabular mt-1.5 text-xl font-semibold",
                  Math.abs(rate.delta) > 1.5 ? "text-caution-foreground" : "text-positive-foreground"
                )}>
                  {rate.delta > 0 ? `+${rate.delta.toFixed(2)}` : rate.delta.toFixed(2)}{" "}
                  <span className="text-xs font-normal text-muted-foreground">°C</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {Math.abs(rate.delta) > 1.5 ? "Rapid shift detected" : "Normal steady variation"}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Rate of change monitoring protects fish and shellfish harvests from abrupt thermal shock caused by thermoclines, sudden upwelling, or equipment displacement.
            </p>
          </div>
        ) : (
          <EmptyState
            icon={<Activity />}
            title="Change is calculated from real readings"
            description={
              plain
                ? "As soon as two accepted readings exist in the database, MAREA computes and displays the delta here."
                : "Abrupt-change detection begins when timestamped readings are received. Historical differences remain available in the analytics repository."
            }
            className="h-[13rem] sm:h-56"
          />
        )}
      </div>

      <SourceNote>
        No static alarm threshold is fixed. Thermal shock thresholds are evaluated dynamically relative to lagoon baseline temperatures.
      </SourceNote>
    </Panel>
  );
}
