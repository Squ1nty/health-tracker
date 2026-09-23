"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white px-4 py-4 md:px-8">
      <div className="flex w-full items-center justify-between">
        <Link
          href="/"
          onClick={closeMenu}
          className="text-lg font-extrabold tracking-tight text-black md:text-xl"
        >
          Health<span className="text-emerald-600">Tracker</span>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/"
            className='flex items-center rounded-md px-4 py-2 text-sm transition-colors duration-200 hover:bg-neutral-100'
          >
            Home
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-neutral-500 transition-colors duration-200 hover:bg-neutral-100"
          >
            Log in
          </Link>
          <Link
            href="/login?mode=signup"
            className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-105 hover:bg-emerald-700"
          >
            Sign up
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          className="relative flex h-7 w-7 cursor-pointer flex-col items-center justify-center gap-1.5 transition-transform duration-200 hover:scale-105 md:hidden"
        >
          <span
            className={`h-0.5 w-6 rounded-full bg-black transition-transform duration-300 ease-out ${
              isOpen ? "translate-y-2 rotate-45" : ""
            }`}
          />
          <span
            className={`h-0.5 w-6 rounded-full bg-black transition-opacity duration-300 ease-out ${
              isOpen ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`h-0.5 w-6 rounded-full bg-black transition-transform duration-300 ease-out ${
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
        className={`absolute inset-x-0 top-full grid w-full border-b border-neutral-200 bg-white px-4 shadow-sm transition-all duration-300 ease-out md:hidden ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="w-full overflow-hidden">
          <div className="w-full py-4 flex flex-col gap-2">
            <div className="flex h-10 w-full justify-end">
              <Link
                href="/"
                onClick={closeMenu}
                className='group flex h-10 w-full items-center justify-between overflow-hidden rounded-md px-8 transition-all duration-300 ease-out hover:w-94 hover:border-neutral-300 hover:bg-neutral-100'
              >
                Home
                <p>
                  &gt;
                </p>
              </Link>
            </div>
            <hr className='border-gray-200 my-2'></hr>
            <div className="flex items-center gap-2 px-3">
              <Link
                href="/login"
                onClick={closeMenu}
                className="flex flex-1 items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-neutral-500 transition-all duration-200 hover:scale-105 hover:bg-neutral-100"
              >
                Log in
              </Link>
              <Link
                href="/login?mode=signup"
                onClick={closeMenu}
                className="flex flex-1 items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-105 hover:bg-emerald-700"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
