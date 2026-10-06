import { useState } from "react";
import { cellBorder } from "@/components/mealPlanStyles";
import type { DraftRow } from "@/lib/meals/draft";
import { MACROS, MAX_MEAL_ROWS } from "@/lib/meals/shared";

const choiceClasses =
  "flex h-9 cursor-pointer items-center justify-center rounded-md border border-line px-3 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-surface-raised";

// The last row of the table body: a plus button that asks which kind of
// row to add.
export default function MealPlanAddRow({
  full,
  onAdd,
}: {
  // True once the plan has as many rows as it can hold.
  full: boolean;
  onAdd: (kind: DraftRow["kind"]) => void;
}) {
  // True while the "food item or header?" choice is showing.
  const [choosing, setChoosing] = useState(false);

  const add = (kind: DraftRow["kind"]) => {
    setChoosing(false);
    onAdd(kind);
  };

  return (
    <tr>
      <td colSpan={MACROS.length + 2} className={`${cellBorder} p-2`}>
        {full ? (
          <p className="py-1.5 text-center text-xs text-muted">
            The plan is full ({MAX_MEAL_ROWS} rows).
          </p>
        ) : choosing ? (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button type="button" onClick={() => add("food")} autoFocus className={choiceClasses}>
              Food item
            </button>
            <button type="button" onClick={() => add("header")} className={choiceClasses}>
              Header
            </button>
            <button
              type="button"
              onClick={() => setChoosing(false)}
              className="cursor-pointer px-2 text-sm text-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setChoosing(true)}
            aria-label="Add a row"
            className="mx-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-line text-xl text-foreground transition-colors duration-200 hover:bg-surface-raised"
          >
            +
          </button>
        )}
      </td>
    </tr>
  );
}
