"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

/**
 * Visual progress indicator for a mission's lifecycle.
 * 5 steps: Ouverte → Assignée → En cours → Terminée → Payée.
 * "Annulée" shorts the chain with a grey strikeout.
 */
const STEPS = [
  { key: "open", label: "Publiée" },
  { key: "assigned", label: "Acceptée" },
  { key: "in_progress", label: "En cours" },
  { key: "completed", label: "Terminée" },
  { key: "paid", label: "Payée" },
] as const;

function currentIndex(status?: string | null): number {
  if (!status) return 0;
  const s = status.toLowerCase();
  if (s === "cancelled") return -1;
  const idx = STEPS.findIndex((step) => step.key === s);
  return idx === -1 ? 0 : idx;
}

export function MissionProgressBar({
  status,
  compact = false,
  className,
}: {
  status?: string | null;
  compact?: boolean;
  className?: string;
}) {
  const idx = currentIndex(status);
  const cancelled = (status ?? "").toLowerCase() === "cancelled";

  if (cancelled) {
    return (
      <div
        className={cn(
          "rounded-full bg-neutral-100 border border-neutral-200 px-3 py-1 text-xs text-neutral-500",
          className,
        )}
      >
        Mission annulée
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center gap-1">
        {STEPS.map((step, i) => {
          const done = i < idx;
          const active = i === idx;
          return (
            <div key={step.key} className="flex items-center gap-1 flex-1">
              <div
                className={cn(
                  "flex items-center justify-center rounded-full transition-colors",
                  compact ? "h-4 w-4" : "h-5 w-5",
                  done
                    ? "bg-workon-primary text-white"
                    : active
                      ? "bg-workon-primary/20 text-workon-primary ring-2 ring-workon-primary"
                      : "bg-workon-bg-cream text-workon-muted",
                )}
              >
                {done ? (
                  <Check className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} strokeWidth={3} />
                ) : (
                  <span className={compact ? "text-[9px] font-bold" : "text-[10px] font-bold"}>
                    {i + 1}
                  </span>
                )}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 rounded-full transition-colors",
                    done ? "bg-workon-primary" : "bg-workon-bg-cream",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      {!compact && (
        <div className="flex justify-between mt-1.5">
          {STEPS.map((step, i) => (
            <span
              key={step.key}
              className={cn(
                "text-[10px] leading-none",
                i === idx
                  ? "text-workon-primary font-semibold"
                  : i < idx
                    ? "text-workon-ink"
                    : "text-workon-muted",
              )}
            >
              {step.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
