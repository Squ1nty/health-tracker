import type { Metadata } from "next";
import { redirect } from "next/navigation";
import StatPage from "@/components/StatPage";
import WaterTracker from "@/components/WaterTracker";
import { getCurrentUser } from "@/lib/auth/session";
import { getWaterTotals } from "@/lib/water/logs";

export const metadata: Metadata = {
  title: "Water intake | Health Tracker",
};

export default async function WaterPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let mlByDate: Record<string, number> | null = null;
  try {
    mlByDate = await getWaterTotals(user.id);
  } catch (error) {
    console.error("Failed to load water logs", error);
  }

  return (
    <StatPage
      title="Water intake"
      description="Track how much water you drink each day."
      wide
    >
      {mlByDate ? (
        <WaterTracker mlByDate={mlByDate} />
      ) : (
        <div
          role="alert"
          className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm text-danger"
        >
          We couldn&apos;t load your water logs. Please refresh the page to try again.
        </div>
      )}
    </StatPage>
  );
}
