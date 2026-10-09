import type { Metadata } from "next";
import MealPlansSidebarButton from "@/components/meals/MealPlansSidebar";
import StatPage from "@/components/layout/StatPage";

export const metadata: Metadata = {
  title: "Meal Tracker | Health Tracker",
};

export default function MealTrackerPage() {
  return (
    <StatPage
      title="Meal Tracker"
      description="Track the meals you eat each day."
      action={<MealPlansSidebarButton />}
      back={{ href: "/meals", label: "Meals" }}
      wide
    />
  );
}
