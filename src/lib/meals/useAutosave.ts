import { useEffect, useRef, useState } from "react";
import { saveMealPlan } from "@/app/actions/meals";
import type { MealPlan } from "@/lib/meals/shared";

// How long to wait after the last edit before saving.
const SAVE_DELAY_MS = 600;

export type SaveStatus =
  | { kind: "idle" | "saving" | "saved" }
  | { kind: "error"; text: string };

// Saves the meal plan a moment after the last edit. Returns the state of
// the latest save and a function to call with the plan after each edit.
export function useAutosave() {
  const [status, setStatus] = useState<SaveStatus>({ kind: "idle" });

  // The save waiting on its timer, and a counter so that only the latest
  // save reports its result.
  const saver = useRef<{
    timer: ReturnType<typeof setTimeout> | null;
    pending: MealPlan | null;
    count: number;
  }>({ timer: null, pending: null, count: 0 });

  // Leaving the page mid-wait saves right away instead of dropping the edit.
  useEffect(() => {
    const state = saver.current;
    return () => {
      if (state.timer) clearTimeout(state.timer);
      if (state.pending) void saveMealPlan(state.pending);
    };
  }, []);

  const save = (plan: MealPlan) => {
    setStatus({ kind: "saving" });

    const state = saver.current;
    if (state.timer) clearTimeout(state.timer);
    state.pending = plan;
    const count = ++state.count;

    state.timer = setTimeout(async () => {
      const pending = state.pending;
      state.pending = null;
      state.timer = null;
      if (!pending) return;

      let result: SaveStatus;
      try {
        const saved = await saveMealPlan(pending);
        result = saved.ok ? { kind: "saved" } : { kind: "error", text: saved.error };
      } catch {
        result = {
          kind: "error",
          text: "Couldn't reach the server. Check your connection and try again.",
        };
      }
      if (count === state.count) setStatus(result);
    }, SAVE_DELAY_MS);
  };

  return { status, save };
}
