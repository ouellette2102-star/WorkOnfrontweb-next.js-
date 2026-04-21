import { cn } from "@/lib/utils";
import {
  QC_COMBINED_TAX_PCT,
  priceWithTaxes,
  formatCAD,
} from "@/lib/tax";

/**
 * Short, reusable "+ taxes TPS/TVQ" tag placed under or beside any
 * consumer-facing price. Quebec consumer protection law (Loi sur la
 * protection du consommateur) requires the tax status of an advertised
 * price to be disclosed.
 *
 * Variants:
 *   - `short` (default) → "+ taxes TPS/TVQ (~14,975 %)"
 *   - `ttc` with a `preTaxAmount` prop → appends the computed TTC
 *     total so users know the final charge (e.g. "≈ 44,84 $ TTC").
 */
export type TaxDisclaimerProps = {
  /** Render the TTC total alongside when set. Value is in CAD dollars. */
  preTaxAmount?: number;
  /** Extra classes on the root span. */
  className?: string;
  /** Compact rendering (no extra spacing). Default false. */
  compact?: boolean;
};

export function TaxDisclaimer({
  preTaxAmount,
  className,
  compact,
}: TaxDisclaimerProps) {
  const pctLabel = QC_COMBINED_TAX_PCT.toString().replace(".", ",");
  const ttc =
    typeof preTaxAmount === "number"
      ? ` · ≈ ${formatCAD(priceWithTaxes(preTaxAmount))} TTC`
      : "";

  return (
    <span
      className={cn(
        "text-workon-muted",
        compact ? "text-[11px]" : "text-xs",
        className,
      )}
      aria-label="Taxes non incluses — sujettes à la TPS et TVQ du Québec"
    >
      + taxes TPS/TVQ (~{pctLabel} %){ttc}
    </span>
  );
}
