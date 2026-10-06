"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { setMealPlan } from "@/lib/meals/plans";
import { parseMealPlan } from "@/lib/meals/shared";

export type SaveMealPlanResult = { ok: true } | { ok: false; error: string };

// Replaces the logged-in user's meal plan. The argument arrives from the
// browser, so it's treated as untrusted.
export async function saveMealPlan(input: unknown): Promise<SaveMealPlanResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in again." };

  const plan = parseMealPlan(input);
  if (!plan) {
    return { ok: false, error: "That meal plan couldn't be saved. Check the values and try again." };
  }

  try {
    await setMealPlan(user.id, plan);
  } catch (error) {
    console.error("Saving meal plan failed", error);
    return { ok: false, error: "Something went wrong on our end. Please try again." };
  }

  revalidatePath("/meals");
  return { ok: true };
}
