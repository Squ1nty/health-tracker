import Link from "next/link";

const FEATURES = ["Steps", "Water", "Meals"];

// What logged-out visitors see on opening the app: the name up top, and a
// way in at the bottom, within thumb reach on a phone.
export default function Welcome() {
  return (
    <main className="flex min-h-svh w-full flex-col items-center px-4 pb-10 pt-16">
      <div className="flex w-full max-w-md flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            Health<span className="text-accent">Tracker</span>
          </h1>
          <p className="max-w-xs text-muted">
            Track your steps, water and meals, all in one place.
          </p>
          <ul className="mt-2 flex gap-2">
            {FEATURES.map((feature) => (
              <li
                key={feature}
                className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted"
              >
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <Link
            href="/get-started"
            className="flex h-12 items-center justify-center rounded-md bg-accent text-base font-semibold text-white transition-all duration-200 hover:bg-accent-hover active:scale-[98%]"
          >
            Get started
          </Link>
          <p className="text-center text-sm text-muted">
            Already a member?{" "}
            <Link href="/login" className="font-medium text-accent hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
