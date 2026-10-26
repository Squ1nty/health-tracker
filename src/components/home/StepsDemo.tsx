"use client";

import { useEffect, useState } from "react";
import GridLegend, { gridLevel } from "@/components/home/GridLegend";
import { ScribbleArrow, handwriting } from "@/components/home/Scribble";
import StepsRing from "@/components/steps/StepsRing";
import { DAILY_STEP_GOAL, formatSteps } from "@/lib/steps/shared";

// The simulated day runs from 6 am to 11 pm, over this many seconds.
const DAY_START_HOUR = 6;
const DAY_END_HOUR = 23;
const DAY_MS = 14000;
// How long the finished day holds before the next one starts.
const HOLD_MS = 2000;
const TICK_MS = 100;

// Bursts of walking through the day: when each is centred (hour), how long
// it takes (hours), and how many steps it adds.
const WALKS = [
  { at: 8, hours: 1, steps: 2200 },
  { at: 12.5, hours: 1, steps: 2600 },
  { at: 15, hours: 2, steps: 1400 },
  { at: 18, hours: 1.2, steps: 3600 },
  { at: 20.5, hours: 1.5, steps: 900 },
];

const smooth = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

// Steps walked by a given hour: each burst ramps in smoothly over its span.
function stepsAt(hour: number) {
  const steps = WALKS.reduce(
    (total, walk) => total + walk.steps * smooth((hour - walk.at) / walk.hours + 0.5),
    0
  );
  return Math.round(steps / 10) * 10;
}

function formatHour(hour: number) {
  const h = Math.floor(hour);
  // Shown in 15 minute steps, so the clock doesn't flicker.
  const m = Math.floor(((hour - h) * 60) / 15) * 15;
  const suffix = h >= 12 ? "pm" : "am";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
}

// The step ring for the get started page, playing through a made-up day on
// a loop: the clock runs, steps build up with each walk, and the grid's
// shade climbs with them. Anyone who's asked for reduced motion sees the
// finished day instead.
export default function StepsDemo() {
  // How far through the loop (day plus hold) we are, in ms.
  const [elapsed, setElapsed] = useState(0);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) {
      // A timer, like the ticks below, rather than setting state mid-effect.
      const timer = setTimeout(() => setStill(true), 0);
      return () => clearTimeout(timer);
    }
    const timer = setInterval(
      () => setElapsed((current) => (current + TICK_MS) % (DAY_MS + HOLD_MS)),
      TICK_MS
    );
    return () => clearInterval(timer);
  }, []);

  const progress = still ? 1 : Math.min(1, elapsed / DAY_MS);
  const hour = DAY_START_HOUR + progress * (DAY_END_HOUR - DAY_START_HOUR);
  const steps = stepsAt(hour);
  const goalReached = steps >= DAILY_STEP_GOAL;

  return (
    <div className="flex flex-col items-center gap-2">
      <GridLegend level={gridLevel(steps, DAILY_STEP_GOAL)} />
      <div className="mb-6 flex flex-col items-center text-foreground/75">
        <ScribbleArrow className="-rotate-45" />
        <p className={`${handwriting.className} max-w-64 text-balance text-xl leading-tight`}>
          Your steps fill in a square every day too!
        </p>
      </div>

      <StepsRing level={steps / DAILY_STEP_GOAL}>
        <p className="text-xs font-medium tabular-nums text-foreground/70">{formatHour(hour)}</p>
        <p className="text-4xl font-bold tracking-tight tabular-nums text-foreground md:text-5xl">
          {formatSteps(steps)}
        </p>
        <p className="text-xs text-foreground/70">of {formatSteps(DAILY_STEP_GOAL)} steps</p>
        <p
          className={`text-xs font-medium text-foreground transition-opacity duration-300 ${
            goalReached ? "opacity-100" : "opacity-0"
          }`}
        >
          Goal reached!
        </p>
      </StepsRing>
    </div>
  );
}
