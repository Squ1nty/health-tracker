// Step constants and helpers shared by the browser and the server.
import { DATE_KEY_PATTERN } from "@/lib/water/shared";

// Sanity cap on one day's steps (well above any real day).
export const MAX_DAY_STEPS = 200000;
// What the progress bar fills toward. Fixed for now; becomes a per-user setting later.
export const DAILY_STEP_GOAL = 10000;
// How far back a day can still be added or corrected.
export const MAX_DAYS_BACK = 30;

// Where a day's count came from.
export type StepSource = "manual" | "shortcut";

export type StepDay = { steps: number; source: StepSource };

export function formatSteps(steps: number) {
  return steps.toLocaleString("en-US");
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Whole days between a YYYY-MM-DD key and the server's UTC date: negative
// for the past, positive for the future. Null if the key isn't a real
// calendar date (e.g. 2026-02-31, which Date would silently roll over).
export function daysFromUtcToday(date: string) {
  if (!DATE_KEY_PATTERN.test(date)) return null;
  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return null;

  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((parsed.getTime() - todayUtc) / DAY_MS);
}

// Dates are the user's local calendar day, which can be one day ahead of
// or behind the server's UTC date, hence the one-day allowance on each end.
export function isLoggableDate(date: string) {
  const offset = daysFromUtcToday(date);
  return offset !== null && offset <= 1 && offset >= -(MAX_DAYS_BACK + 1);
}

// Accepts what a form or an iPhone Shortcut might send: 8432, "8432",
// "8,432" or 8432.0. Returns a whole number, or null if it isn't a usable count.
export function parseSteps(value: unknown) {
  const number =
    typeof value === "string" ? Number(value.replace(/[,\s]/g, "")) : value;
  if (typeof number !== "number" || !Number.isFinite(number)) return null;
  if (typeof value === "string" && value.trim() === "") return null;

  const steps = Math.round(number);
  if (steps < 0 || steps > MAX_DAY_STEPS) return null;
  return steps;
}
