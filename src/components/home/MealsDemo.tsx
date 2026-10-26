"use client";

import { useEffect, useState } from "react";
import GridLegend, { gridLevel } from "@/components/home/GridLegend";
import { ScribbleArrow, handwriting } from "@/components/home/Scribble";
import MealMacroDials from "@/components/meals/MealMacroDials";
import FadeIn from "@/components/ui/FadeIn";
import type { MacroValues } from "@/lib/meals/shared";

// A sample day's plan, the way the meal tracker lists a real one.
const FOODS: { id: string; name: string; values: MacroValues }[] = [
  { id: "oats", name: "Oats with berries", values: { calories: 350, carbs: 55, protein: 12, fat: 8 } },
  { id: "chicken", name: "Chicken & rice", values: { calories: 600, carbs: 70, protein: 45, fat: 12 } },
  { id: "shake", name: "Protein shake", values: { calories: 200, carbs: 8, protein: 30, fat: 4 } },
  { id: "salmon", name: "Salmon & veg", values: { calories: 550, carbs: 20, protein: 40, fat: 32 } },
];

// How long the finished dials show before the list makes way for the
// message, so the last tick and the dials completing are seen first.
const REVEAL_MS = 900;

// A playable copy of the meal tracker for the get started page: tick off
// the sample day's meals and the macro dials fill. Nothing is saved.
export default function MealsDemo() {
  const [eaten, setEaten] = useState<Set<string>>(new Set());
  const eatenFoods = FOODS.filter((food) => eaten.has(food.id));
  const done = eatenFoods.length === FOODS.length;
  // Whether the list has made way for the message, a moment after the last tick.
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(done), done ? REVEAL_MS : 0);
    return () => clearTimeout(timer);
  }, [done]);

  const toggle = (id: string, on: boolean) =>
    setEaten((current) => {
      const next = new Set(current);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-2">
      {/* The meal grid's legend, with the shade today's ticks would give its
          square picked out, and a scribbled tip pointing up at it. */}
      <GridLegend level={gridLevel(eatenFoods.length, FOODS.length)} />
      <div className="mb-8 flex flex-col items-center text-foreground/75">
        <ScribbleArrow className="-rotate-45" />
        <p className={`${handwriting.className} max-w-64 text-balance text-xl leading-tight`}>
          Every meal you tick fills in your grid, just like water!
        </p>
      </div>

      {/* A scribbled tip pointing down at the dials. */}
      <div className="flex flex-col items-center text-foreground/75">
        <p className={`${handwriting.className} max-w-64 text-balance text-xl leading-tight`}>
          Your macros add up as you tick!
        </p>
        <ScribbleArrow className="rotate-135" />
      </div>

      <div className="w-full overflow-hidden rounded-lg border border-line bg-surface text-left">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <h3 className="text-lg font-semibold text-foreground">Today</h3>
          <p aria-live="polite" className="text-xs text-muted">
            {eatenFoods.length} of {FOODS.length} eaten
          </p>
        </div>

        <MealMacroDials foods={FOODS} eatenFoods={eatenFoods} />

        {done && revealed ? (
          // Once the day's done, the list makes way for a word on meal plans.
          <FadeIn className="border-t border-line px-4 py-5 text-center">
            <p className="font-semibold text-foreground">All done for today!</p>
            <p className="mx-auto mt-1 max-w-xs text-balance text-sm text-muted">
              Eating the same thing every day gets old fast, so save as many meal plans as you
              like and switch between them anytime.
            </p>
            <button
              type="button"
              onClick={() => setEaten(new Set())}
              className="mt-3 cursor-pointer text-sm font-medium text-accent hover:underline"
            >
              Start over
            </button>
          </FadeIn>
        ) : (
          <ul>
            {FOODS.map((food) => (
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
                    className="h-5 w-5 shrink-0 cursor-pointer accent-accent"
                  />
                  <span className="min-w-0 flex-1">{food.name}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted">
                    {food.values.calories} kcal
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
