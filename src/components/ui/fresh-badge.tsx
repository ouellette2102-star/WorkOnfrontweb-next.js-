import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * FreshBadge — "Nouveau" pill when something was created within the
 * last N minutes. Keeps the caller stateless: give it a timestamp and
 * it decides whether to render.
 *
 * Defaults to 10 minutes; pass `freshMinutes` to adjust.
 */
export function FreshBadge({
  createdAt,
  freshMinutes = 10,
  className,
  label = "Nouveau",
}: {
  createdAt: string | Date | null | undefined;
  freshMinutes?: number;
  className?: string;
  label?: string;
}) {
  if (!createdAt) return null;
  const ms = new Date(createdAt).getTime();
  if (Number.isNaN(ms)) return null;
  const ageMinutes = (Date.now() - ms) / 60_000;
  if (ageMinutes > freshMinutes || ageMinutes < 0) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-workon-accent text-white px-2 py-0.5 text-[10px] font-semibold shadow-sm animate-pulse",
        className,
      )}
    >
      <Sparkles className="h-2.5 w-2.5" strokeWidth={2.5} />
      {label}
    </span>
  );
}
