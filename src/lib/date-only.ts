/**
 * Backend date-only fields can arrive either as YYYY-MM-DD or as UTC midnight
 * ISO strings. For calendar-day UI, parse the YYYY-MM-DD portion as a local
 * date so Montreal/Toronto users do not see the previous day.
 */
export function parseDateOnlyFromApi(value: string | null | undefined): Date | null {
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) {
    const fallback = new Date(value);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, monthIndex, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== monthIndex ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}
