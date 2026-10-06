"use client";

import { useEffect, useRef, useState } from "react";
import { saveMealPlan } from "@/app/actions/meals";
import {
  MACROS,
  MAX_MEAL_ROWS,
  MEAL_NAME_MAX,
  roundMacro,
  type MacroKey,
  type MealPlan,
} from "@/lib/meals/shared";

// How long to wait after the last edit before saving.
const SAVE_DELAY_MS = 600;

// While editing, number cells hold what was typed ("48." is a valid
// in-progress value), so the table works on text and converts on save.
type DraftValues = Record<MacroKey, string>;
type DraftRow =
  | { id: string; kind: "header"; name: string }
  | { id: string; kind: "food"; name: string; values: DraftValues };
type Draft = { name: string; targets: DraftValues; rows: DraftRow[] };

type Status = { kind: "idle" | "saving" | "saved" } | { kind: "error"; text: string };

const EMPTY_VALUES: DraftValues = { calories: "", carbs: "", protein: "", fat: "" };

function toText(values: MealPlan["targets"]): DraftValues {
  const text = { ...EMPTY_VALUES };
  for (const { key } of MACROS) text[key] = values[key] === null ? "" : String(values[key]);
  return text;
}

function toNumber(text: string) {
  return text === "" || text === "." ? null : Number(text);
}

function toNumbers(values: DraftValues): MealPlan["targets"] {
  return {
    calories: toNumber(values.calories),
    carbs: toNumber(values.carbs),
    protein: toNumber(values.protein),
    fat: toNumber(values.fat),
  };
}

function toDraft(plan: MealPlan): Draft {
  return {
    name: plan.name,
    targets: toText(plan.targets),
    rows: plan.rows.map((row) =>
      row.kind === "food" ? { ...row, values: toText(row.values) } : row
    ),
  };
}

function toPlan(draft: Draft): MealPlan {
  return {
    name: draft.name,
    targets: toNumbers(draft.targets),
    rows: draft.rows.map((row) =>
      row.kind === "food" ? { ...row, values: toNumbers(row.values) } : row
    ),
  };
}

// Keeps only what a macro can be: up to 5 digits and 2 decimals.
function cleanNumber(text: string) {
  return text.replace(/[^\d.]/g, "").match(/^\d{0,5}(\.\d{0,2})?/)?.[0] ?? "";
}

// Not crypto.randomUUID: that's missing when the site is opened over plain
// http on a phone, and row ids only need to be unique within one plan.
function newRowId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

const cellBorder = "border-t border-line";
// 16px text on phones stops iOS zooming in when a cell is focused.
const inputClasses =
  "w-full bg-transparent py-2.5 text-base outline-none transition-colors placeholder:text-faint focus:bg-surface-raised md:text-sm";
const numberInputClasses = `${inputClasses} px-0 text-center tabular-nums tracking-tighter md:px-1 md:tracking-normal`;
const addButtonClasses =
  "flex h-9 cursor-pointer items-center justify-center rounded-md border border-line px-3 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-surface-raised";

