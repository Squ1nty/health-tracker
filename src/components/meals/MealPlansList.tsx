"use client";

import { useRef, useState } from "react";
import {
  deleteSavedMealPlan,
  duplicateSavedMealPlan,
  reorderSavedMealPlans,
} from "@/app/actions/meals";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { MACROS, type SavedPlanSummary } from "@/lib/meals/shared";

const UNREACHABLE = "Couldn't reach the server. Check your connection and try again.";

const iconButtonClasses =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-faint transition-colors duration-200";

function moved(plans: SavedPlanSummary[], from: number, to: number) {
  const next = [...plans];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
}

export default function MealPlansList({ initialPlans }: { initialPlans: SavedPlanSummary[] }) {
  const [plans, setPlans] = useState(initialPlans);
  // The plan being dragged by its handle, if any.
  const [dragging, setDragging] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // The plan the "delete this?" question is being asked about, if any.
  const [deleting, setDeleting] = useState<SavedPlanSummary | null>(null);
  // The plan being copied, so its button can't be pressed twice.
  const [copying, setCopying] = useState<string | null>(null);
  const list = useRef<HTMLUListElement>(null);
  // The order when the drag began, to tell whether anything moved.
  const orderAtStart = useRef("");

  const saveOrder = async (next: SavedPlanSummary[]) => {
    try {
      const result = await reorderSavedMealPlans(next.map((plan) => plan.id));
      setError(result.ok ? null : result.error);
    } catch {
      setError(UNREACHABLE);
    }
  };

  const startDrag = (event: React.PointerEvent<HTMLButtonElement>, id: string) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    orderAtStart.current = plans.map((plan) => plan.id).join();
    setDragging(id);
  };

  // The dragged plan takes the place of whichever row the pointer is over.
  const drag = (event: React.PointerEvent) => {
    if (!dragging || !list.current) return;
    const from = plans.findIndex((plan) => plan.id === dragging);
    const to = [...list.current.children].findIndex((row) => {
      const box = row.getBoundingClientRect();
      return event.clientY >= box.top && event.clientY <= box.bottom;
    });
    if (from !== -1 && to !== -1 && to !== from) setPlans(moved(plans, from, to));
  };

  const endDrag = () => {
    if (!dragging) return;
    setDragging(null);
    if (plans.map((plan) => plan.id).join() !== orderAtStart.current) void saveOrder(plans);
  };

  // Arrow keys on the handle move a plan without dragging.
  const nudge = (event: React.KeyboardEvent, index: number) => {
    const to = index + (event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0);
    if (to === index || to < 0 || to >= plans.length) return;
    event.preventDefault();
    const next = moved(plans, index, to);
    setPlans(next);
    void saveOrder(next);
  };

  // Runs once the delete has been confirmed.
  const remove = async (plan: SavedPlanSummary) => {
    setDeleting(null);
    const before = plans;
    setPlans(plans.filter((other) => other.id !== plan.id));
    try {
      const result = await deleteSavedMealPlan(plan.id);
      if (result.ok) {
        setError(null);
        return;
      }
      setError(result.error);
    } catch {
      setError(UNREACHABLE);
    }
    // The delete didn't happen, so put the plan back.
    setPlans(before);
  };

  // The copy is named and stored by the server, then slotted in below the original.
  const duplicate = async (plan: SavedPlanSummary) => {
    if (copying) return;
    setCopying(plan.id);
    try {
      const result = await duplicateSavedMealPlan(plan.id);
      if (result.ok) {
        setError(null);
        setPlans((current) => {
          const index = current.findIndex((other) => other.id === plan.id);
          const next = [...current];
          next.splice(index === -1 ? next.length : index + 1, 0, result.plan);
          return next;
        });
      } else {
        setError(result.error);
      }
    } catch {
      setError(UNREACHABLE);
    }
    setCopying(null);
  };

  if (plans.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-surface p-4 text-sm text-muted">
        No meal plans saved yet. Save one from the menu on the Meals page.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted">
        The plan at the top is your active plan. Move a plan to the top to set it as active.
      </p>

      {/* Only plan rows go in this list: dragging matches rows by position. */}
      <ul ref={list} className="flex flex-col gap-2">
        {plans.map((plan, index) => (
          <li
            key={plan.id}
            // The first plan is the active one, set apart from the rest.
            className={`flex items-center gap-1 rounded-lg border bg-surface py-2 pl-1 pr-2 transition-colors ${
              plan.id === dragging
                ? "border-accent bg-surface-raised"
                : index === 0
                  ? "border-accent/60"
                  : "border-line"
            } ${index === 0 ? "mb-4" : ""}`}
          >
            {/* touch-none stops the page scrolling while a plan is dragged. */}
            <button
              type="button"
              onPointerDown={(event) => startDrag(event, plan.id)}
              onPointerMove={drag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onKeyDown={(event) => nudge(event, index)}
              aria-label={`Move ${plan.name}. Drag, or use the up and down arrow keys.`}
              className={`${iconButtonClasses} touch-none hover:text-foreground ${
                plan.id === dragging ? "cursor-grabbing" : "cursor-grab"
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M3 5h12M3 9h12M3 13h12" />
              </svg>
            </button>

            {/* One line on wide screens; the macros drop under the name on phones. */}
            <div className="flex min-w-0 flex-1 flex-col gap-1 px-1 md:flex-row md:items-center md:justify-between md:gap-4">
              <p className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
                <span className="truncate">{plan.name}</span>
                {index === 0 && (
                  <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent">
                    Active
                  </span>
                )}
              </p>
              <p className="flex shrink-0 flex-wrap gap-x-3 text-xs text-muted tabular-nums">
                {MACROS.map(({ key, label, unit }) => (
                  <span key={key}>
                    <span className="font-medium text-foreground">{plan.totals[key]}</span>{" "}
                    {key === "calories" ? unit : `${unit} ${label.toLowerCase()}`}
                  </span>
                ))}
              </p>
            </div>

            <button
              type="button"
              onClick={() => duplicate(plan)}
              disabled={copying !== null}
              aria-label={`Duplicate ${plan.name}`}
              className={`${iconButtonClasses} cursor-pointer hover:bg-surface-raised hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="6.5" y="6.5" width="8.5" height="8.5" rx="1.5" />
                <path d="M11.5 6.5V4.5A1.5 1.5 0 0 0 10 3H4.5A1.5 1.5 0 0 0 3 4.5V10a1.5 1.5 0 0 0 1.5 1.5h2" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setDeleting(plan)}
              aria-label={`Delete ${plan.name}`}
              className={`${iconButtonClasses} cursor-pointer hover:bg-danger/15 hover:text-danger`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 5h12M7 5V3.5h4V5M4.5 5l.7 9.5h7.6l.7-9.5M7.5 8v4M10.5 8v4" />
              </svg>
            </button>
          </li>
        ))}
      </ul>

      {error && (
        <p role="alert" className="text-center text-xs text-danger">
          {error}
        </p>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete meal plan?"
          message={`"${deleting.name}" will be deleted. This can't be undone.`}
          confirmLabel="Delete"
          onConfirm={() => remove(deleting)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
