import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import Navbar from "@/components/layout/Navbar";
import ChevronRight from "@/components/ui/ChevronRight";

export default async function StatPage({
  title,
  description,
  action,
  children,
  wide = false,
  back = { href: "/", label: "Home" },
}: {
  title: string;
  description: string;
  // Sits in the top right corner, level with the title (e.g. a menu button).
  action?: React.ReactNode;
  children?: React.ReactNode;
  // Widens the content column for pages with large visuals (e.g. the water grid).
  wide?: boolean;
  // Where the link above the title leads. Home unless the page sits under another one.
  back?: { href: string; label: string };
}) {
  // Stat pages are per-user, so they need a logged-in account.
  if (!(await getCurrentUser())) redirect("/login");

  return (
    <div className="flex min-h-svh w-full flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col items-center px-4 py-6">
        <div
          className={`flex w-full flex-col gap-6 ${wide ? "max-w-4xl" : "max-w-md"}`}
        >
          <Link
            href={back.href}
            className="group flex w-fit items-center gap-1 text-sm text-muted transition-colors duration-200 hover:text-foreground"
          >
            <ChevronRight className="rotate-180 transition-transform duration-200 group-hover:-translate-x-0.5" />
            {back.label}
          </Link>

          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
              <p className="mt-1 text-sm text-muted">{description}</p>
            </div>
            {action}
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
