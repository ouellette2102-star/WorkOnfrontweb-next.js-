/**
 * Quebec sales tax helpers.
 *
 * WorkOn is a Quebec-first marketplace and every consumer-facing price
 * must disclose TPS (federal GST, 5%) and TVQ (provincial QST, 9.975%)
 * when applicable (Loi sur la protection du consommateur).
 *
 * Prices shown in the product (boosts, subscriptions, services) are
 * pre-tax — we use these helpers to either annotate "+ taxes" or
 * compute the total TTC for reference.
 *
 * Source of truth: `src/components/mission/booking-recap-card.tsx`
 * has historically carried the same constant. This module centralises
 * it so every screen uses the same rate.
 */

/** Federal GST / TPS rate (Canada). */
export const TPS_RATE = 0.05;

/** Quebec QST / TVQ rate. */
export const TVQ_RATE = 0.09975;

/** Combined Quebec sales tax rate (TPS + TVQ). */
export const QC_COMBINED_TAX_RATE = TPS_RATE + TVQ_RATE; // 0.14975

/** Combined rate as a percentage, e.g. `14.975`. */
export const QC_COMBINED_TAX_PCT = Number(
  (QC_COMBINED_TAX_RATE * 100).toFixed(3),
);

/**
 * Format a decimal rate as a fr-CA percent string (e.g. 0.09975 → "9,975 %").
 */
export function formatTaxPercent(rate: number): string {
  return `${(rate * 100).toLocaleString("fr-CA", {
    maximumFractionDigits: 3,
  })} %`;
}

/**
 * Format a CAD amount in fr-CA locale (e.g. 39 → "39,00 $").
 */
export function formatCAD(amount: number, currency = "CAD"): string {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Compute the TTC (taxes-included) price for a pre-tax amount.
 * Rounded to 2 decimals so it matches what Stripe will charge.
 */
export function priceWithTaxes(preTaxAmount: number): number {
  return Math.round(preTaxAmount * (1 + QC_COMBINED_TAX_RATE) * 100) / 100;
}

/**
 * Canonical short disclaimer, safe to inline anywhere.
 *
 * Returns "+ taxes TPS/TVQ (~14,975 %)" in French. Kept as a plain
 * string so callers can drop it into alt/title attributes as well.
 */
export const TAX_DISCLAIMER_SHORT = `+ taxes TPS/TVQ (~${QC_COMBINED_TAX_PCT.toString().replace(".", ",")} %)`;
