import type { Metadata } from "next";
import StatPage from "@/components/StatPage";

export const metadata: Metadata = {
  title: "Meals | Health Tracker",
};

export default function MealsPage() {
  return (
    <StatPage title="Meals" description="Log and review the meals you eat." />
  );
}
