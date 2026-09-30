"use client";

import { useState } from "react";

const MAX_ML = 9999;

// Outer steps are bigger, so their buttons are taller; sizes shrink toward the input.
const STEPS = [
  { ml: 250, className: "h-12 w-14 md:h-14 md:w-16" },
  { ml: 100, className: "h-10 w-12 md:h-11 md:w-14" },
];

const PRESETS = [
  { ml: 250, label: "Glass" },
  { ml: 500, label: "Bottle" },
  { ml: 750, label: "Sports bottle" },
  { ml: 1000, label: "Large bottle" },
];

const buttonClasses =
  "flex cursor-pointer items-center justify-center rounded-md border border-line bg-surface text-sm font-medium text-foreground transition-colors duration-200 hover:bg-surface-raised";

function formatVolume(ml: number) {
  return ml >= 1000 ? `${ml / 1000} L` : `${ml} ml`;
}

// Front end only for now: the amount lives in local state and isn't logged
// anywhere or connected to the drop or grid yet.
export default function AddWater() {
  const [amount, setAmount] = useState("");

  // Negative amounts are allowed so a mislogged entry can be taken back off.
  const value = Number(amount) || 0;

  const adjust = (delta: number) =>
    setAmount((current) => {
      const next = Math.min(MAX_ML, Math.max(-MAX_ML, (Number(current) || 0) + delta));
      return next === 0 ? "" : String(next);
    });

  // Keeps an optional leading minus plus up to 4 digits; a lone "-" is kept
  // so the user can type the sign before the number.
  const handleInput = (raw: string) => {
    const sign = raw.trimStart().startsWith("-") ? "-" : "";
    setAmount(sign + raw.replace(/\D/g, "").slice(0, 4));
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <div className="flex items-center justify-center gap-1.5 md:gap-2">
        {STEPS.map((step) => (
          <button
            key={`minus-${step.ml}`}
            type="button"
            onClick={() => adjust(-step.ml)}
            aria-label={`Remove ${step.ml} ml`}
            className={`${buttonClasses} ${step.className}`}
          >
            -{step.ml}
          </button>
        ))}

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

        {[...STEPS].reverse().map((step) => (
          <button
            key={`plus-${step.ml}`}
            type="button"
            onClick={() => adjust(step.ml)}
            aria-label={`Add ${step.ml} ml`}
            className={`${buttonClasses} ${step.className}`}
          >
            +{step.ml}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {PRESETS.map((preset) => (
          <button
            key={preset.ml}
            type="button"
            onClick={() => setAmount(String(preset.ml))}
            className={`${buttonClasses} flex-col gap-0.5 py-2.5`}
          >
            <span>{formatVolume(preset.ml)}</span>
            <span className="text-xs font-normal text-muted">{preset.label}</span>
          </button>
        ))}
      </div>

      {/* TODO: save the entry and reset the input once logging is built. */}
      <button
        type="button"
        disabled={value === 0}
        className="flex h-11 cursor-pointer items-center justify-center rounded-md bg-accent text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-hover active:scale-[98%] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-accent disabled:active:scale-100"
      >
        {value > 0
          ? `Log ${formatVolume(value)}`
          : value < 0
            ? `Remove ${formatVolume(-value)}`
            : "Log"}
      </button>
    </div>
  );
}
