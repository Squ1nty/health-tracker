"use client";

import { useEffect, useRef, useState } from "react";

// The options don't do anything yet: saving and browsing plans come later.
const OPTIONS = ["Save current meal plan", "View meal plans"];

export default function MealPlanMenu() {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  // While open, a click anywhere else or Escape closes the menu.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Meal plan options"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-muted transition-colors duration-200 hover:bg-surface-raised hover:text-foreground"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
          <circle cx="9" cy="3" r="1.6" />
          <circle cx="9" cy="9" r="1.6" />
          <circle cx="9" cy="15" r="1.6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-10 mt-1 w-56 overflow-hidden rounded-lg border border-line bg-surface-raised py-1 shadow-lg shadow-black/50"
        >
          {OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block w-full cursor-pointer px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-line"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
