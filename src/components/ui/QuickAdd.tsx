"use client";

import { createContext, useContext, useEffect, useRef, useState, useTransition } from "react";
import { saveQuickAdds } from "@/app/actions/quickAdd";
import {
  QUICK_ADD_MAX,
  duplicateMessage,
  duplicateSide,
  parseQuickAdds,
  type QuickAddKind,
  type QuickAdds,
} from "@/lib/quickAdd/shared";

// Outer buttons are bigger, so they're taller; sizes shrink toward the input.
const SIZES = [
  "h-12 w-14 md:h-14 md:w-16",
  "h-10 w-12 md:h-11 md:w-14",
  "h-10 w-12 md:h-11 md:w-14",
  "h-12 w-14 md:h-14 md:w-16",
];

const boxClasses =
  "flex items-center justify-center rounded-md border border-line bg-surface text-sm font-medium text-foreground transition-colors duration-200";

// How long the duplicate warning stays up before closing itself.
const NOTICE_MS = 3000;
// How long it takes to fade out. Matches duration-300 on the box.
const FADE_MS = 300;

const itemClasses =
  "block w-full cursor-pointer px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-line";

type QuickAddState = {
  amounts: QuickAdds;
  // Non-null while the buttons are being edited: what's typed in each box.
  drafts: string[] | null;
  setDraft: (index: number, raw: string) => void;
  startEditing: () => void;
  cancelEditing: () => void;
  save: () => void;
  saving: boolean;
  // The drafts as amounts, or null while any box isn't a usable amount.
  parsed: QuickAdds | null;
  error: string | null;
};

const QuickAddContext = createContext<QuickAddState | null>(null);

function useQuickAdd() {
  const state = useContext(QuickAddContext);
  if (!state) throw new Error("useQuickAdd must be used inside a QuickAddProvider");
  return state;
}

