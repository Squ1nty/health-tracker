"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { getMealPlan, setMealPlan } from "@/lib/meals/plans";
import { addSavedPlan, deleteSavedPlan, reorderSavedPlans } from "@/lib/meals/saved";
import { MAX_SAVED_PLANS, parseMealPlan } from "@/lib/meals/shared";

export type SaveMealPlanResult = { ok: true } | { ok: false; error: string };
export type KeepMealPlanResult = { ok: true; name: string } | { ok: false; error: string };

const LOGGED_OUT = "Please log in again.";
const SERVER_ERROR = "Something went wrong on our end. Please try again.";

const PLAN_ID_PATTERN = /^[a-f0-9]{24}$/;

// Replaces the logged-in user's meal plan. The argument arrives from the
// browser, so it's treated as untrusted.
export async function saveMealPlan(input: unknown): Promise<SaveMealPlanResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: LOGGED_OUT };

  const plan = parseMealPlan(input);
  if (!plan) {
    return { ok: false, error: "That meal plan couldn't be saved. Check the values and try again." };
  }

  try {
    await setMealPlan(user.id, plan);
  } catch (error) {
    console.error("Saving meal plan failed", error);
    return { ok: false, error: SERVER_ERROR };
  }

  revalidatePath("/meals");
  return { ok: true };
}

// Adds a copy of the user's current meal plan to their saved plans. The
// plan is read from the database rather than sent by the browser.
export async function saveCurrentMealPlan(): Promise<KeepMealPlanResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: LOGGED_OUT };

  try {
    const plan = await getMealPlan(user.id);
    if (!plan.rows.some((row) => row.kind === "food")) {
      return { ok: false, error: "Add at least one food item before saving this meal plan." };
    }
    if (!plan.name) {
      return { ok: false, error: "Give this meal plan a name before saving it." };
    }
    if (!(await addSavedPlan(user.id, plan))) {
      return {
        ok: false,
        error: `You can keep up to ${MAX_SAVED_PLANS} meal plans. Delete one to save another.`,
      };
    }

    revalidatePath("/meals");
    revalidatePath("/meals/plans");
    return { ok: true, name: plan.name };
  } catch (error) {
    console.error("Saving a copy of the meal plan failed", error);
    return { ok: false, error: SERVER_ERROR };
  }
}

export async function deleteSavedMealPlan(id: string): Promise<SaveMealPlanResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: LOGGED_OUT };
  if (typeof id !== "string" || !PLAN_ID_PATTERN.test(id)) {
    return { ok: false, error: "That meal plan couldn't be found." };
  }

  try {
    await deleteSavedPlan(user.id, id);
  } catch (error) {
    console.error("Deleting saved meal plan failed", error);
    return { ok: false, error: SERVER_ERROR };
  }

  revalidatePath("/meals");
  revalidatePath("/meals/plans");
  return { ok: true };
}

// Stores the order of the user's saved plans, given every plan id in the
// order they should appear.
export async function reorderSavedMealPlans(ids: string[]): Promise<SaveMealPlanResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: LOGGED_OUT };
  if (
    !Array.isArray(ids) ||
    ids.length > MAX_SAVED_PLANS ||
    new Set(ids).size !== ids.length ||
    !ids.every((id) => typeof id === "string" && PLAN_ID_PATTERN.test(id))
  ) {
    return { ok: false, error: "That order couldn't be saved." };
  }

  try {
    await reorderSavedPlans(user.id, ids);
  } catch (error) {
    console.error("Reordering saved meal plans failed", error);
    return { ok: false, error: SERVER_ERROR };
  }

  revalidatePath("/meals/plans");
  return { ok: true };
}
