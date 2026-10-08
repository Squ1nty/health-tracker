"use client";

import { useEffect, useRef, useState } from "react";
import { dateKey } from "@/lib/water/shared";
import { useTodayKey } from "@/lib/water/useTodayKey";

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
const TOP_LEVEL = LEVEL_CLASSES.length - 1;

// Outline for today's circle while it's still empty; shared with the legend.
const TODAY_RING = "ring-1 ring-faint";
// Outline for the day picked for editing (grids that allow picking).
const SELECTED_RING = "ring-2 ring-foreground";

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

// A GitHub-style year grid: one square per day, shaded by that day's value.
// Used for both water (ml) and steps.
export default function ActivityGrid({
  valueByDate = {},
  scaleMax,
  formatValue,
  emptyLabel,
  selectedDate,
  onSelectDate,
  isSelectable,
}: {
  // Each day's value, keyed by YYYY-MM-DD.
  valueByDate?: Record<string, number>;
  // Top of the color scale, split into four equal bands. Higher values
  // still count; they just show as full blue.
  scaleMax: number;
  // Value with its unit, e.g. "1.25 L" or "8,432 steps".
  formatValue: (value: number) => string;
  // Tooltip for a day with nothing, e.g. "No water logged".
  emptyLabel: string;
  // Optional day picking: the picked day gets an outline, and days passing
  // `isSelectable` become buttons that call `onSelectDate`.
  selectedDate?: string | null;
  onSelectDate?: (key: string) => void;
  isSelectable?: (key: string) => boolean;
}) {
  const currentYear = new Date().getFullYear();
  // The year list goes back to the earliest year with anything logged.
  const firstYear = Math.min(
    currentYear,
    ...Object.keys(valueByDate).map((key) => Number(key.slice(0, 4)))
  );
  const years = Array.from(
    { length: currentYear - firstYear + 1 },
    (_, i) => currentYear - i
  );
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const todayKey = useTodayKey();

  const scrollRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLElement | null>(null);

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

  const levelStep = scaleMax / TOP_LEVEL;
  // E.g. for water (4 L scale): up to 1 L -> 1, 1-2 L -> 2, 2-3 L -> 3, over 3 L -> 4.
  const levelFor = (value: number) =>
    value <= 0 ? 0 : Math.min(TOP_LEVEL, Math.ceil(value / levelStep));

  // Legend hover text for each level, derived from the same step as levelFor.
  const levelLabels = LEVEL_CLASSES.map((_, level) => {
    if (level === 0) return "Nothing logged";
    const low = formatValue((level - 1) * levelStep);
    const high = formatValue(level * levelStep);
    return level === TOP_LEVEL
      ? `Over ${low}`
      : level === 1 ? `Up to ${high}` : `${low} - ${high}`;
  });

  const weeks = buildWeeks(selectedYear);

  // A month's label sits above the week column containing its 1st.
  const monthLabels = weeks.flatMap((week, index) => {
    const firstOfMonth = week.find((day) => day?.getDate() === 1);
    return firstOfMonth ? [{ index, label: MONTHS[firstOfMonth.getMonth()] }] : [];
  });

  const total = weeks
    .flat()
    .reduce((sum, day) => sum + (day ? valueByDate[dateKey(day)] ?? 0 : 0), 0);

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start">
      <div className="min-w-0 flex-1 rounded-lg border border-line bg-surface p-4">
        <p className="mb-3 text-sm text-muted">
          <span className="font-semibold text-foreground">{formatValue(total)}</span>{" "}
          logged in {selectedYear}
        </p>

        {/* Padding leaves room for the selection outline at the grid's edges. */}
        <div ref={scrollRef} className="overflow-x-auto p-0.5 pb-1.5">
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
                const value = valueByDate[key] ?? 0;
                const isToday = key === todayKey;
                const isSelected = key === selectedDate;
                const dayLabel = day.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                });
                const title = `${
                  value > 0
                    ? `${formatValue(value)} on ${dayLabel}`
                    : `${emptyLabel} on ${dayLabel}`
                }${isToday ? " (today)" : ""}`;
                // Today is drawn as a circle so color stays reserved for the
                // day's value; an empty today gets a faint ring so it's still findable.
                const outline = isSelected
                  ? SELECTED_RING
                  : isToday && value === 0 ? TODAY_RING : "";
                const className = `${isToday ? "rounded-full" : "rounded-xs"} ${outline} ${
                  LEVEL_CLASSES[levelFor(value)]
                }`;
                const style = { gridColumn: col + 2, gridRow: row + 2 };
                const ref = isToday
                  ? (element: HTMLElement | null) => {
                      todayRef.current = element;
                    }
                  : undefined;

                if (onSelectDate && (isSelectable?.(key) ?? true)) {
                  return (
                    <button
                      key={key}
                      ref={ref}
                      type="button"
                      onClick={() => onSelectDate(key)}
                      title={title}
                      aria-label={title}
                      aria-pressed={isSelected}
                      className={`${className} cursor-pointer ${
                        isSelected ? "" : "hover:ring-1 hover:ring-muted"
                      }`}
                      style={style}
                    />
                  );
                }
                return (
                  <div key={key} ref={ref} title={title} className={className} style={style} />
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
            {LEVEL_CLASSES.map((levelClass, level) => (
              <span
                key={levelClass}
                title={levelLabels[level]}
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