// Holds a tracker's quick add amounts and whether they're being edited.
// Wraps the whole page, so the menu in the header and the buttons under
// the input share one state.
export function QuickAddProvider({
  kind,
  initial,
  children,
}: {
  kind: QuickAddKind;
  initial: QuickAdds;
  children: React.ReactNode;
}) {
  const [amounts, setAmounts] = useState(initial);
  const [drafts, setDrafts] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  // The duplicate warning. `shown` counts up with each one, so saving again
  // while it's up restarts the timer.
  const [notice, setNotice] = useState<{ shown: number; text: string } | null>(null);
  // True while the warning is fading out, before it's removed.
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setFading(true), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  // Once the fade has played, take the warning off the page.
  useEffect(() => {
    if (!fading) return;
    const timer = setTimeout(() => {
      setNotice(null);
      setFading(false);
    }, FADE_MS);
    return () => clearTimeout(timer);
  }, [fading]);

  const parsed = drafts && parseQuickAdds(drafts.map((draft) => Number(draft)));

  const save = () => {
    if (!parsed || saving) return;
    const duplicate = duplicateSide(parsed);
    if (duplicate) {
      const text = duplicateMessage(duplicate, parsed[duplicate === "minus" ? 0 : 2]);
      setFading(false);
      setNotice((current) => ({ shown: (current?.shown ?? 0) + 1, text }));
      return;
    }
    startSaving(async () => {
      try {
        const result = await saveQuickAdds({ kind, amounts: parsed });
        if (result.ok) {
          setAmounts(parsed);
          setDrafts(null);
        } else {
          setError(result.error);
        }
      } catch {
        setError("Couldn't reach the server. Check your connection and try again.");
      }
    });
  };

  const state: QuickAddState = {
    amounts,
    drafts,
    setDraft: (index, raw) => {
      setError(null);
      setDrafts((current) =>
        current && current.map((draft, i) => (i === index ? raw.replace(/\D/g, "").slice(0, 4) : draft))
      );
    },
    startEditing: () => {
      setError(null);
      setDrafts(amounts.map(String));
    },
    cancelEditing: () => {
      setError(null);
      setDrafts(null);
    },
    save,
    saving,
    parsed,
    error,
  };

  return (
    <QuickAddContext.Provider value={state}>
      {children}
      {notice && (
        <div
          role="alert"
          className={`fixed inset-x-4 top-1/2 z-50 mx-auto w-3/4 max-w-md -translate-y-1/2 rounded-lg border border-danger/50 bg-surface-raised p-4 text-center text-sm text-danger shadow-lg shadow-black/60 transition-opacity duration-300 ${
            fading ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          {notice.text}
        </div>
      )}
    </QuickAddContext.Provider>
  );
}

// The page header's options: a three dot menu, with a Save button to its
// left while the quick add buttons are being edited.
export function QuickAddMenu() {
  const { drafts, startEditing, cancelEditing, save, saving, parsed } = useQuickAdd();
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const editing = drafts !== null;

  // While open, a click anywhere else or Escape closes the menu.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="flex shrink-0 items-center gap-2">
      {editing && (
        <button
          type="button"
          onClick={save}
          disabled={!parsed || saving}
          className="flex h-9 cursor-pointer items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-hover active:scale-[98%] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-accent disabled:active:scale-100"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      )}

      <div ref={container} className="relative">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-label="Options"
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-muted transition-colors duration-200 hover:bg-surface-raised hover:text-foreground"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
            <circle cx="9" cy="3" r="1.6" />
            <circle cx="9" cy="9" r="1.6" />
            <circle cx="9" cy="15" r="1.6" />
          </svg>
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 top-full z-10 mt-1 w-56 overflow-hidden rounded-lg border border-line bg-surface-raised py-1 shadow-lg shadow-black/50"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                if (editing) cancelEditing();
                else startEditing();
              }}
              className={itemClasses}
            >
              {editing ? "Cancel editing" : "Adjust quick add buttons"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// The two minus and two plus buttons either side of a tracker's input
// (passed as children). While editing, each button becomes a box for its amount.
export function QuickAddRow({
  unit,
  minusVerb,
  onAdjust,
  children,
}: {
  // Used in the buttons' labels, e.g. "Add 250 ml".
  unit: string;
  // What a minus button does, e.g. "Remove".
  minusVerb: string;
  onAdjust: (delta: number) => void;
  children: React.ReactNode;
}) {
  const { amounts, drafts, setDraft, save, parsed, error } = useQuickAdd();

  const box = (index: number) => {
    const minus = index < 2;
    const amount = amounts[index];
    const sign = minus ? "-" : "+";

    if (drafts) {
      const draft = drafts[index];
      const invalid = !(Number(draft) >= 1);
      return (
        <label
          key={index}
          className={`${boxClasses} ${SIZES[index]} flex-col gap-0 focus-within:border-accent ${
            invalid ? "border-danger" : ""
          }`}
        >
          <span className="text-[10px] leading-none text-muted">{sign}</span>
          <input
            type="text"
            inputMode="numeric"
            value={draft}
            onChange={(e) => setDraft(index, e.target.value)}
            // Enter saves the amounts rather than submitting the tracker's form.
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              save();
            }}
            aria-label={`Amount for the ${sign}${amount} button`}
            className="w-full bg-transparent text-center text-sm font-medium tabular-nums text-foreground outline-none"
          />
        </label>
      );
    }

    return (
      <button
        key={index}
        type="button"
        onClick={() => onAdjust(minus ? -amount : amount)}
        aria-label={`${minus ? minusVerb : "Add"} ${amount} ${unit}`}
        className={`${boxClasses} ${SIZES[index]} cursor-pointer hover:bg-surface-raised`}
      >
        {sign}
        {amount}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-center gap-1.5 md:gap-2">
        {box(0)}
        {box(1)}
        {children}
        {box(2)}
        {box(3)}
      </div>
      {drafts && (
        <p
          role={error ? "alert" : undefined}
          className={`text-center text-xs ${error || !parsed ? "text-danger" : "text-muted"}`}
        >
          {error ??
            (parsed
              ? "Change the amounts, then tap Save."
              : `Each button needs an amount from 1 to ${QUICK_ADD_MAX.toLocaleString("en-US")}.`)}
        </p>
      )}
    </div>
  );
}
