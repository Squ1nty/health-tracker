import { cellBorder, inputClasses, numberInputClasses } from "@/components/mealPlanStyles";
import { cleanNumber, type DraftRow } from "@/lib/meals/draft";
import { MACROS, MEAL_NAME_MAX } from "@/lib/meals/shared";

// One editable row of the meal plan: a header ("Breakfast") or a food.
export default function MealPlanRow({
  row,
  autoFocus,
  onChange,
  onRemove,
}: {
  row: DraftRow;
  // Puts the cursor in the name field (for a row that was just added).
  autoFocus: boolean;
  onChange: (row: DraftRow) => void;
  onRemove: () => void;
}) {
  const label = row.name || (row.kind === "food" ? "food item" : "header");

  return (
    <tr>
      {row.kind === "header" ? (
        <td colSpan={MACROS.length + 1} className={`${cellBorder} bg-surface-raised/50`}>
          <input
            type="text"
            autoComplete="off"
            value={row.name}
            onChange={(e) => onChange({ ...row, name: e.target.value })}
            maxLength={MEAL_NAME_MAX}
            autoFocus={autoFocus}
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
              onChange={(e) => onChange({ ...row, name: e.target.value })}
              maxLength={MEAL_NAME_MAX}
              autoFocus={autoFocus}
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
                  onChange({
                    ...row,
                    values: { ...row.values, [key]: cleanNumber(e.target.value) },
                  })
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
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className="flex h-9 w-full cursor-pointer items-center justify-center text-lg text-faint transition-colors hover:text-danger"
        >
          ×
        </button>
      </td>
    </tr>
  );
}
