"use client";

import { useState, useTransition } from "react";
import { saveSteps } from "@/app/actions/steps";
import ActivityGrid from "@/components/ui/ActivityGrid";
import StepsRing from "@/components/steps/StepsRing";
import {
  DAILY_STEP_GOAL,
  MAX_DAY_STEPS,
  MAX_DAYS_BACK,
  formatSteps,
  type StepDay,
} from "@/lib/steps/shared";
import { dateKey } from "@/lib/water/shared";
import { useTodayKey } from "@/lib/water/useTodayKey";

// Outer steps are bigger, so their buttons are taller; sizes shrink toward the input.
const STEPS = [
  { amount: 1000, className: "h-12 w-14 md:h-14 md:w-16" },
  { amount: 100, className: "h-10 w-12 md:h-11 md:w-14" },
];

const buttonClasses =
  "flex cursor-pointer items-center justify-center rounded-md border border-line bg-surface text-sm font-medium text-foreground transition-colors duration-200 hover:bg-surface-raised";

const SOURCE_LABELS = { manual: "entered manually", shortcut: "synced from iPhone" };

function parseKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function shortDay(key: string) {
  return parseKey(key).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

const formatGridValue = (steps: number) => `${formatSteps(steps)} steps`;

// Result of the last save, shown under the Save button.
type Feedback = { kind: "success" | "error"; text: string } | null;

export default function StepsTracker({
  stepsByDate,
}: {
  // Each logged day's total, keyed by YYYY-MM-DD.
  stepsByDate: Record<string, StepDay>;
}) {
  // Only the browser knows the user's timezone, so "today" is null on the server.
  const todayKey = useTodayKey();
  const todaySteps = todayKey ? stepsByDate[todayKey]?.steps ?? 0 : 0;
  const percent = Math.round((todaySteps / DAILY_STEP_GOAL) * 100);
  const goalReached = todaySteps >= DAILY_STEP_GOAL;

  // The day being edited. Null means today; a past day is picked by
  // tapping its square in the grid.
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [pending, startTransition] = useTransition();

  const editDate = pickedDate ?? todayKey;
  const existing = editDate ? stepsByDate[editDate] : undefined;
  const editingToday = editDate === todayKey;
  const dayName = editDate && !editingToday ? shortDay(editDate) : "today";

  // Oldest day that can still be edited (YYYY-MM-DD keys sort as text).
  const oldestKey = todayKey
    ? dateKey(new Date(parseKey(todayKey).setDate(parseKey(todayKey).getDate() - MAX_DAYS_BACK)))
    : null;

  const pickDay = (key: string) => {
    setPickedDate(key === todayKey ? null : key);
    setAmount("");
    setFeedback(null);
  };

  // A day holds one total, so the +/- buttons nudge from what's already
  // saved for that day rather than from zero.
  const adjust = (delta: number) => {
    setFeedback(null);
    setAmount((current) => {
      const base = current === "" ? existing?.steps ?? 0 : Number(current);
      return String(Math.min(MAX_DAY_STEPS, Math.max(0, base + delta)));
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (amount === "" || !editDate || pending) return;
    const steps = Number(amount);

    startTransition(async () => {
      try {
        const result = await saveSteps({ date: editDate, steps });
        if (result.ok) {
          setAmount("");
          setFeedback({
            kind: "success",
            text: `Saved ${formatSteps(steps)} steps for ${dayName}.`,
          });
        } else {
          setFeedback({ kind: "error", text: result.error });
        }
      } catch {
        setFeedback({
          kind: "error",
          text: "Couldn't reach the server. Check your connection and try again.",
        });
      }
    });
  };

  const gridValues: Record<string, number> = {};
  for (const [key, day] of Object.entries(stepsByDate)) gridValues[key] = day.steps;

  return (
    <>
      <div className="flex justify-center pt-4">
        <StepsRing level={todaySteps / DAILY_STEP_GOAL}>
          {/* Hidden until today's date is known, so it doesn't flash 0 first. */}
          <div
            aria-live="polite"
            className={`flex flex-col items-center gap-1 transition-opacity duration-300 ${
              todayKey ? "opacity-100" : "opacity-0"
            }`}
          >
            <p className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              {formatSteps(todaySteps)}
            </p>
            <p className="text-xs text-muted">of {formatSteps(DAILY_STEP_GOAL)} steps today</p>
            <p className={`text-xs ${goalReached ? "font-medium text-accent" : "text-faint"}`}>
              {percent}%{goalReached && ", goal reached"}
            </p>
          </div>
        </StepsRing>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mx-auto flex w-full max-w-md flex-col gap-4"
      >
        <p className="min-h-5 text-center text-sm text-muted">
          {editDate && (
            <>
              Steps for <span className="font-medium text-foreground">{dayName}</span>
              {existing && ` · ${formatSteps(existing.steps)} ${SOURCE_LABELS[existing.source]}`}
              {!editingToday && (
                <>
                  {" · "}
                  <button
                    type="button"
                    onClick={() => todayKey && pickDay(todayKey)}
                    className="cursor-pointer text-accent hover:underline"
                  >
                    back to today
                  </button>
                </>
              )}
            </>
          )}
        </p>

        <div className="flex items-center justify-center gap-1.5 md:gap-2">
          {STEPS.map((step) => (
            <button
              key={`minus-${step.amount}`}
              type="button"
              onClick={() => adjust(-step.amount)}
              aria-label={`Subtract ${step.amount} steps`}
              className={`${buttonClasses} ${step.className}`}
            >
              -{step.amount}
            </button>
          ))}

          <label className="flex h-14 w-28 flex-col items-center justify-center rounded-md border border-line bg-surface transition-colors focus-within:border-accent md:h-16 md:w-32">
            {/* Text input with numeric keyboard rather than type="number", so
                there are no spinner arrows and only digits get through. */}
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => {
                setFeedback(null);
                setAmount(e.target.value.replace(/\D/g, "").slice(0, 6));
              }}
              placeholder={existing ? String(existing.steps) : "0"}
              aria-label={`Total steps for ${dayName}`}
              className="w-full bg-transparent text-center text-2xl font-semibold text-foreground outline-none placeholder:text-faint"
            />
            <span className="text-[10px] text-muted">steps</span>
          </label>

          {[...STEPS].reverse().map((step) => (
            <button
              key={`plus-${step.amount}`}
              type="button"
              onClick={() => adjust(step.amount)}
              aria-label={`Add ${step.amount} steps`}
              className={`${buttonClasses} ${step.className}`}
            >
              +{step.amount}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="submit"
            disabled={amount === "" || !editDate || pending}
            className="flex h-11 cursor-pointer items-center justify-center rounded-md bg-accent text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-hover active:scale-[98%] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-accent disabled:active:scale-100"
          >
            {pending
              ? "Saving…"
              : amount === ""
                ? "Save steps"
                : `Set ${dayName} to ${formatSteps(Number(amount))} steps`}
          </button>

          {/* Fixed height so the page doesn't jump when a message appears. */}
          <p
            role={feedback?.kind === "error" ? "alert" : "status"}
            className={`min-h-4 text-center text-xs ${
              feedback?.kind === "error" ? "text-danger" : "text-muted"
            }`}
          >
            {feedback?.text ??
              "Enter the day's total. Tap a square in the grid to fix a past day."}
          </p>
        </div>
      </form>

      <ActivityGrid
        valueByDate={gridValues}
        scaleMax={DAILY_STEP_GOAL}
        formatValue={formatGridValue}
        emptyLabel="No steps logged"
        selectedDate={pickedDate}
        onSelectDate={pickDay}
        isSelectable={(key) =>
          Boolean(todayKey && oldestKey) && key <= todayKey! && key >= oldestKey!
        }
      />
    </>
  );
}
