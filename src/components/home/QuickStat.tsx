"use client";

import Link from "next/link";
import ChevronRight from "@/components/ui/ChevronRight";
import MealsEaten from "@/components/home/MealsEaten";
import { DAILY_STEP_GOAL, formatSteps } from "@/lib/steps/shared";
import { DAILY_GOAL_ML, formatVolume } from "@/lib/water/shared";
import { useTodayKey } from "@/lib/water/useTodayKey";

// Steps and ml per day, keyed by YYYY-MM-DD.
export type QuickStatData = {
  stepsByDate: Record<string, number>;
  mlByDate: Record<string, number>;
};

type Stat = {
  label: string;
  href: string;
  value: (data: QuickStatData, todayKey: string) => string;
  goal: string;
};

const stats: Stat[] = [
  {
    label: "Steps today",
    href: "/steps",
    value: (data, todayKey) => formatSteps(data.stepsByDate[todayKey] ?? 0),
    goal: `of ${formatSteps(DAILY_STEP_GOAL)}`,
  },
  {
    label: "Water intake",
    href: "/water",
    value: (data, todayKey) => formatVolume(data.mlByDate[todayKey] ?? 0),
    goal: `of ${formatVolume(DAILY_GOAL_ML)}`,
  },
];

// `data` is null when the stats couldn't be loaded.
export default function QuickStat({ data }: { data: QuickStatData | null }) {
  // Only the browser knows the user's timezone, so "today" is null on the server.
  const todayKey = useTodayKey();

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group flex cursor-pointer flex-col gap-1 rounded-lg border border-line bg-surface p-4 transition-colors hover:bg-surface-raised"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">{stat.label}</span>
              <ChevronRight className="text-faint transition-transform group-hover:translate-x-0.5" />
            </div>
            {/* Hidden until today's date is known, so it doesn't flash 0 first. */}
            <span
              className={`flex items-baseline gap-1.5 transition-opacity duration-200 ${
                todayKey ? "opacity-100" : "opacity-0"
              }`}
            >
              <span className="text-xl font-bold text-foreground">
                {data && todayKey ? stat.value(data, todayKey) : "–"}
              </span>
              {data && <span className="text-xs text-muted">{stat.goal}</span>}
            </span>
          </Link>
        ))}
      </div>
      <MealsEaten />
    </div>
  );
}
