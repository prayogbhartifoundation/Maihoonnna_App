/**
 * Formats a decimal hour value (e.g. 1.0833...) into a human-readable string.
 *
 * Examples:
 *   formatHours(22)       → "22h"
 *   formatHours(21.0833)  → "21h 5min"
 *   formatHours(0.833)    → "50min"
 *   formatHours(0)        → "0h"
 *
 * @param hours  A floating-point number representing hours (can have fractional minutes).
 * @returns      A clean, human-readable duration string.
 */
export function formatHours(hours: number): string {
  if (!hours || hours <= 0) return '0h';

  // Round to the nearest minute to eliminate floating-point noise
  const totalMinutes = Math.round(hours * 60);

  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}
