import HeroSection from "@/components/home/HeroSection";
import QuickStat, { type QuickStatData } from "@/components/home/QuickStat";
import Welcome from "@/components/home/Welcome";
import Navbar from "@/components/layout/Navbar";
import { getCurrentUser } from "@/lib/auth/session";
import { getStepsByDate } from "@/lib/steps/logs";
import { daysFromUtcToday } from "@/lib/steps/shared";
import { getWaterTotals } from "@/lib/water/logs";

// Keeps only the days that could be "today" somewhere: the user's local
// date is within a day of the server's UTC date, and the browser picks.
function aroundToday<T>(byDate: Record<string, T>) {
  return Object.fromEntries(
    Object.entries(byDate).filter(([date]) => Math.abs(daysFromUtcToday(date) ?? 2) <= 1)
  );
}

export default async function Home() {
  const user = await getCurrentUser();

  // Logged-out visitors get the welcome screen instead of the app.
  if (!user) return <Welcome />;

  let data: QuickStatData | null = null;
  try {
    const [stepsByDate, mlByDate] = await Promise.all([
      getStepsByDate(user.id),
      getWaterTotals(user.id),
    ]);
    data = {
      stepsByDate: Object.fromEntries(
        Object.entries(aroundToday(stepsByDate)).map(([date, day]) => [date, day.steps])
      ),
      mlByDate: aroundToday(mlByDate),
    };
  } catch (error) {
    console.error("Failed to load today's stats", error);
  }

  return (
    <div className="flex min-h-svh w-full flex-col">
      <Navbar />
      <main className="min-h-svh flex flex-col items-center gap-10 px-4 py-6">
        <HeroSection name={user.name} />
        <QuickStat data={data} />
      </main>
    </div>
  );
}
