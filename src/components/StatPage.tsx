import Link from "next/link";
import Navbar from "@/components/Navbar";
import ChevronRight from "@/components/ChevronRight";

export default function StatPage({
  title,
  description,
  children,
  wide = false,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
  // Widens the content column for pages with large visuals (e.g. the water grid).
  wide?: boolean;
}) {
  return (
    <div className="flex min-h-svh w-full flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col items-center px-4 py-6">
        <div
          className={`flex w-full flex-col gap-6 ${wide ? "max-w-4xl" : "max-w-md"}`}
        >
          <Link
            href="/"
            className="group flex w-fit items-center gap-1 text-sm text-muted transition-colors duration-200 hover:text-foreground"
          >
            <ChevronRight className="rotate-180 transition-transform duration-200 group-hover:-translate-x-0.5" />
            Home
          </Link>

          <div>
            <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
            <p className="mt-1 text-sm text-muted">{description}</p>
          </div>

          {children ?? (
            <div className="rounded-lg border border-line bg-surface p-4 text-sm text-muted">
              Nothing logged yet.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
