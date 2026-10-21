"use client";

import HeroSection from "@/components/home/HeroSection";
import QuickStat from "@/components/home/QuickStat";
import Welcome from "@/components/home/Welcome";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/components/layout/AuthProvider";

export default function Home() {
  const { user } = useAuth();

  // Logged-out visitors get the welcome screen instead of the app.
  if (!user) return <Welcome />;

  return (
    <div className="flex min-h-svh w-full flex-col">
      <Navbar />
      <main className="min-h-svh flex flex-col items-center gap-10 px-4 py-6">
        <HeroSection name={user.name} />
        <QuickStat />
      </main>
    </div>
  );
}
