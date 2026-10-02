"use client";

import HeroSection from "@/components/HeroSection";
import QuickStat from "@/components/QuickStat";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/components/AuthProvider";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-svh w-full flex-col">
      <Navbar />
      <main className="min-h-svh flex flex-col items-center gap-10 px-4 py-6">
        <HeroSection name={user?.name} />

        {user && <QuickStat />}
      </main>
    </div>
  );
}
