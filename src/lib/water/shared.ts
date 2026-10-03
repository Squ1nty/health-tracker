// Water constants and helpers shared by the browser and the server.

// Largest single entry, in either direction (negative entries remove water).
export const MAX_ENTRY_ML = 9999;
// Sanity cap on one day's total.
export const MAX_DAY_ML = 20000;
// What the drop fills toward. Fixed for now; becomes a per-user setting later.
export const DAILY_GOAL_ML = 3000;

export const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Local-time YYYY-MM-DD (toISOString would shift the day across timezones).
export function dateKey(date: Date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

// Under a litre reads as ml ("750 ml"), otherwise litres ("1.25 L").
export function formatVolume(ml: number) {
  if (ml === 0) return "0 L";
  if (ml < 1000) return `${ml} ml`;
  return `${(ml / 1000).toLocaleString("en-US", { maximumFractionDigits: 2 })} L`;
}
