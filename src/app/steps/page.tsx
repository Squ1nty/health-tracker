import type { Metadata } from "next";
import { redirect } from "next/navigation";
import StatPage from "@/components/layout/StatPage";
import StepsSync from "@/components/steps/StepsSync";
import StepsTracker from "@/components/steps/StepsTracker";
import { QuickAddMenu, QuickAddProvider } from "@/components/ui/QuickAdd";
import { getCurrentUser } from "@/lib/auth/session";
import { getQuickAdds } from "@/lib/quickAdd/settings";
import { DEFAULT_QUICK_ADDS, type QuickAdds } from "@/lib/quickAdd/shared";
import { getStepsByDate } from "@/lib/steps/logs";
import type { StepDay } from "@/lib/steps/shared";
import { getSyncTokenInfo, type SyncTokenInfo } from "@/lib/steps/tokens";

export const metadata: Metadata = {
  title: "Steps | Health Tracker",
};

export default async function StepsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let data: {
    stepsByDate: Record<string, StepDay>;
    token: SyncTokenInfo | null;
    quickAdds: QuickAdds;
  } | null = null;
  try {
    const [stepsByDate, token, quickAdds] = await Promise.all([
      getStepsByDate(user.id),
      getSyncTokenInfo(user.id),
      getQuickAdds(user.id, "steps"),
    ]);
    data = { stepsByDate, token, quickAdds };
  } catch (error) {
    console.error("Failed to load steps", error);
  }

  return (
    // Wraps the whole page so the header's menu and the tracker's buttons
    // share the quick add amounts.
    <QuickAddProvider kind="steps" initial={data?.quickAdds ?? DEFAULT_QUICK_ADDS.steps}>
      <StatPage
        theme="steps"
        title="Steps"
        description="Track your daily step count."
        action={data && <QuickAddMenu />}
        wide
      >
        {data ? (
          <>
            <StepsTracker stepsByDate={data.stepsByDate} />
            <StepsSync
              tokenInfo={
                data.token && {
                  createdAt: data.token.createdAt.toISOString(),
                  lastUsedAt: data.token.lastUsedAt?.toISOString() ?? null,
                }
              }
            />
          </>
        ) : (
          <div
            role="alert"
            className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm text-danger"
          >
            We couldn&apos;t load your steps. Please refresh the page to try again.
          </div>
        )}
      </StatPage>
    </QuickAddProvider>
  );
}
