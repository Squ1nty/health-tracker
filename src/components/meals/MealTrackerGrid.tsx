"use client";

import ActivityGrid from "@/components/ui/ActivityGrid";

const formatItems = (items: number) => `${items} ${items === 1 ? "item" : "items"}`;

// The year grid for the meal tracker: one square per day, shaded by how
// many food items were ticked off that day.
export default function MealTrackerGrid({
  itemsByDate,
  scaleMax,
}: {
  // Each day's count of eaten items, keyed by YYYY-MM-DD.
  itemsByDate: Record<string, number>;
  // The count that shows as full blue.
  scaleMax: number;
}) {
  return (
    <ActivityGrid
      valueByDate={itemsByDate}
      scaleMax={scaleMax}
      formatValue={formatItems}
      emptyLabel="Nothing eaten"
    />
  );
}
