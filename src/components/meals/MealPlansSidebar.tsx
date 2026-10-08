"use client";

import { useEffect, useState } from "react";

// What the sidebar holds. Empty for now: this is the space set aside for it.
function SidebarContent() {
  return <p className="text-sm text-faint">Nothing here yet.</p>;
}

// The sidebar as a column beside the list, on screens wide enough for it.
export function MealPlansSidebar() {
  return (
    <aside className="hidden w-56 shrink-0 rounded-lg border border-line bg-surface p-4 md:block">
      <SidebarContent />
    </aside>
  );
}

// On phones the sidebar is tucked away: this button slides it in from the left.
export default function MealPlansSidebarButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open sidebar"
        aria-expanded={open}
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-muted transition-colors duration-200 hover:bg-surface-raised hover:text-foreground"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <rect x="2.75" y="3.75" width="14.5" height="12.5" rx="2.25" />
          <path d="M7.5 3.75v12.5" />
        </svg>
      </button>

      {/* Above the navbar (z-50), which is pinned to the top of the screen. */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[60] bg-black/60 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        inert={!open}
        aria-label="Sidebar"
        className={`fixed inset-y-0 left-0 z-[60] flex w-72 max-w-[80%] flex-col gap-4 border-r border-line bg-surface p-4 transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close sidebar"
          className="flex h-9 w-9 cursor-pointer items-center justify-center self-end rounded-md text-xl text-muted transition-colors duration-200 hover:bg-surface-raised hover:text-foreground"
        >
          ×
        </button>
        <SidebarContent />
      </aside>
    </div>
  );
}
