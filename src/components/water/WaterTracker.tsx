"use client";

import ActivityGrid from "@/components/ui/ActivityGrid";
import AddWater from "@/components/water/AddWater";
import WaterDrop from "@/components/water/WaterDrop";
import { DAILY_GOAL_ML, formatVolume } from "@/lib/water/shared";
import { useTodayKey } from "@/lib/water/useTodayKey";

// Top of the grid's color scale: days over 3 L show as full blue.
const GRID_SCALE_MAX_ML = 4000;

// Ties the water page together. The server supplies the per-day totals;
// "today" has to be worked out here in the browser, because only the
// browser knows the user's timezone.
export default function WaterTracker({
  mlByDate,
}: {
  // Millilitres logged per day, keyed by YYYY-MM-DD.
  mlByDate: Record<string, number>;
}) {
  const todayKey = useTodayKey();
  const todayMl = todayKey ? mlByDate[todayKey] ?? 0 : 0;
  const percent = Math.round((todayMl / DAILY_GOAL_ML) * 100);
  const goalReached = todayMl >= DAILY_GOAL_ML;

  return (
    <>
      <div className="flex flex-col items-center gap-3">
        <WaterDrop level={todayMl / DAILY_GOAL_ML} />
        {/* The drop is full at the goal, so past that point this number is
            the only thing that shows a change; it's kept large for that
            reason. Hidden until today's date is known, so it doesn't flash
            "0 L" before the real total appears. */}
        <div
          aria-live="polite"
          className={`flex flex-col items-center gap-1 transition-opacity duration-300 ${
            todayKey ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="text-4xl font-bold tracking-tight text-foreground">
            {formatVolume(todayMl)}
          </p>
          <p className="text-sm text-muted">
            of {formatVolume(DAILY_GOAL_ML)} today ·{" "}
            <span className={goalReached ? "font-medium text-accent" : ""}>
              {percent}%{goalReached && ", goal reached"}
            </span>
          </p>
        </div>
      </div>
      <AddWater />
      <ActivityGrid
        valueByDate={mlByDate}
        scaleMax={GRID_SCALE_MAX_ML}
        formatValue={formatVolume}
        emptyLabel="No water logged"
      />
    </>
  );
}
