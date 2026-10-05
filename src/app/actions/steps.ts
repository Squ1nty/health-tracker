"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { setDaySteps } from "@/lib/steps/logs";
import {
  MAX_DAY_STEPS,
  MAX_DAYS_BACK,
  formatSteps,
  isLoggableDate,
  parseSteps,
} from "@/lib/steps/shared";
import { createSyncToken, revokeSyncToken } from "@/lib/steps/tokens";

export type SaveStepsResult = { ok: true } | { ok: false; error: string };
export type CreateTokenResult = { ok: true; token: string } | { ok: false; error: string };

const LOGGED_OUT = "Please log in again.";
const SERVER_ERROR = "Something went wrong on our end. Please try again.";

// Sets the logged-in user's step total for one day. Arguments arrive from
// the browser, so they're treated as untrusted.
export async function saveSteps(input: {
  date: string;
  steps: number;
}): Promise<SaveStepsResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: LOGGED_OUT };

  const date = input?.date;
  if (typeof date !== "string" || !isLoggableDate(date)) {
    return {
      ok: false,
      error: `Pick a day from the last ${MAX_DAYS_BACK} days, up to today.`,
    };
  }
  const steps = parseSteps(input?.steps);
  if (steps === null) {
    return {
      ok: false,
      error: `Enter a step count from 0 to ${formatSteps(MAX_DAY_STEPS)}.`,
    };
  }

  try {
    await setDaySteps(user.id, date, steps, "manual");
  } catch (error) {
    console.error("Saving steps failed", error);
    return { ok: false, error: SERVER_ERROR };
  }

  revalidatePath("/steps");
  return { ok: true };
}

// Creates (or replaces) the user's sync token and returns it. This is the
// only time the token is available; only its hash is stored.
export async function createStepSyncToken(): Promise<CreateTokenResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: LOGGED_OUT };

  try {
    const token = await createSyncToken(user.id);
    revalidatePath("/steps");
    return { ok: true, token };
  } catch (error) {
    console.error("Creating sync token failed", error);
    return { ok: false, error: SERVER_ERROR };
  }
}

export async function revokeStepSyncToken(): Promise<SaveStepsResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: LOGGED_OUT };

  try {
    await revokeSyncToken(user.id);
  } catch (error) {
    console.error("Revoking sync token failed", error);
    return { ok: false, error: SERVER_ERROR };
  }

  revalidatePath("/steps");
  return { ok: true };
}
