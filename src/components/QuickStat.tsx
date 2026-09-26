import MealsEaten from "@/components/MealsEaten";

type Stat = {
  label: string;
  value: string;
};

const stats: Stat[] = [
  { label: "Steps today", value: "1,234" },
  { label: "Water intake", value: "1,234L" },
];

export default function QuickStat() {
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-1 rounded-lg border border-neutral-200 bg-white p-4"
          >
            <span className="text-xs text-neutral-500">{stat.label}</span>
            <span className="text-xl font-bold text-black">{stat.value}</span>
          </div>
        ))}
      </div>
      <MealsEaten />
    </div>
  );
}
