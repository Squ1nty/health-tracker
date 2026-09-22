"use client";

import { useState } from "react";
import HeroSection from "@/components/HeroSection";
import QuickStat from "@/components/QuickStat";
import Navbar from "@/components/Navbar";

export default function Home() {
  // Dev-only toggle so the logged-in view can be previewed without a real backend.
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div className="flex min-h-svh w-full flex-col">
      <Navbar />
      <main className="min-h-svh flex flex-col items-center gap-10 px-4 py-6">
        <HeroSection />

        {isLoggedIn && <QuickStat />}

        <button
          type="button"
          onClick={() => setIsLoggedIn((v) => !v)}
          className="text-center text-xs text-neutral-400 underline"
        >
          Dev: toggle logged in ({isLoggedIn ? "on" : "off"})
        </button>
      </main>
    </div>
  );
}
