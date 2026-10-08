import Link from "next/link";
import ChevronRight from "@/components/ui/ChevronRight";
import MealsEaten from "@/components/home/MealsEaten";

type Stat = {
  label: string;
  value: string;
  href: string;
};

const stats: Stat[] = [
  { label: "Steps today", value: "1,234", href: "/steps" },
  { label: "Water intake", value: "1,234L", href: "/water" },
];

export default function QuickStat() {
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group flex cursor-pointer flex-col gap-1 rounded-lg border border-line bg-surface p-4 transition-colors hover:bg-surface-raised"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">{stat.label}</span>
              <ChevronRight className="text-faint transition-transform group-hover:translate-x-0.5" />
            </div>
            <span className="text-xl font-bold text-foreground">{stat.value}</span>
          </Link>
        ))}
      </div>
      <MealsEaten />
    </div>
  );
}
