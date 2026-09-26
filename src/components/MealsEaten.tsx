type Meal = {
  name: string;
};

const meals: Meal[] = [];

export default function MealsEaten() {
  return (
    <div className="flex w-full flex-col gap-1 rounded-lg border border-neutral-200 bg-white p-4">
      <span className="text-xs text-neutral-500">Meals eaten</span>
      {meals.length === 0 ? (
        <span className="text-sm text-neutral-500">
          Setup or Add meals to track!
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
    </div>
  );
}
