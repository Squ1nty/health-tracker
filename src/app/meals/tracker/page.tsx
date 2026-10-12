import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import MealTracker from "@/components/meals/MealTracker";
import MealPlansSidebarButton from "@/components/meals/MealPlansSidebar";
import StatPage from "@/components/layout/StatPage";
import { getCurrentUser } from "@/lib/auth/session";
import { getActivePlan } from "@/lib/meals/saved";
import { isTrackable, mealSets, type MealPlan } from "@/lib/meals/shared";
import { getMealLog, type MealLog } from "@/lib/meals/tracker";

export const metadata: Metadata = {
  title: "Meal Tracker | Health Tracker",
};

export default async function MealTrackerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let data: { plan: MealPlan | null; log: MealLog } | null = null;
  try {
    const [plan, log] = await Promise.all([getActivePlan(user.id), getMealLog(user.id)]);
    data = { plan, log };
  } catch (error) {
    console.error("Failed to load meal tracker", error);
  }

  const plan = data?.plan;

  return (
    <StatPage
      title="Meal Tracker"
      description="Tick off the meals in your active plan as you eat them."
      action={<MealPlansSidebarButton />}
      back={{ href: "/meals", label: "Meals" }}
      wide
    >
      {!data ? (
        <div
          role="alert"
          className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm text-danger"
        >
          We couldn&apos;t load your meal tracker. Please refresh the page to try again.
        </div>
      ) : plan && isTrackable(plan.rows) ? (
        <MealTracker
          planName={plan.name}
          sets={mealSets(plan.rows)}
          itemsByDate={data.log.itemsByDate}
          recentEaten={data.log.recentEaten}
        />
      ) : (
        // The tracker has nothing to list without a plan to follow.
        <div className="rounded-lg border border-line bg-surface p-4 text-sm text-muted">
          <p className="font-semibold text-foreground">The meal tracker isn&apos;t available yet.</p>
          <p className="mt-1">
            {plan
              ? "Your active meal plan needs at least one header and one food item."
              : "Save a meal plan with at least one header and one food item to start tracking."}{" "}
            The tracker follows the plan at the top of your meal plans.
          </p>
          <Link
            href={plan ? "/meals/plans" : "/meals"}
            className="mt-3 inline-block font-medium text-accent hover:underline"
          >
            {plan ? "Go to your meal plans" : "Go to your current plan"}
          </Link>
        </div>
      )}
    </StatPage>
  );
}
