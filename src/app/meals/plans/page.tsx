import type { Metadata } from "next";
import { redirect } from "next/navigation";
import MealPlansList from "@/components/meals/MealPlansList";
import MealPlansSidebarButton, { MealPlansSidebar } from "@/components/meals/MealPlansSidebar";
import StatPage from "@/components/layout/StatPage";
import { getCurrentUser } from "@/lib/auth/session";
import { listSavedPlans } from "@/lib/meals/saved";
import type { SavedPlanSummary } from "@/lib/meals/shared";

export const metadata: Metadata = {
  title: "Meal Plans | Health Tracker",
};

export default async function MealPlansPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let plans: SavedPlanSummary[] | null = null;
  try {
    plans = await listSavedPlans(user.id);
  } catch (error) {
    console.error("Failed to load saved meal plans", error);
  }

  return (
    <StatPage
      title="Meal Plans"
      description="Your saved meal plans."
      action={<MealPlansSidebarButton />}
      back={{ href: "/meals", label: "Meals" }}
      wide
    >
      <div className="flex items-start gap-6">
        <MealPlansSidebar />
        <div className="min-w-0 flex-1">
          {plans ? (
            <MealPlansList initialPlans={plans} />
          ) : (
            <div
              role="alert"
              className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm text-danger"
            >
              We couldn&apos;t load your meal plans. Please refresh the page to try again.
            </div>
          )}
        </div>
      </div>
    </StatPage>
  );
}
