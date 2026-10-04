"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { addWaterLog, getDayTotal } from "@/lib/water/logs";
import {
  DATE_KEY_PATTERN,
  MAX_DAY_ML,
  MAX_ENTRY_ML,
  formatVolume,
} from "@/lib/water/shared";

export type LogWaterResult = { ok: true } | { ok: false; error: string };

const DAY_MS = 24 * 60 * 60 * 1000;

// The browser sends its own local date, since the server can't know the
// user's timezone. Timezones span UTC-12 to UTC+14, so a genuine "today"
// is never more than one calendar day away from the server's UTC date.
function isPlausibleToday(date: string) {
  if (!DATE_KEY_PATTERN.test(date)) return false;
  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  // Rejects impossible dates like 2026-02-31, which Date would roll over.
  if (parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return false;

  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.abs(parsed.getTime() - todayUtc) <= DAY_MS;
}

// Adds an entry to the logged-in user's day. A negative `ml` removes water.
// Arguments arrive from the browser, so they're treated as untrusted even
// though TypeScript gives them types.
export async function logWater(input: {
  ml: number;
  date: string;
}): Promise<LogWaterResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in again to log water." };

  const ml = input?.ml;
  const date = input?.date;

  if (typeof ml !== "number" || !Number.isInteger(ml) || ml === 0) {
    return { ok: false, error: "Enter a whole number of millilitres." };
  }
  if (Math.abs(ml) > MAX_ENTRY_ML) {
    return {
      ok: false,
      error: `One entry can be at most ${formatVolume(MAX_ENTRY_ML)}.`,
    };
  }
  if (typeof date !== "string" || !isPlausibleToday(date)) {
    return { ok: false, error: "Water can only be logged for today." };
  }

  try {
    const dayTotal = await getDayTotal(user.id, date);

    if (ml < 0 && dayTotal + ml < 0) {
      return {
        ok: false,
        error:
          dayTotal === 0
            ? "There's nothing logged today to remove."
            : `You've only logged ${formatVolume(dayTotal)} today, so you can't remove ${formatVolume(-ml)}.`,
      };
    }
    if (dayTotal + ml > MAX_DAY_ML) {
      return {
        ok: false,
        error: `That would put today over ${formatVolume(MAX_DAY_ML)}, which is the most a day can hold.`,
      };
    }

    await addWaterLog(user.id, date, ml);
  } catch (error) {
    console.error("Logging water failed", error);
    return { ok: false, error: "Something went wrong on our end. Please try again." };
  }

  // Re-renders the water page with the new totals.
  revalidatePath("/water");
  return { ok: true };
}
