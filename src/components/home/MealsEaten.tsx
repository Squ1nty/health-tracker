import Link from "next/link";
import ChevronRight from "@/components/ui/ChevronRight";

type Meal = {
  name: string;
};

const meals: Meal[] = [];

export default function MealsEaten() {
  return (
    <Link
      href="/meals"
      className="group flex w-full cursor-pointer flex-col gap-1 rounded-lg border border-line bg-surface p-4 transition-colors hover:bg-surface-raised"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">Meals eaten</span>
        <ChevronRight className="text-faint transition-transform group-hover:translate-x-0.5" />
      </div>
      {meals.length === 0 ? (
        <span className="font-bold text-foreground">
          Setup or Add meals to begin tracking!
        </span>
      ) : (
        <ul className="flex flex-col gap-1">
          {meals.map((meal) => (
            <li key={meal.name} className="text-sm font-bold text-foreground">
              {meal.name}
            </li>
          ))}
        </ul>
      )}
    </Link>
  );
}
