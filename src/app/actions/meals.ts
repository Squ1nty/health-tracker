"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { getMealPlan, setMealPlan } from "@/lib/meals/plans";
import {
  deleteSavedPlan,
  duplicateSavedPlan,
  keepPlan,
  reorderSavedPlans,
} from "@/lib/meals/saved";
import { MAX_SAVED_PLANS, parseMealPlan, type SavedPlanSummary } from "@/lib/meals/shared";

export type SaveMealPlanResult = { ok: true } | { ok: false; error: string };
// `updated` is true when the save replaced a plan already saved under that name.
export type KeepMealPlanResult =
  | { ok: true; name: string; updated: boolean }
  | { ok: false; error: string };
export type DuplicateMealPlanResult =
  | { ok: true; plan: SavedPlanSummary }
  | { ok: false; error: string };

const LOGGED_OUT = "Please log in again.";
const SERVER_ERROR = "Something went wrong on our end. Please try again.";

const PLAN_ID_PATTERN = /^[a-f0-9]{24}$/;
const LIST_FULL = `You can keep up to ${MAX_SAVED_PLANS} meal plans. Delete one to save another.`;

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

// Saves the user's current meal plan to their saved plans, under its name:
// a new name adds a plan, a name already in the list updates that plan.
// The plan is read from the database rather than sent by the browser.
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
    const outcome = await keepPlan(user.id, plan);
    if (outcome === "full") return { ok: false, error: LIST_FULL };
    if (outcome === "unchanged") {
      return { ok: false, error: `"${plan.name}" is already saved, with nothing changed since.` };
    }

    revalidatePath("/meals");
    revalidatePath("/meals/plans");
    return { ok: true, name: plan.name, updated: outcome === "updated" };
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

// Adds a numbered copy of a saved plan below it and returns the copy.
export async function duplicateSavedMealPlan(id: string): Promise<DuplicateMealPlanResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: LOGGED_OUT };
  if (typeof id !== "string" || !PLAN_ID_PATTERN.test(id)) {
    return { ok: false, error: "That meal plan couldn't be found." };
  }

  try {
    const copy = await duplicateSavedPlan(user.id, id);
    if (copy === null) return { ok: false, error: "That meal plan couldn't be found." };
    if (copy === "full") return { ok: false, error: LIST_FULL };

    revalidatePath("/meals/plans");
    return { ok: true, plan: copy };
  } catch (error) {
    console.error("Duplicating saved meal plan failed", error);
    return { ok: false, error: SERVER_ERROR };
  }
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
