import { LEVEL_CLASSES } from "@/components/ui/ActivityGrid";

// The trackers' year grid legend, Less to More, for the get started demos.
// The square for the demo's current shade is picked out.
export default function GridLegend({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted">
      <span className="mr-1">Less</span>
      {LEVEL_CLASSES.map((levelClass, index) => (
        <span
          key={levelClass}
          className={`h-4 w-4 rounded-xs transition-shadow duration-300 ${levelClass} ${
            index === level ? "ring-2 ring-foreground" : ""
          }`}
        />
      ))}
      <span className="ml-1">More</span>
    </div>
  );
}

// The grid's shade for a day: empty, then four even steps up to `max`.
export function gridLevel(value: number, max: number) {
  const top = LEVEL_CLASSES.length - 1;
  return value <= 0 ? 0 : Math.min(top, Math.ceil(value / (max / top)));
}
