import Link from "next/link";
import Navbar from "@/components/Navbar";
import ChevronRight from "@/components/ChevronRight";

export default function StatPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh w-full flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col items-center px-4 py-6">
        <div className="flex w-full max-w-md flex-col gap-6">
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