export default function MealPlanTable({ initialPlan }: { initialPlan: MealPlan }) {
  const [draft, setDraft] = useState(() => toDraft(initialPlan));
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  // True while the "food item or header?" choice is showing.
  const [adding, setAdding] = useState(false);
  // The row just added, so its name field takes focus.
  const [newRow, setNewRow] = useState<string | null>(null);

  // The save waiting on its timer, and a counter so that only the latest
  // save reports its result.
  const saver = useRef<{
    timer: ReturnType<typeof setTimeout> | null;
    pending: MealPlan | null;
    count: number;
  }>({ timer: null, pending: null, count: 0 });

  // Leaving the page mid-wait saves right away instead of dropping the edit.
  useEffect(() => {
    const state = saver.current;
    return () => {
      if (state.timer) clearTimeout(state.timer);
      if (state.pending) void saveMealPlan(state.pending);
    };
  }, []);

  // Applies an edit and schedules a save of the whole plan.
  const commit = (next: Draft) => {
    setDraft(next);
    setStatus({ kind: "saving" });

    const state = saver.current;
    if (state.timer) clearTimeout(state.timer);
    state.pending = toPlan(next);
    const count = ++state.count;

    state.timer = setTimeout(async () => {
      const plan = state.pending;
      state.pending = null;
      state.timer = null;
      if (!plan) return;

      let result: Status;
      try {
        const saved = await saveMealPlan(plan);
        result = saved.ok ? { kind: "saved" } : { kind: "error", text: saved.error };
      } catch {
        result = {
          kind: "error",
          text: "Couldn't reach the server. Check your connection and try again.",
        };
      }
      if (count === state.count) setStatus(result);
    }, SAVE_DELAY_MS);
  };

  const setTarget = (key: MacroKey, text: string) => {
    const next = { ...draft.targets, [key]: cleanNumber(text) };
    const filled = (values: DraftValues) =>
      MACROS.every((macro) => toNumber(values[macro.key]) !== null);
    // Filling in the last target opens the table with an empty header and
    // an empty food row, so there's something to type into straight away.
    const rows: DraftRow[] =
      draft.rows.length === 0 && filled(next) && !filled(draft.targets)
        ? [
            { id: newRowId(), kind: "header", name: "" },
            { id: newRowId(), kind: "food", name: "", values: { ...EMPTY_VALUES } },
          ]
        : draft.rows;
    commit({ ...draft, targets: next, rows });
  };

  const updateRow = (id: string, change: (row: DraftRow) => DraftRow) =>
    commit({ ...draft, rows: draft.rows.map((row) => (row.id === id ? change(row) : row)) });

  const addRow = (kind: DraftRow["kind"]) => {
    const id = newRowId();
    const row: DraftRow =
      kind === "food"
        ? { id, kind, name: "", values: { ...EMPTY_VALUES } }
        : { id, kind, name: "" };
    setAdding(false);
    setNewRow(id);
    commit({ ...draft, rows: [...draft.rows, row] });
  };

  const removeRow = (id: string) =>
    commit({ ...draft, rows: draft.rows.filter((row) => row.id !== id) });

  const targets = toNumbers(draft.targets);
  const targetsSet = MACROS.every(({ key }) => targets[key] !== null);
  // Rows and totals stay hidden until every target is filled in. Existing
  // rows keep them visible even if a target is cleared later.
  const started = targetsSet || draft.rows.length > 0;

  const foodRows = draft.rows.filter((row) => row.kind === "food");
  const totals = { calories: 0, carbs: 0, protein: 0, fat: 0 };
  for (const row of foodRows) {
    for (const { key } of MACROS) totals[key] += toNumber(row.values[key]) ?? 0;
  }

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
                {draft.rows.map((row) => {
                  const label = row.name || (row.kind === "food" ? "food item" : "header");
                  return (
                    <tr key={row.id}>
                      {row.kind === "header" ? (
                        <td colSpan={MACROS.length + 1} className={`${cellBorder} bg-surface-raised/50`}>
                          <input
                            type="text"
                            autoComplete="off"
                            value={row.name}
                            onChange={(e) =>
                              updateRow(row.id, (r) => ({ ...r, name: e.target.value }))
                            }
                            maxLength={MEAL_NAME_MAX}
                            autoFocus={row.id === newRow}
                            placeholder="Header, e.g. Breakfast"
                            aria-label="Header name"
                            className={`${inputClasses} pl-6 md:pl-9 text-center font-semibold`}
                          />
                        </td>
                      ) : (
                        <>
                          <td className={cellBorder}>
                            <input
                              type="text"
                              autoComplete="off"
                              value={row.name}
                              onChange={(e) =>
                                updateRow(row.id, (r) => ({ ...r, name: e.target.value }))
                              }
                              maxLength={MEAL_NAME_MAX}
                              autoFocus={row.id === newRow}
                              placeholder="Food item"
                              aria-label="Food item name"
                              className={`${inputClasses} px-2 md:px-3`}
                            />
                          </td>
                          {MACROS.map(({ key, label: macro }) => (
                            <td key={key} className={`${cellBorder} border-l`}>
                              <input
                                type="text"
                                autoComplete="off"
                                inputMode="decimal"
                                value={row.values[key]}
                                onChange={(e) =>
                                  updateRow(row.id, (r) =>
                                    r.kind === "food"
                                      ? {
                                          ...r,
                                          values: { ...r.values, [key]: cleanNumber(e.target.value) },
                                        }
                                      : r
                                  )
                                }
                                placeholder="0"
                                aria-label={`${macro} for ${label}`}
                                className={numberInputClasses}
                              />
                            </td>
                          ))}
                        </>
                      )}
                      <td className={`${cellBorder} ${row.kind === "header" ? "bg-surface-raised/50" : ""}`}>
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          aria-label={`Remove ${label}`}
                          className="flex h-9 w-full cursor-pointer items-center justify-center text-lg text-faint transition-colors hover:text-danger"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  );
                })}

                <tr>
                  <td colSpan={MACROS.length + 2} className={`${cellBorder} p-2`}>
                    {draft.rows.length >= MAX_MEAL_ROWS ? (
                      <p className="py-1.5 text-center text-xs text-muted">
                        The plan is full ({MAX_MEAL_ROWS} rows).
                      </p>
                    ) : adding ? (
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => addRow("food")}
                          autoFocus
                          className={addButtonClasses}
                        >
                          Food item
                        </button>
                        <button
                          type="button"
                          onClick={() => addRow("header")}
                          className={addButtonClasses}
                        >
                          Header
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdding(false)}
                          className="cursor-pointer px-2 text-sm text-muted hover:text-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAdding(true)}
                        aria-label="Add a row"
                        className="mx-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-line text-xl text-foreground transition-colors duration-200 hover:bg-surface-raised"
                      >
                        +
                      </button>
                    )}
                  </td>
                </tr>
              </tbody>
            )}

            <tfoot>
              {started && (
                <tr className="font-semibold">
                  <th scope="row" className={`${cellBorder} border-t-2 px-2 py-2.5 md:px-3 text-left`}>
                    Totals
                  </th>
                  {MACROS.map(({ key, label, tolerance }) => {
                    const total = roundMacro(totals[key]);
                    const target = targets[key];
                    // Nothing to judge until there's a food and a target.
                    const judged = foodRows.length > 0 && target !== null;
                    const onTarget = judged && Math.abs(total - target) <= tolerance;
                    return (
                      <td
                        key={key}
                        aria-label={`${label} total ${total}${
                          judged ? (onTarget ? ", on target" : ", off target") : ""
                        }`}
                        className={`${cellBorder} border-l border-t-2 px-0 py-2.5 text-center text-xs tabular-nums tracking-tighter md:px-1 md:text-sm md:tracking-normal transition-colors ${
                          !judged
                            ? "text-muted"
                            : onTarget
                              ? "bg-success text-black"
                              : "bg-danger text-white"
                        }`}
                      >
                        {total}
                      </td>
                    );
                  })}
                  <td className={`${cellBorder} border-t-2`} />
                </tr>
              )}

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
