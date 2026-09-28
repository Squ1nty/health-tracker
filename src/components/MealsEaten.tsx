import Link from "next/link";
import ChevronRight from "@/components/ChevronRight";

type Meal = {
  name: string;
};

const meals: Meal[] = [];

export default function MealsEaten() {
  return (
    <Link
      href="/meals"
      className="group flex w-full cursor-pointer flex-col gap-1 rounded-lg border border-neutral-200 bg-white p-4 transition-colors hover:bg-neutral-50"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-500">Meals eaten</span>
        <ChevronRight className="text-neutral-400 transition-transform group-hover:translate-x-0.5" />
      </div>
      {meals.length === 0 ? (
        <span className="font-bold text-black">
          Setup or Add meals to begin tracking!
        </span>
      ) : (
        <ul className="flex flex-col gap-1">
          {meals.map((meal) => (
            <li key={meal.name} className="text-sm font-bold text-black">
              {meal.name}
            </li>
          ))}
        </ul>
      )}
    </Link>
  );
}
