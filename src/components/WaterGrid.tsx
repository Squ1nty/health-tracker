"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const CELL_SIZE = 10;
const CELL_GAP = 3;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// Rows run Sunday -> Saturday; like GitHub, only every other day is labelled.
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

// Level 0 is an empty day; 1-4 are progressively stronger shades of the accent blue.
const LEVEL_CLASSES = [
  "bg-surface-raised",
  "bg-accent/25",
  "bg-accent/50",
  "bg-accent/75",
  "bg-accent",
];

// Outline for today's circle while it's still empty; shared with the legend.
const TODAY_RING = "ring-1 ring-faint";

function levelFor(cups: number) {
  if (cups <= 0) return 0;
  if (cups <= 2) return 1;
  if (cups <= 4) return 2;
  if (cups <= 6) return 3;
  return 4;
}

// Local-time YYYY-MM-DD (toISOString would shift the day across timezones).
function dateKey(date: Date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

// Splits the year into Sunday-first weeks. Slots before Jan 1 and after
// Dec 31 are null so the first and last columns line up like GitHub's.
function buildWeeks(year: number) {
  const weeks: (Date | null)[][] = [];
  const first = new Date(year, 0, 1);
  const last = new Date(year, 11, 31);

  let week: (Date | null)[] = Array(first.getDay()).fill(null);
  for (const day = new Date(first); day <= last; day.setDate(day.getDate() + 1)) {
    week.push(new Date(day));
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    weeks.push([...week, ...Array(7 - week.length).fill(null)]);
  }
  return weeks;
}

// Today's key, read only in the browser. The page is prerendered at build
// time, so reading the date during render would bake the build date into
// the HTML; the server snapshot is null and the real date fills in on hydration.
const noopSubscribe = () => () => {};
function useTodayKey() {
  return useSyncExternalStore(
    noopSubscribe,
    () => dateKey(new Date()),
    () => null
  );
}

export default function WaterGrid({
  cupsByDate = {},
}: {
  // Cups logged per day, keyed by YYYY-MM-DD. Empty until manual logging is built.
  cupsByDate?: Record<string, number>;
}) {
  const currentYear = new Date().getFullYear();
  // Tracking starts this year; once accounts exist this becomes the signup year.
  const firstYear = currentYear;
  const years = Array.from(
    { length: currentYear - firstYear + 1 },
    (_, i) => currentYear - i
  );
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const todayKey = useTodayKey();

  const scrollRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);

  // When the grid overflows (narrow screens), center today's cell. Past
  // years jump to December instead, like GitHub. Setting scrollLeft rather
  // than scrollIntoView keeps the page itself from scrolling vertically;
  // the browser clamps the value near either end of the year.
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const cell = todayRef.current;
    if (cell) {
      const offset =
        cell.getBoundingClientRect().left - container.getBoundingClientRect().left;
      container.scrollLeft += offset - container.clientWidth / 2 + cell.clientWidth / 2;
    } else {
      container.scrollLeft = selectedYear < currentYear ? container.scrollWidth : 0;
    }
  }, [selectedYear, currentYear, todayKey]);

  const weeks = buildWeeks(selectedYear);

  // A month's label sits above the week column containing its 1st.
  const monthLabels = weeks.flatMap((week, index) => {
    const firstOfMonth = week.find((day) => day?.getDate() === 1);
    return firstOfMonth ? [{ index, label: MONTHS[firstOfMonth.getMonth()] }] : [];
  });

  const totalCups = weeks
    .flat()
    .reduce((sum, day) => sum + (day ? cupsByDate[dateKey(day)] ?? 0 : 0), 0);

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start">
      <div className="min-w-0 flex-1 rounded-lg border border-line bg-surface p-4">
        <p className="mb-3 text-sm text-muted">
          <span className="font-semibold text-foreground">{totalCups}</span>{" "}
          {totalCups === 1 ? "cup" : "cups"} logged in {selectedYear}
        </p>

        <div ref={scrollRef} className="overflow-x-auto pb-1">
          <div
            className="inline-grid text-[10px] leading-none text-muted"
            style={{
              gridTemplateColumns: `auto repeat(${weeks.length}, ${CELL_SIZE}px)`,
              gridTemplateRows: `auto repeat(7, ${CELL_SIZE}px)`,
              gap: CELL_GAP,
            }}
          >
            {monthLabels.map(({ index, label }) => (
              <span
                key={label}
                className="whitespace-nowrap pb-1"
                style={{ gridColumn: index + 2, gridRow: 1 }}
              >
                {label}
              </span>
            ))}

            {DAY_LABELS.map((label, row) => (
              <span
                key={row}
                className="flex items-center pr-1.5"
                style={{ gridColumn: 1, gridRow: row + 2 }}
              >
                {label}
              </span>
            ))}

            {weeks.map((week, col) =>
              week.map((day, row) => {
                if (!day) return null;
                const key = dateKey(day);
                const cups = cupsByDate[key] ?? 0;
                const isToday = key === todayKey;
                const dayLabel = day.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                });
                // Today is drawn as a circle so color stays reserved for cup
                // count; an empty today gets a faint ring so it's still findable.
                const shape = isToday
                  ? `rounded-full ${cups === 0 ? TODAY_RING : ""}`
                  : "rounded-xs";
                return (
                  <div
                    key={key}
                    ref={isToday ? todayRef : undefined}
                    title={`${
                      cups > 0
                        ? `${cups} ${cups === 1 ? "cup" : "cups"} on ${dayLabel}`
                        : `No water logged on ${dayLabel}`
                    }${isToday ? " (today)" : ""}`}
                    className={`${shape} ${LEVEL_CLASSES[levelFor(cups)]}`}
                    style={{ gridColumn: col + 2, gridRow: row + 2 }}
                  />
                );
              })
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-4 text-[10px] text-muted">
          <div className="flex items-center gap-1.5">
            <span
              className={`rounded-full ${TODAY_RING} ${LEVEL_CLASSES[0]}`}
              style={{ width: CELL_SIZE, height: CELL_SIZE }}
            />
            <span>Today</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="mr-1">Less</span>
            {LEVEL_CLASSES.map((levelClass) => (
              <span
                key={levelClass}
                className={`rounded-xs ${levelClass}`}
                style={{ width: CELL_SIZE, height: CELL_SIZE }}
              />
            ))}
            <span className="ml-1">More</span>
          </div>
        </div>
      </div>

      <div className="order-first flex gap-1 md:order-none md:w-24 md:flex-col">
        {years.map((year) => (
          <button
            key={year}
            type="button"
            onClick={() => setSelectedYear(year)}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-left text-sm transition-colors duration-200 ${
              year === selectedYear
                ? "bg-accent font-medium text-white"
                : "text-muted hover:bg-surface-raised hover:text-foreground"
            }`}
          >
            {year}
          </button>
        ))}
      </div>
    </div>
  );
}
