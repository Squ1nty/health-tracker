import type { Metadata } from "next";
import { redirect } from "next/navigation";
import StatPage from "@/components/layout/StatPage";
import { QuickAddMenu, QuickAddProvider } from "@/components/ui/QuickAdd";
import WaterTracker from "@/components/water/WaterTracker";
import { getCurrentUser } from "@/lib/auth/session";
import { getQuickAdds } from "@/lib/quickAdd/settings";
import { DEFAULT_QUICK_ADDS, type QuickAdds } from "@/lib/quickAdd/shared";
import { getWaterTotals } from "@/lib/water/logs";

export const metadata: Metadata = {
  title: "Water intake | Health Tracker",
};

export default async function WaterPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let data: { mlByDate: Record<string, number>; quickAdds: QuickAdds } | null = null;
  try {
    const [mlByDate, quickAdds] = await Promise.all([
      getWaterTotals(user.id),
      getQuickAdds(user.id, "water"),
    ]);
    data = { mlByDate, quickAdds };
  } catch (error) {
    console.error("Failed to load water logs", error);
  }

  return (
    // Wraps the whole page so the header's menu and the tracker's buttons
    // share the quick add amounts.
    <QuickAddProvider kind="water" initial={data?.quickAdds ?? DEFAULT_QUICK_ADDS.water}>
      <StatPage
        title="Water intake"
        description="Track how much water you drink each day."
        action={data && <QuickAddMenu />}
        wide
      >
        {data ? (
          <WaterTracker mlByDate={data.mlByDate} />
        ) : (
          <div
            role="alert"
            className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm text-danger"
          >
            We couldn&apos;t load your water logs. Please refresh the page to try again.
          </div>
        )}
      </StatPage>
    </QuickAddProvider>
  );
}
