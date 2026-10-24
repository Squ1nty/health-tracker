"use client";

import { useEffect, useRef, useState } from "react";
import { ScribbleArrow, handwriting } from "@/components/home/Scribble";
import GridLegend, { gridLevel } from "@/components/home/GridLegend";
import WaterDrop from "@/components/water/WaterDrop";
import { QUICK_ADD_MAX } from "@/lib/quickAdd/shared";
import { formatVolume } from "@/lib/water/shared";

// Smaller than the real daily goal, so a few taps fill the drop.
const DEMO_GOAL_ML = 2000;

const boxClasses =
  "flex h-11 w-24 items-center justify-center rounded-md border border-white/20 bg-white/10 text-sm font-semibold text-foreground transition-all duration-200";

const itemClasses =
  "block w-full cursor-pointer px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-line";

// A playable copy of the water tracker for the get started page: tap to log
// or take back a drink and the drop fills or empties, and the quick add
// buttons can be changed through the same menu as the real page. Nothing is
// saved.
export default function WaterDemo() {
  const [ml, setMl] = useState(0);
  // The two buttons' amounts: minus, then plus.
  const [amounts, setAmounts] = useState([250, 250]);
  // Non-null while the buttons are being edited: what's typed in each box.
  const [drafts, setDrafts] = useState<string[] | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);

  // While open, a click anywhere else or Escape closes the menu.
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const adjust = (delta: number) =>
    setMl((current) => Math.min(DEMO_GOAL_ML, Math.max(0, current + delta)));


  const parsed = drafts?.map(Number);
  const valid = parsed?.every((amount) => amount >= 1 && amount <= QUICK_ADD_MAX) ?? false;
  const save = () => {
    if (!parsed || !valid) return;
    setAmounts(parsed);
    setDrafts(null);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* The water grid's legend, with the shade today's drop would give
          its square picked out. */}
      <GridLegend level={gridLevel(ml, DEMO_GOAL_ML)} />
      <div className="flex flex-col items-center text-foreground/75">
        <ScribbleArrow className="-rotate-45" />
        <p className={`${handwriting.className} max-w-64 text-balance text-xl leading-tight`}>
          Every day you track fills in a square, a reminder of all your hard work!
        </p>
      </div>

      <WaterDrop
        level={ml / DEMO_GOAL_ML}
        className="w-40 md:w-48"
        emptyClassName="fill-white/10"
      />

      <p aria-live="polite" className="text-sm text-muted">
        <span className="text-2xl font-bold text-foreground">{formatVolume(ml)}</span> of{" "}
        {formatVolume(DEMO_GOAL_ML)}
        {ml >= DEMO_GOAL_ML && <span className="font-medium text-accent"> · goal reached!</span>}
      </p>

      <div className="flex items-center gap-2">
        {amounts.map((amount, index) => {
          const sign = index === 0 ? "-" : "+";
          if (drafts) {
            const invalid = !(Number(drafts[index]) >= 1);
            return (
              <label
                key={index}
                className={`${boxClasses} flex-col focus-within:border-white/60 ${
                  invalid ? "border-danger" : ""
                }`}
              >
                <span className="text-[10px] leading-none text-muted">{sign}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={drafts[index]}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setDrafts(
                      (current) => current && current.map((draft, i) => (i === index ? value : draft))
                    );
                  }}
                  onKeyDown={(e) => e.key === "Enter" && save()}
                  aria-label={`Amount for the ${sign}${amount} ml button`}
                  className="w-full bg-transparent text-center text-sm font-semibold tabular-nums outline-none"
                />
              </label>
            );
          }
          return (
            <button
              key={index}
              type="button"
              onClick={() => adjust(index === 0 ? -amount : amount)}
              className={`${boxClasses} cursor-pointer hover:bg-white/20 active:scale-95`}
            >
              {sign}
              {amount} ml
            </button>
          );
        })}

        {drafts ? (
          <button
            type="button"
            onClick={save}
            disabled={!valid}
            className="flex h-11 cursor-pointer items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save
          </button>
        ) : (
          <div ref={menu} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Options"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="flex h-11 w-9 cursor-pointer items-center justify-center rounded-md text-foreground/80 transition-colors duration-200 hover:bg-white/10 hover:text-foreground"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
                <circle cx="9" cy="3" r="1.6" />
                <circle cx="9" cy="9" r="1.6" />
                <circle cx="9" cy="15" r="1.6" />
              </svg>
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-10 mt-1 w-56 overflow-hidden rounded-lg border border-line bg-surface-raised py-1 text-left shadow-lg shadow-black/50"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    setDrafts(amounts.map(String));
                  }}
                  className={itemClasses}
                >
                  Adjust quick add buttons
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* A scribbled tip pointing up at the buttons. */}
      <div className="w-full flex flex-col items-end text-foreground/75">
        <ScribbleArrow className="-scale-x-100 rotate-60" />
        <p className={`${handwriting.className} max-w-44 text-end text-balance text-xl leading-tight`}>
          {drafts ? (
            "Type your amounts, then save!"
          ) : (
            <>
              {/* The dots are drawn rather than typed: fonts render ⋮ with square dots. */}
              Tap{" "}
              <svg
                viewBox="6 0 6 18"
                fill="currentColor"
                role="img"
                aria-label="⋮"
                className="mx-[0.15em] inline h-[0.85em] w-[0.3em] align-[-0.05em]"
              >
                <circle cx="9" cy="2.5" r="2" />
                <circle cx="9" cy="9" r="2" />
                <circle cx="9" cy="15.5" r="2" />
              </svg>{" "}
              to set your own
              amounts!
            </>
          )}
        </p>
      </div>
    </div>
  );
}
