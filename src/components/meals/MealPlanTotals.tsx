import { cellBorder } from "@/components/meals/mealPlanStyles";
import { toNumber, type DraftRow } from "@/lib/meals/draft";
import { MACROS, roundMacro, type MacroValues } from "@/lib/meals/shared";

// The totals row: each macro added up across the food rows, filled green
// when it's close enough to its target and red when it isn't.
export default function MealPlanTotals({
  rows,
  targets,
}: {
  rows: DraftRow[];
  targets: MacroValues;
}) {
  const foodRows = rows.filter((row) => row.kind === "food");
  const totals = { calories: 0, carbs: 0, protein: 0, fat: 0 };
  for (const row of foodRows) {
    for (const { key } of MACROS) totals[key] += toNumber(row.values[key]) ?? 0;
  }

  return (
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
              !judged ? "text-muted" : onTarget ? "bg-success text-black" : "bg-danger text-white"
            }`}
          >
            {total}
          </td>
        );
      })}
      <td className={`${cellBorder} border-t-2`} />
    </tr>
  );
}
