import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * WorkOnWordmark — brand wordmark matching the target mockups.
 *
 * "WorkOn" with the second "o" replaced by a location pin (orange),
 * signalling the location-based instant-mission positioning.
 *
 * Layout:  W o r k · O n   → "W o r k" · [pin] · "n"
 * (we drop the second "o" and use the pin as the glyph)
 *
 * Sizes:
 *   sm  → text-sm      (inline headers)
 *   md  → text-lg      (default)
 *   lg  → text-2xl     (hero footer / auth screens)
 *   xl  → text-4xl     (hero centerpiece)
 *
 * Colors are driven by the surrounding text color; the pin is
 * always the brand orange.
 */

export type WordmarkSize = "sm" | "md" | "lg" | "xl";

const SIZE_CLASSES: Record<WordmarkSize, { text: string; pin: string }> = {
  sm: { text: "text-sm",  pin: "h-3.5 w-3.5" },
  md: { text: "text-lg",  pin: "h-[1.1em] w-[1.1em]" },
  lg: { text: "text-2xl", pin: "h-[1.05em] w-[1.05em]" },
  xl: { text: "text-4xl md:text-5xl", pin: "h-[1em] w-[1em]" },
};

export interface WorkOnWordmarkProps {
  size?: WordmarkSize;
  className?: string;
  /** Override the pin color (defaults to brand orange). */
  pinClassName?: string;
  /** Override the text color (defaults to `currentColor`). */
  textClassName?: string;
}

export function WorkOnWordmark({
  size = "md",
  className,
  pinClassName,
  textClassName,
}: WorkOnWordmarkProps) {
  const { text, pin } = SIZE_CLASSES[size];
  return (
    <span
      aria-label="WorkOn"
      className={cn(
        "inline-flex items-baseline font-bold tracking-tight leading-none whitespace-nowrap",
        text,
        textClassName,
        className,
      )}
    >
      <span aria-hidden>Work</span>
      <PinGlyph className={cn("inline-block self-center mx-[0.03em] text-[#B5382A]", pin, pinClassName)} />
      <span aria-hidden>n</span>
    </span>
  );
}

function PinGlyph({ className }: { className?: string }) {
  // Location pin — flat, solid, matches the hero mockups.
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 6.5 11.4 7.36 12.19a1 1 0 0 0 1.28 0C13.5 21.4 20 15.25 20 10c0-4.42-3.58-8-8-8zm0 10.75A2.75 2.75 0 1 1 12 7.25a2.75 2.75 0 0 1 0 5.5z" />
    </svg>
  );
}
