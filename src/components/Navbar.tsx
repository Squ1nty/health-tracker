"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ChevronRight from "@/components/ChevronRight";
import { useAuth } from "@/components/AuthProvider";
import { logout } from "@/app/actions/auth";

const statLinks = [
  { href: "/steps", label: "Steps" },
  { href: "/water", label: "Water intake" },
  { href: "/meals", label: "Meals" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, isLoggedIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-line bg-background px-4 py-4 md:px-8">
      <div className="flex w-full items-center justify-between">
        <Link
          href="/"
          onClick={closeMenu}
          className="text-lg font-extrabold tracking-tight text-foreground md:text-xl"
        >
          Health<span className="text-accent">Tracker</span>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/"
            className='flex items-center rounded-md px-4 py-2 text-sm transition-colors duration-200 hover:bg-surface-raised'
          >
            Home
          </Link>
          {isLoggedIn && (
            <div
              className="relative"
              onMouseEnter={() => setIsStatsOpen(true)}
              onMouseLeave={() => setIsStatsOpen(false)}
            >
              <button
                type="button"
                onClick={() => setIsStatsOpen((open) => !open)}
                aria-expanded={isStatsOpen}
                className="flex cursor-pointer items-center gap-1 rounded-md px-4 py-2 text-sm transition-colors duration-200 hover:bg-surface-raised"
              >
                Stats
                <ChevronRight
                  className={`text-faint transition-transform duration-300 ease-out ${
                    isStatsOpen ? "-rotate-90" : "rotate-90"
                  }`}
                />
              </button>

              {/* pt-2 bridges the gap between the button and the panel so the
                  hover isn't lost while the cursor moves down into it. */}
              <div
                className={`absolute left-0 top-full pt-2 transition-all duration-300 ease-out ${
                  isStatsOpen
                    ? "translate-y-0 opacity-100"
                    : "pointer-events-none -translate-y-2 opacity-0"
                }`}
              >
                <div className="flex w-48 flex-col gap-1 rounded-lg border border-line bg-surface p-2">
                  {statLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsStatsOpen(false)}
                      className="group flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors duration-200 hover:bg-surface-raised"
                    >
                      {link.label}
                      <ChevronRight className="text-faint transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
          {user ? (
            <>
              <span className="max-w-40 truncate px-2 text-sm text-muted" title={user.email}>
                {user.name}
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  className="inline-flex cursor-pointer items-center rounded-md border border-line px-4 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-surface-raised"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-muted transition-colors duration-200 hover:bg-surface-raised"
              >
                Log in
              </Link>
              <Link
                href="/login?mode=signup"
                className="inline-flex items-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-105 hover:bg-accent-hover"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          className="relative flex h-7 w-7 cursor-pointer flex-col items-center justify-center gap-1.5 transition-transform duration-200 hover:scale-105 md:hidden"
        >
          <span
            className={`h-0.5 w-6 rounded-full bg-foreground transition-transform duration-300 ease-out ${
              isOpen ? "translate-y-2 rotate-45" : ""
            }`}
          />
          <span
            className={`h-0.5 w-6 rounded-full bg-foreground transition-opacity duration-300 ease-out ${
              isOpen ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`h-0.5 w-6 rounded-full bg-foreground transition-transform duration-300 ease-out ${
              isOpen ? "-translate-y-2 -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {/* Always mounted so the open/close transition can animate; grid-rows
          collapses to 0fr when closed, and overflow-hidden on the inner
          wrapper clips the content, giving a smooth slide down/up.
          Positioned absolute + anchored to the nav's bottom edge so it
          overlays the page instead of growing the nav's own height and
          pushing everything below it down. */}
      <div
        className={`absolute inset-x-0 top-full grid w-full border-b border-line bg-background px-4 transition-all duration-300 ease-out md:hidden ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="w-full overflow-hidden">
          <div className="w-full py-4 flex flex-col gap-2">
            <div className="flex h-10 w-full justify-end">
              <Link
                href="/"
                onClick={closeMenu}
                className='group flex h-10 w-full items-center justify-between overflow-hidden rounded-md px-8 transition-all duration-300 ease-out hover:w-94 hover:border-line hover:bg-surface-raised'
              >
                Home
                <p>
                  &gt;
                </p>
              </Link>
            </div>
            {isLoggedIn &&
              statLinks.map((link) => (
                <div key={link.href} className="flex h-10 w-full justify-end">
                  <Link
                    href={link.href}
                    onClick={closeMenu}
                    className='group flex h-10 w-full items-center justify-between overflow-hidden rounded-md px-8 transition-all duration-300 ease-out hover:w-94 hover:border-line hover:bg-surface-raised'
                  >
                    {link.label}
                    <p>
                      &gt;
                    </p>
                  </Link>
                </div>
              ))}
            <hr className='border-line my-2'></hr>
            {user ? (
              <div className="flex items-center justify-between gap-3 px-3">
                <span className="min-w-0 truncate text-sm text-muted" title={user.email}>
                  {user.name}
                </span>
                <form action={logout} onSubmit={closeMenu}>
                  <button
                    type="submit"
                    className="flex cursor-pointer items-center justify-center rounded-md border border-line px-4 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-surface-raised"
                  >
                    Log out
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3">
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="flex flex-1 items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-muted transition-all duration-200 hover:scale-105 hover:bg-surface-raised"
                >
                  Log in
                </Link>
                <Link
                  href="/login?mode=signup"
                  onClick={closeMenu}
                  className="flex flex-1 items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-105 hover:bg-accent-hover"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
