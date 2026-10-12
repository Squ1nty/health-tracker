"use client";

import { useEffect, useRef, useState } from "react";
import { setMealItemEaten } from "@/app/actions/meals";
import MealTrackerGrid from "@/components/meals/MealTrackerGrid";
import type { MealSet } from "@/lib/meals/shared";
import { useTodayKey } from "@/lib/water/useTodayKey";

const UNREACHABLE = "Couldn't reach the server. Check your connection and try again.";

export default function MealTracker({
  planName,
  sets,
  itemsByDate,
  recentEaten,
}: {
  planName: string;
  // The active plan's foods, grouped under their headers.
  sets: MealSet[];
  // How many items were eaten on each logged day, keyed by YYYY-MM-DD.
  itemsByDate: Record<string, number>;
  // The eaten row ids for the days that could be today here (the server
  // doesn't know the user's timezone).
  recentEaten: Record<string, string[]>;
}) {
  // Only the browser knows the user's timezone, so "today" is null on the server.
  const todayKey = useTodayKey();
  const [eatenByDate, setEatenByDate] = useState(recentEaten);
  // Whether the whole plan is listed, rather than just the set that's up next.
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eatenToday = todayKey ? eatenByDate[todayKey] ?? [] : [];
  const eaten = new Set(eatenToday);
  const foods = sets.flatMap((set) => set.foods);
  const eatenCount = foods.filter((food) => eaten.has(food.id)).length;
  // The set that's up next: the first with something still to eat.
  const current = sets.find((set) => set.foods.some((food) => !eaten.has(food.id)));
  const shown = showAll ? sets : current ? [current] : [];

  // Opening the whole plan scrolls the set that's up next to the middle of
  // the screen, or as near as the page allows. Only on opening: ticking
  // items afterwards leaves the page where it is.
  const currentSection = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (showAll) currentSection.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [showAll]);

  const toggle = async (id: string, checked: boolean) => {
    if (!todayKey) return;
    const apply = (on: boolean) =>
      setEatenByDate((all) => {
        const rest = (all[todayKey] ?? []).filter((other) => other !== id);
        return { ...all, [todayKey]: on ? [...rest, id] : rest };
      });

    apply(checked);
    setError(null);
    try {
      const result = await setMealItemEaten({ date: todayKey, rowId: id, eaten: checked });
      if (result.ok) return;
      setError(result.error);
    } catch {
      setError(UNREACHABLE);
    }
    // The save didn't happen, so put the tick back how it was.
    apply(!checked);
  };

  // Full blue is a day with everything eaten. Rounded up to a multiple of
  // four so the grid's four shades split on whole items.
  const scaleMax = Math.max(4, Math.ceil(foods.length / 4) * 4);
  const gridItems = todayKey ? { ...itemsByDate, [todayKey]: eatenToday.length } : itemsByDate;

  return (
    <>
      <MealTrackerGrid itemsByDate={gridItems} scaleMax={scaleMax} />

      {/* Hidden until today's date is known, so ticks don't flash in. */}
      <div
        className={`flex flex-col gap-3 transition-opacity duration-300 ${
          todayKey ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <h2 className="min-w-0 truncate text-lg font-semibold text-foreground">
              Today{planName && ` - ${planName}`}
            </h2>
            <p aria-live="polite" className="shrink-0 text-xs text-muted">
              {eatenCount} of {foods.length} eaten
            </p>
          </div>

          {shown.map((set) => (
            <section key={set.id} ref={set === current ? currentSection : undefined}>
              <h3
                className={`border-t border-line bg-surface-raised/50 px-4 py-2 text-center text-sm font-semibold ${
                  set.foods.every((food) => eaten.has(food.id)) ? "text-faint" : "text-foreground"
                }`}
              >
                {set.name || "Meals"}
              </h3>
              <ul>
                {set.foods.map((food) => (
                  <li key={food.id} className="border-t border-line">
                    <label
                      className={`flex cursor-pointer items-center gap-3 px-4 py-3 text-sm transition-colors duration-200 hover:bg-surface-raised ${
                        eaten.has(food.id) ? "text-faint" : "text-foreground"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={eaten.has(food.id)}
                        onChange={(e) => toggle(food.id, e.target.checked)}
                        disabled={!todayKey}
                        className="h-5 w-5 shrink-0 cursor-pointer accent-accent"
                      />
                      <span className="min-w-0 break-words">{food.name || "Unnamed item"}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {!showAll && !current && (
            <p className="border-t border-line px-4 py-3 text-sm text-muted">
              Nice Job! You&apos;ve hit your calorie and macro targets for today!
            </p>
          )}

          {/* With one set and food left in it, there's nothing more to show. */}
          {(sets.length > 1 || !current) && (
            <button
              type="button"
              onClick={() => setShowAll((all) => !all)}
              aria-expanded={showAll}
              className="w-full cursor-pointer border-t border-line px-4 py-3 text-center text-sm font-medium text-accent transition-colors duration-200 hover:bg-surface-raised"
            >
              {showAll ? "Show less" : "Show more"}
            </button>
          )}
        </div>

        <p
          role={error ? "alert" : undefined}
          className={`text-center text-xs ${error ? "text-danger" : "text-muted"}`}
        >
          {error ?? "Tick an item once you've eaten it. Ticks start fresh each day."}
        </p>
      </div>
    </>
  );
}
