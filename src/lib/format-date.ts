/**
 * Date formatting helpers — fr-CA locale.
 *
 * QA report items #M7, #53: dates rendered without the year
 * ("Mercredi 29 Avril") on /home and other dashboards. Centralise
 * formatting so the year is always present and locale stays
 * consistent across the app.
 */

const FR_CA = "fr-CA";

const FULL_DATE_FORMATTER = new Intl.DateTimeFormat(FR_CA, {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const DATE_ONLY_FORMATTER = new Intl.DateTimeFormat(FR_CA, {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const TIME_FORMATTER = new Intl.DateTimeFormat(FR_CA, {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const DATETIME_FORMATTER = new Intl.DateTimeFormat(FR_CA, {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const RELATIVE_FORMATTER = new Intl.RelativeTimeFormat(FR_CA, {
  numeric: "auto",
  style: "long",
});

function ensureDate(value: Date | string | number): Date {
  if (value instanceof Date) return value;
  return new Date(value);
}

/**
 * Format full date with weekday + year.
 * Example: "mercredi 29 avril 2026"
 */
export function formatFullDate(value: Date | string | number): string {
  return FULL_DATE_FORMATTER.format(ensureDate(value));
}

/**
 * Format date without weekday, with year.
 * Example: "29 avril 2026"
 */
export function formatDate(value: Date | string | number): string {
  return DATE_ONLY_FORMATTER.format(ensureDate(value));
}

/**
 * Format clock time only.
 * Example: "14:32"
 */
export function formatTime(value: Date | string | number): string {
  return TIME_FORMATTER.format(ensureDate(value));
}

/**
 * Format compact date + time.
 * Example: "29 avr. 2026, 14:32"
 */
export function formatDateTime(value: Date | string | number): string {
  return DATETIME_FORMATTER.format(ensureDate(value));
}

/**
 * Relative human time. "il y a 3 jours", "dans 2 heures".
 */
export function formatRelative(value: Date | string | number): string {
  const target = ensureDate(value).getTime();
  const diffMs = target - Date.now();
  const seconds = Math.round(diffMs / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (Math.abs(seconds) < 60) return RELATIVE_FORMATTER.format(seconds, "second");
  if (Math.abs(minutes) < 60) return RELATIVE_FORMATTER.format(minutes, "minute");
  if (Math.abs(hours) < 24) return RELATIVE_FORMATTER.format(hours, "hour");
  if (Math.abs(days) < 30) return RELATIVE_FORMATTER.format(days, "day");
  const months = Math.round(days / 30);
  if (Math.abs(months) < 12) return RELATIVE_FORMATTER.format(months, "month");
  return RELATIVE_FORMATTER.format(Math.round(months / 12), "year");
}
