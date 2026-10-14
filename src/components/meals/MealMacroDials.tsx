import { MACROS, type MacroKey, type MacroValues } from "@/lib/meals/shared";

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Written out in full so Tailwind can find the class names.
const RING_COLOR: Record<MacroKey, string> = {
  calories: "stroke-calories",
  carbs: "stroke-carbs",
  protein: "stroke-protein",
  fat: "stroke-fat",
};

function sum(foods: { values: MacroValues }[], key: MacroKey) {
  return foods.reduce((total, food) => total + (food.values[key] ?? 0), 0);
}

// One ring per macro, filling as the day's ticked foods add up towards the
// plan's total. A ring that's done greys out behind a green tick.
export default function MealMacroDials({
  foods,
  eatenFoods,
}: {
  // Every food in the active plan.
  foods: { values: MacroValues }[];
  // The ones ticked off today.
  eatenFoods: { values: MacroValues }[];
}) {
  return (
    <div className="grid grid-cols-4 gap-2 border-t border-line px-2 py-4 md:px-4">
      {MACROS.map(({ key, label, unit }) => {
        const eaten = Math.round(sum(eatenFoods, key));
        // The goal is everything in the plan, not the "Macros to Hit" row.
        const goal = Math.round(sum(foods, key));
        const complete = goal > 0 && eaten >= goal;
        const level = goal > 0 ? Math.min(1, eaten / goal) : 0;

        return (
          <div key={key} className="flex min-w-0 flex-col items-center gap-1.5 text-center">
            <div
              role="img"
              aria-label={`${label}: ${eaten} of ${goal} ${unit}${complete ? ", complete" : ""}`}
              className="relative w-16 md:w-20"
            >
              {/* Rotated so the ring starts filling from the top instead of the right. */}
              <svg viewBox="0 0 120 120" aria-hidden="true" className="-rotate-90">
                <circle
                  cx="60"
                  cy="60"
                  r={RADIUS}
                  strokeWidth="9"
                  // The middle fills in once the ring is done.
                  className={`stroke-surface-raised transition-[fill] duration-700 ease-out ${
                    complete ? "fill-surface-raised" : "fill-transparent"
                  }`}
                />
                <circle
                  cx="60"
                  cy="60"
                  r={RADIUS}
                  fill="none"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={CIRCUMFERENCE * (1 - level)}
                  // Hidden at zero, where the rounded cap would still draw a dot.
                  className={`transition-[stroke-dashoffset,stroke,opacity] duration-700 ease-out ${
                    complete ? "stroke-faint" : RING_COLOR[key]
                  } ${level === 0 ? "opacity-0" : ""}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {complete ? (
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    fill="none"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-7 w-7 stroke-success md:h-9 md:w-9"
                  >
                    {/* Drawn around the middle of the box, so it sits dead centre. */}
                    <path d="M5 12.25l4.5 4.5L19 7.25" />
                  </svg>
                ) : (
                  <>
                    <span className="text-sm font-semibold leading-tight tabular-nums text-foreground md:text-base">
                      {eaten}
                    </span>
                    <span className="text-[10px] leading-tight text-muted">{unit}</span>
                  </>
                )}
              </div>
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-medium ${complete ? "text-faint" : "text-foreground"}`}>
                {label}
              </p>
              <p className="text-[11px] tabular-nums text-muted">
                {complete ? `${eaten} ${unit}` : goal > 0 ? `of ${goal}` : "None"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
