// The meal plan as it's being edited in the browser.
import { MACROS, type MacroKey, type MacroValues, type MealPlan } from "@/lib/meals/shared";

// While editing, number cells hold what was typed ("48." is a valid
// in-progress value), so the table works on text and converts on save.
export type DraftValues = Record<MacroKey, string>;
export type DraftRow =
  | { id: string; kind: "header"; name: string }
  | { id: string; kind: "food"; name: string; values: DraftValues };
export type Draft = { name: string; targets: DraftValues; rows: DraftRow[] };

const EMPTY_VALUES: DraftValues = { calories: "", carbs: "", protein: "", fat: "" };

function toText(values: MacroValues): DraftValues {
  const text = { ...EMPTY_VALUES };
  for (const { key } of MACROS) text[key] = values[key] === null ? "" : String(values[key]);
  return text;
}

export function toNumber(text: string) {
  return text === "" || text === "." ? null : Number(text);
}

export function toNumbers(values: DraftValues): MacroValues {
  return {
    calories: toNumber(values.calories),
    carbs: toNumber(values.carbs),
    protein: toNumber(values.protein),
    fat: toNumber(values.fat),
  };
}

export function toDraft(plan: MealPlan): Draft {
  return {
    name: plan.name,
    targets: toText(plan.targets),
    rows: plan.rows.map((row) =>
      row.kind === "food" ? { ...row, values: toText(row.values) } : row
    ),
  };
}

export function toPlan(draft: Draft): MealPlan {
  return {
    name: draft.name,
    targets: toNumbers(draft.targets),
    rows: draft.rows.map((row) =>
      row.kind === "food" ? { ...row, values: toNumbers(row.values) } : row
    ),
  };
}

// Keeps only what a macro can be: up to 5 digits and 2 decimals.
export function cleanNumber(text: string) {
  return text.replace(/[^\d.]/g, "").match(/^\d{0,5}(\.\d{0,2})?/)?.[0] ?? "";
}

// Not crypto.randomUUID: that's missing when the site is opened over plain
// http on a phone, and row ids only need to be unique within one plan.
function newRowId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

// A blank row of the given kind, ready to be typed into.
export function newRow(kind: DraftRow["kind"]): DraftRow {
  const id = newRowId();
  return kind === "food"
    ? { id, kind, name: "", values: { ...EMPTY_VALUES } }
    : { id, kind, name: "" };
}
