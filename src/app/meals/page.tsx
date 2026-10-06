import type { Metadata } from "next";
import { redirect } from "next/navigation";
import MealPlanTable from "@/components/MealPlanTable";
import StatPage from "@/components/StatPage";
import { getCurrentUser } from "@/lib/auth/session";
import { getMealPlan } from "@/lib/meals/plans";
import type { MealPlan } from "@/lib/meals/shared";

export const metadata: Metadata = {
  title: "Meals | Health Tracker",
};

export default async function MealsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let plan: MealPlan | null = null;
  try {
    plan = await getMealPlan(user.id);
  } catch (error) {
    console.error("Failed to load meal plan", error);
  }

  return (
    <StatPage title="Meals" description="Plan your meals around the macros you want to hit." wide>
      {plan ? (
        <MealPlanTable initialPlan={plan} />
      ) : (
        <div
          role="alert"
          className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm text-danger"
        >
          We couldn&apos;t load your meal plan. Please refresh the page to try again.
        </div>
      )}
    </StatPage>
  );
}
