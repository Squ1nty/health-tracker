"use client";

import { useState, useTransition } from "react";
import { logWater } from "@/app/actions/water";
import { QuickAddRow } from "@/components/ui/QuickAdd";
import { MAX_ENTRY_ML, dateKey, formatVolume } from "@/lib/water/shared";

const PRESETS = [
  { ml: 250, label: "Glass" },
  { ml: 500, label: "Bottle" },
  { ml: 750, label: "Sports bottle" },
  { ml: 1000, label: "Large bottle" },
];

const buttonClasses =
  "flex cursor-pointer items-center justify-center rounded-md border border-line bg-surface text-sm font-medium text-foreground transition-colors duration-200 hover:bg-surface-raised";

// Result of the last submit, shown under the Log button.
type Feedback = { kind: "success" | "error"; text: string } | null;

export default function AddWater() {
  const [amount, setAmount] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [pending, startTransition] = useTransition();

  // Negative amounts are allowed so a mislogged entry can be taken back off.
  const value = Number(amount) || 0;

  const adjust = (delta: number) => {
    setFeedback(null);
    setAmount((current) => {
      const next = Math.min(
        MAX_ENTRY_ML,
        Math.max(-MAX_ENTRY_ML, (Number(current) || 0) + delta)
      );
      return next === 0 ? "" : String(next);
    });
  };

  // Keeps an optional leading minus plus up to 4 digits; a lone "-" is kept
  // so the user can type the sign before the number.
  const handleInput = (raw: string) => {
    setFeedback(null);
    const sign = raw.trimStart().startsWith("-") ? "-" : "";
    setAmount(sign + raw.replace(/\D/g, "").slice(0, 4));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (value === 0 || pending) return;

    startTransition(async () => {
      try {
        // The date is read at click time, in the user's own timezone, so an
        // entry just after midnight lands on the new day.
        const result = await logWater({ ml: value, date: dateKey(new Date()) });
        if (result.ok) {
          setAmount("");
          setFeedback({
            kind: "success",
            text: value > 0
              ? `Logged ${formatVolume(value)}.`
              : `Removed ${formatVolume(-value)}.`,
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

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-md flex-col gap-4"
    >
      <QuickAddRow unit="ml" minusVerb="Remove" onAdjust={adjust}>
        <label className="flex h-14 w-28 flex-col items-center justify-center rounded-md border border-line bg-surface transition-colors focus-within:border-accent md:h-16 md:w-32">
          {/* Text input with numeric keyboard rather than type="number", so
              there are no spinner arrows and only a sign and digits get through. */}
          <input
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="0"
            aria-label="Water amount in millilitres"
            className={`w-full bg-transparent text-center text-2xl font-semibold outline-none placeholder:text-faint ${
              value < 0 ? "text-danger" : "text-foreground"
            }`}
          />
          <span className="text-[10px] text-muted">ml</span>
        </label>
      </QuickAddRow>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {PRESETS.map((preset) => (
          <button
            key={preset.ml}
            type="button"
            onClick={() => {
              setFeedback(null);
              setAmount(String(preset.ml));
            }}
            className={`${buttonClasses} flex-col gap-0.5 py-2.5`}
          >
            <span>{formatVolume(preset.ml)}</span>
            <span className="text-xs font-normal text-muted">{preset.label}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="submit"
          disabled={value === 0 || pending}
          className="flex h-11 cursor-pointer items-center justify-center rounded-md bg-accent text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-hover active:scale-[98%] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-accent disabled:active:scale-100"
        >
          {pending
            ? "Saving…"
            : value > 0
              ? `Log ${formatVolume(value)}`
              : value < 0
                ? `Remove ${formatVolume(-value)}`
                : "Log"}
        </button>

        {/* Fixed height so the page doesn't jump when a message appears. */}
        <p
          role={feedback?.kind === "error" ? "alert" : "status"}
          className={`min-h-4 text-center text-xs ${
            feedback?.kind === "error" ? "text-danger" : "text-muted"
          }`}
        >
          {feedback?.text}
        </p>
      </div>
    </form>
  );
}
