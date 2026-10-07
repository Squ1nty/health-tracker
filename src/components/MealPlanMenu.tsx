"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { saveCurrentMealPlan } from "@/app/actions/meals";
import { NEW_PLAN_EVENT } from "@/lib/meals/draft";

// How long a pop-up message stays up before closing itself.
const NOTICE_MS = 5000;
// How long it takes to fade out. Matches duration-300 on the box.
const FADE_MS = 300;

const itemClasses =
  "block w-full cursor-pointer px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-line disabled:cursor-not-allowed disabled:opacity-40";

// The pop-up message. `shown` counts up with each new message, so showing
// one while another is up restarts the timer.
type Notice = { shown: number; kind: "success" | "error"; text: string };

export default function MealPlanMenu({
  hasSavedPlans,
}: {
  // Whether "View meal plans" has anything to show.
  hasSavedPlans: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  // True while the message is fading out, before it's removed.
  const [fading, setFading] = useState(false);
  const [saving, startSaving] = useTransition();
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

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setFading(true), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  // Once the fade has played, take the message off the page.
  useEffect(() => {
    if (!fading) return;
    const timer = setTimeout(() => {
      setNotice(null);
      setFading(false);
    }, FADE_MS);
    return () => clearTimeout(timer);
  }, [fading]);

  const show = (kind: Notice["kind"], text: string) => {
    setFading(false);
    setNotice((current) => ({ shown: (current?.shown ?? 0) + 1, kind, text }));
  };

  const save = () => {
    setOpen(false);
    startSaving(async () => {
      try {
        const result = await saveCurrentMealPlan();
        if (result.ok) show("success", `Saved "${result.name}" to your meal plans.`);
        else show("error", result.error);
      } catch {
        show("error", "Couldn't reach the server. Check your connection and try again.");
      }
    });
  };

  const isError = notice?.kind === "error";

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
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              // The table holds the plan, so it does the clearing (and the asking).
              window.dispatchEvent(new Event(NEW_PLAN_EVENT));
            }}
            className={itemClasses}
          >
            New meal plan
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={save}
            disabled={saving}
            className={itemClasses}
          >
            {saving ? "Saving…" : "Save current meal plan"}
          </button>
          {hasSavedPlans ? (
            <Link
              href="/meals/plans"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={itemClasses}
            >
              View meal plans
            </Link>
          ) : (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                show(
                  "error",
                  "Currently, you have no meal plans saved. Save your current meal plan to see it here."
                );
              }}
              className={itemClasses}
            >
              View meal plans
            </button>
          )}
        </div>
      )}

      {notice && (
        <div
          role={isError ? "alert" : "status"}
          className={`fixed inset-x-4 top-1/2 z-50 mx-auto flex w-3/4 max-w-md -translate-y-1/2 items-start gap-3 rounded-lg border bg-surface-raised p-4 text-sm shadow-lg shadow-black/60 transition-opacity duration-300 ${
            isError ? "border-danger/50 text-danger" : "border-success/50 text-success"
          } ${fading ? "pointer-events-none opacity-0" : "opacity-100"}`}
        >
          <p className="flex-1">{notice.text}</p>
          <button
            type="button"
            onClick={() => setFading(true)}
            aria-label="Close"
            className={`-m-1 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-lg leading-none transition-colors ${
              isError ? "hover:bg-danger/15" : "hover:bg-success/15"
            }`}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
