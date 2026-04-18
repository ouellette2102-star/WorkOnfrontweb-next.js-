import { cn } from "@/lib/utils";

/**
 * AvatarFallback — deterministic colored initials avatar.
 *
 * When a user has no photo, we never render a grey silhouette — instead we
 * hash their name to a stable background color and show their initials in
 * white. This gives every profile visual identity and makes lists scannable.
 *
 * The color palette is curated (8 on-brand hues) and chosen by modulo of a
 * simple deterministic hash, so the same person always gets the same color.
 */

const PALETTE = [
  { bg: "bg-[#134021]", text: "text-white" }, // workon primary (forest)
  { bg: "bg-[#C96646]", text: "text-white" }, // workon accent (terracotta)
  { bg: "bg-[#8B5CF6]", text: "text-white" }, // violet
  { bg: "bg-[#2563EB]", text: "text-white" }, // blue
  { bg: "bg-[#0891B2]", text: "text-white" }, // cyan
  { bg: "bg-[#D4922A]", text: "text-white" }, // gold
  { bg: "bg-[#DB2777]", text: "text-white" }, // pink
  { bg: "bg-[#475569]", text: "text-white" }, // slate
];

function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export interface AvatarFallbackProps {
  firstName?: string | null;
  lastName?: string | null;
  seed?: string;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

const SIZE_CLASSES: Record<NonNullable<AvatarFallbackProps["size"]>, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-20 w-20 text-2xl",
};

export function AvatarFallback({
  firstName,
  lastName,
  seed,
  size = "md",
  className,
}: AvatarFallbackProps) {
  const initials =
    `${(firstName?.[0] ?? "").toUpperCase()}${(lastName?.[0] ?? "").toUpperCase()}` ||
    "?";
  const key = seed || `${firstName ?? ""}${lastName ?? ""}` || initials;
  const { bg, text } = PALETTE[hash(key) % PALETTE.length];

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold",
        SIZE_CLASSES[size],
        bg,
        text,
        className,
      )}
    >
      {initials}
    </div>
  );
}
