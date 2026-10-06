// Meal plan constants and helpers shared by the browser and the server.

// The table's number columns, in display order. A total counts as "on
// target" when it lands within `tolerance` of the user's target.
export const MACROS = [
  { key: "calories", label: "Calories", unit: "kcal", tolerance: 50 },
  { key: "carbs", label: "Carbs", unit: "g", tolerance: 10 },
  { key: "protein", label: "Protein", unit: "g", tolerance: 10 },
  { key: "fat", label: "Fats", unit: "g", tolerance: 10 },
] as const;

export type MacroKey = (typeof MACROS)[number]["key"];

// Null means the cell is empty.
export type MacroValues = Record<MacroKey, number | null>;

// A row is either a section header ("Breakfast") or a food with its macros.
export type MealRow =
  | { id: string; kind: "header"; name: string }
  | { id: string; kind: "food"; name: string; values: MacroValues };

export type MealPlan = {
  // The "Macros to Hit" row.
  targets: MacroValues;
  rows: MealRow[];
};

export const MAX_MEAL_ROWS = 100;
export const MEAL_NAME_MAX = 60;
// Sanity cap on any one cell.
export const MAX_MACRO_VALUE = 99999.99;

export const ROW_ID_PATTERN = /^[a-z0-9]{1,40}$/;

export const EMPTY_MEAL_PLAN: MealPlan = {
  targets: { calories: null, carbs: null, protein: null, fat: null },
  rows: [],
};

// Macros are kept to two decimals, like the spreadsheet this replaces.
export function roundMacro(value: number) {
  return Math.round(value * 100) / 100;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseValues(input: unknown): MacroValues | null {
  if (!isRecord(input)) return null;
  const values = { ...EMPTY_MEAL_PLAN.targets };
  for (const { key } of MACROS) {
    const value = input[key];
    if (value === null || value === undefined) continue;
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    if (value < 0 || value > MAX_MACRO_VALUE) return null;
    values[key] = roundMacro(value);
  }
  return values;
}

// Checks a plan sent from the browser and returns a clean copy, or null if
// it isn't a usable plan.
export function parseMealPlan(input: unknown): MealPlan | null {
  if (!isRecord(input) || !Array.isArray(input.rows)) return null;
  if (input.rows.length > MAX_MEAL_ROWS) return null;

  const targets = parseValues(input.targets);
  if (!targets) return null;

  const rows: MealRow[] = [];
  const seen = new Set<string>();
  for (const row of input.rows) {
    if (!isRecord(row)) return null;
    const { id, kind, name } = row;
    if (typeof id !== "string" || !ROW_ID_PATTERN.test(id) || seen.has(id)) return null;
    if (typeof name !== "string" || name.length > MEAL_NAME_MAX) return null;
    seen.add(id);

    if (kind === "header") {
      rows.push({ id, kind, name: name.trim() });
    } else if (kind === "food") {
      const values = parseValues(row.values);
      if (!values) return null;
      rows.push({ id, kind, name: name.trim(), values });
    } else {
      return null;
    }
  }
  return { targets, rows };
}
