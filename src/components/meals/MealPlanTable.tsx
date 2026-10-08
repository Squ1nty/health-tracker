"use client";

import { useEffect, useEffectEvent, useState } from "react";
import MealPlanAddRow from "@/components/meals/MealPlanAddRow";
import MealPlanRow from "@/components/meals/MealPlanRow";
import MealPlanTotals from "@/components/meals/MealPlanTotals";
import { cellBorder, numberInputClasses } from "@/components/meals/mealPlanStyles";
import {
  NEW_PLAN_EVENT,
  cleanNumber,
  newRow,
  toDraft,
  toNumber,
  toNumbers,
  toPlan,
  type Draft,
  type DraftRow,
  type DraftValues,
} from "@/lib/meals/draft";
import {
  EMPTY_MEAL_PLAN,
  MACROS,
  MAX_MEAL_ROWS,
  MEAL_NAME_MAX,
  type MacroKey,
  type MealPlan,
} from "@/lib/meals/shared";
import { useAutosave } from "@/lib/meals/useAutosave";

export default function MealPlanTable({ initialPlan }: { initialPlan: MealPlan }) {
  const [draft, setDraft] = useState(() => toDraft(initialPlan));
  const { status, save } = useAutosave();
  // The row just added, so its name field takes focus.
  const [addedRow, setAddedRow] = useState<string | null>(null);

  // Applies an edit and schedules a save of the whole plan.
  const commit = (next: Draft) => {
    setDraft(next);
    save(toPlan(next));
  };

  // "New meal plan" in the options menu: back to an empty table. Asks
  // first if there are rows to lose.
  const startNewPlan = useEffectEvent(() => {
    if (
      draft.rows.length > 0 &&
      !window.confirm("Start a new plan? Anything unsaved in the current one will be lost.")
    ) {
      return;
    }
    setAddedRow(null);
    commit(toDraft(EMPTY_MEAL_PLAN));
  });

  useEffect(() => {
    window.addEventListener(NEW_PLAN_EVENT, startNewPlan);
    return () => window.removeEventListener(NEW_PLAN_EVENT, startNewPlan);
  }, []);

  const setTarget = (key: MacroKey, text: string) => {
    const next = { ...draft.targets, [key]: cleanNumber(text) };
    const filled = (values: DraftValues) =>
      MACROS.every((macro) => toNumber(values[macro.key]) !== null);
    // Filling in the last target opens the table with an empty header and
    // an empty food row, so there's something to type into straight away.
    const rows =
      draft.rows.length === 0 && filled(next) && !filled(draft.targets)
        ? [newRow("header"), newRow("food")]
        : draft.rows;
    commit({ ...draft, targets: next, rows });
  };

  const changeRow = (next: DraftRow) =>
    commit({ ...draft, rows: draft.rows.map((row) => (row.id === next.id ? next : row)) });

  const addRow = (kind: DraftRow["kind"]) => {
    const row = newRow(kind);
    setAddedRow(row.id);
    commit({ ...draft, rows: [...draft.rows, row] });
  };

  const removeRow = (id: string) =>
    commit({ ...draft, rows: draft.rows.filter((row) => row.id !== id) });

  const targets = toNumbers(draft.targets);
  const targetsSet = MACROS.every(({ key }) => targets[key] !== null);
  // Rows and totals stay hidden until every target is filled in. Existing
  // rows keep them visible even if a target is cleared later.
  const started = targetsSet || draft.rows.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 text-lg font-semibold text-foreground">
            <h2 className="shrink-0">Meal Plan</h2>
            <span aria-hidden="true">-</span>
            <input
              type="text"
              autoComplete="off"
              value={draft.name}
              onChange={(e) => commit({ ...draft, name: e.target.value })}
              maxLength={MEAL_NAME_MAX}
              placeholder="Insert plan name here"
              aria-label="Plan name"
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:font-normal placeholder:text-faint"
            />
          </div>
          <p role="status" className="shrink-0 text-xs text-muted">
            {status.kind === "saving" && "Saving…"}
            {status.kind === "saved" && "Saved"}
            {status.kind === "error" && <span className="text-danger">Not saved</span>}
          </p>
        </div>

        <div className="overflow-hidden">
          <table className="w-full table-fixed border-collapse text-sm text-foreground">
            <colgroup>
              <col />
              {MACROS.map(({ key }) => (
                <col key={key} className="w-12.5 md:w-[16%]" />
              ))}
              <col className="w-6 md:w-9" />
            </colgroup>

            <thead>
              <tr className="text-[13px] text-muted md:text-xs">
                <th scope="col" className={`${cellBorder} px-2 py-2 md:px-3 text-left font-medium`}>
                  Food item
                </th>
                {MACROS.map(({ key, label, unit }) => (
                  <th key={key} scope="col" className={`${cellBorder} px-0 py-2 md:px-1 font-medium`}>
                    {/* The unit drops to its own line on phones, where columns are narrow. */}
                    {label} <span className="block font-normal text-faint md:inline">({unit})</span>
                  </th>
                ))}
                <th className={cellBorder} />
              </tr>
            </thead>

            {started && (
              <tbody>
                {draft.rows.map((row) => (
                  <MealPlanRow
                    key={row.id}
                    row={row}
                    autoFocus={row.id === addedRow}
                    onChange={changeRow}
                    onRemove={() => removeRow(row.id)}
                  />
                ))}
                <MealPlanAddRow full={draft.rows.length >= MAX_MEAL_ROWS} onAdd={addRow} />
              </tbody>
            )}

            <tfoot>
              {started && <MealPlanTotals rows={draft.rows} targets={targets} />}

              <tr>
                <th scope="row" className={`${cellBorder} px-2 py-2.5 md:px-3 text-left font-semibold`}>
                  Macros to hit
                </th>
                {MACROS.map(({ key, label }) => (
                  <td key={key} className={`${cellBorder} border-l`}>
                    <input
                      type="text"
                      autoComplete="off"
                      inputMode="decimal"
                      value={draft.targets[key]}
                      onChange={(e) => setTarget(key, e.target.value)}
                      placeholder="0"
                      aria-label={`${label} to hit`}
                      className={`${numberInputClasses} font-semibold`}
                    />
                  </td>
                ))}
                <td className={cellBorder} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <p
        role={status.kind === "error" ? "alert" : undefined}
        className={`text-center text-xs ${status.kind === "error" ? "text-danger" : "text-muted"}`}
      >
        {status.kind === "error"
          ? status.text
          : started
            ? "Totals turn green within 50 kcal and 10 g of your targets. Changes save automatically."
            : "Enter the macros you want to hit to start adding rows."}
      </p>
    </div>
  );
}
