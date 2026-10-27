"use client";

import Link from "next/link";
import { useRef } from "react";
import MealsDemo from "@/components/home/MealsDemo";
import StepsDemo from "@/components/home/StepsDemo";
import WalkingShoes from "@/components/home/WalkingShoes";
import WaterDemo from "@/components/home/WaterDemo";
import FadeIn from "@/components/ui/FadeIn";

// The page's backgrounds, top to bottom. Each tracker gets a screen of its
// own colour, and a gradient band between screens fades one into the next.
// Class names are written out in full so Tailwind can find them. Each screen
// also takes its tracker's accent, so the demos match the real pages.
const TRACKERS = [
  { id: "steps", title: "Steps", theme: "theme-steps", bg: "bg-intro-steps", from: "from-intro-steps", to: "to-intro-steps" },
  { id: "water", title: "Water", theme: "theme-water", bg: "bg-intro-water", from: "from-intro-water", to: "to-intro-water" },
  { id: "meals", title: "Meals", theme: "theme-meals", bg: "bg-intro-meals", from: "from-intro-meals", to: "to-intro-meals" },
];

// The intro and sign-up screens sit on the app's own black.
const BLACK = { from: "from-background", to: "to-background" };

const screen = "flex min-h-svh w-full flex-col items-center justify-center px-4";
// Tracker screens start from the top, with the heading just under the fade.
const trackerScreen = "relative flex min-h-svh w-full flex-col items-center px-4 pt-12";

// The fade between two screens' colours.
function Blend({ from, to }: { from: string; to: string }) {
  return <div aria-hidden="true" className={`h-50 w-full bg-linear-to-b ${from} ${to}`} />;
}

// The get started page: one long scroll, each section fading in as it
// arrives. The first fills the screen, with an arrow showing there's more.
export default function GetStarted() {
  const next = useRef<HTMLElement>(null);

  return (
    <main className="flex w-full flex-col items-center text-center">
      {/* Fixed, so the way out is there however far down the page you are. */}
      <Link
        href="/"
        aria-label="Close"
        className="fixed right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors duration-200 hover:bg-surface-raised hover:text-foreground"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
          className="h-5 w-5"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </Link>

      <section className={`relative ${screen}`}>
        <FadeIn>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            Let&apos;s get started!
          </h1>
        </FadeIn>

        <button
          type="button"
          onClick={() => next.current?.scrollIntoView({ behavior: "smooth" })}
          aria-label="Scroll down"
          className="absolute bottom-10 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full text-accent"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="h-8 w-8 animate-nudge motion-reduce:animate-none"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </section>

      {TRACKERS.map((tracker, index) => (
        <div key={tracker.id} className="w-full">
          <Blend from={index === 0 ? BLACK.from : TRACKERS[index - 1].from} to={tracker.to} />
          <section ref={index === 0 ? next : undefined} className={`${trackerScreen} ${tracker.bg} ${tracker.theme}`}>
            {tracker.id === "steps" && (
              <WalkingShoes className="absolute right-4 top-6 w-24 md:right-12 md:w-32" />
            )}
            <FadeIn>
              <h2 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
                {tracker.title}
              </h2>
            </FadeIn>
            {tracker.id === "steps" && (
              <>
                <FadeIn>
                  <p className="mt-3 max-w-xs text-balance text-base text-foreground/80">
                    Log your steps, or sync them automatically from your iPhone.
                  </p>
                </FadeIn>
                {/* Fills the rest of the screen, with the demo in the middle of it. */}
                <div className="flex w-full flex-1 flex-col items-center justify-center py-10">
                  <FadeIn>
                    <StepsDemo />
                  </FadeIn>
                </div>
              </>
            )}
            {tracker.id === "meals" && (
              <>
                <FadeIn>
                  <p className="mt-3 max-w-xs text-balance text-base text-foreground/80">
                    Plan your meals, then tick them off as you eat.
                  </p>
                </FadeIn>
                {/* Fills the rest of the screen, with the demo in the middle of it. */}
                <div className="flex w-full flex-1 flex-col items-center justify-center py-10">
                  <FadeIn className="flex w-full justify-center">
                    <MealsDemo />
                  </FadeIn>
                </div>
              </>
            )}
            {tracker.id === "water" && (
              <>
                <FadeIn>
                  <p className="mt-3 max-w-xs text-balance text-base text-foreground/80">
                    Tap to log a drink and watch your drop fill up.
                  </p>
                </FadeIn>
                {/* Fills the rest of the screen, with the demo in the middle of it. */}
                <div className="flex w-full flex-1 flex-col items-center justify-center py-10">
                  <FadeIn>
                    <WaterDemo />
                  </FadeIn>
                </div>
              </>
            )}
          </section>
        </div>
      ))}

      <Blend from={TRACKERS.at(-1)!.from} to={BLACK.to} />
      <section className={screen}>
        <FadeIn>
          <h2 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            Ready to start?
          </h2>
        </FadeIn>
        <FadeIn>
          <p className="mt-3 max-w-xs text-balance text-base text-foreground/80">
            Steps, water and meals, all in one place.
          </p>
        </FadeIn>
        {/* A nod back to the screens above, in their colours. */}
        <FadeIn>
          <ul className="mt-6 flex gap-2">
            {TRACKERS.map((tracker) => (
              <li
                key={tracker.id}
                className={`rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-foreground ${tracker.bg}`}
              >
                {tracker.title}
              </li>
            ))}
          </ul>
        </FadeIn>

        <FadeIn className="mt-12 flex w-full max-w-md flex-col gap-4">
          <Link
            href="/login?mode=signup"
            className="flex h-12 items-center justify-center rounded-md bg-accent text-base font-semibold text-white transition-all duration-200 hover:bg-accent-hover active:scale-[98%]"
          >
            Create your account
          </Link>
          <p className="text-sm text-muted">
            Already a member?{" "}
            <Link href="/login" className="font-medium text-accent hover:underline">
              Log in
            </Link>
          </p>
        </FadeIn>
      </section>
    </main>
  );
}
