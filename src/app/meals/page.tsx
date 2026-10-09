import type { Metadata } from "next";
import { redirect } from "next/navigation";
import MealPlanMenu from "@/components/meals/MealPlanMenu";
import MealPlanTable from "@/components/meals/MealPlanTable";
import MealPlansSidebarButton from "@/components/meals/MealPlansSidebar";
import StatPage from "@/components/layout/StatPage";
import { getCurrentUser } from "@/lib/auth/session";
import { getMealPlan } from "@/lib/meals/plans";
import { countSavedPlans } from "@/lib/meals/saved";
import type { MealPlan } from "@/lib/meals/shared";

export const metadata: Metadata = {
  title: "Meals | Health Tracker",
};

export default async function MealsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let plan: MealPlan | null = null;
  let savedPlans = 0;
  try {
    [plan, savedPlans] = await Promise.all([getMealPlan(user.id), countSavedPlans(user.id)]);
  } catch (error) {
    console.error("Failed to load meal plan", error);
  }

  return (
    <StatPage
      title="Meals"
      description="Plan your meals around the macros you want to hit."
      action={
        <div className="flex items-center gap-1">
          <MealPlansSidebarButton />
          <MealPlanMenu hasSavedPlans={savedPlans > 0} />
        </div>
      }
      wide
    >
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
