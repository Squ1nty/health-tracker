import type { Metadata } from "next";
import { redirect } from "next/navigation";
import StatPage from "@/components/layout/StatPage";
import StepsSync from "@/components/steps/StepsSync";
import StepsTracker from "@/components/steps/StepsTracker";
import { getCurrentUser } from "@/lib/auth/session";
import { getStepsByDate } from "@/lib/steps/logs";
import type { StepDay } from "@/lib/steps/shared";
import { getSyncTokenInfo, type SyncTokenInfo } from "@/lib/steps/tokens";

export const metadata: Metadata = {
  title: "Steps | Health Tracker",
};

export default async function StepsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let data: { stepsByDate: Record<string, StepDay>; token: SyncTokenInfo | null } | null = null;
  try {
    const [stepsByDate, token] = await Promise.all([
      getStepsByDate(user.id),
      getSyncTokenInfo(user.id),
    ]);
    data = { stepsByDate, token };
  } catch (error) {
    console.error("Failed to load steps", error);
  }

  return (
    <StatPage title="Steps" description="Track your daily step count." wide>
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
  );
}
