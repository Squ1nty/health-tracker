"use client";

import { useEffect } from "react";

const buttonClasses =
  "flex h-10 flex-1 cursor-pointer items-center justify-center rounded-md px-4 text-sm font-semibold transition-colors duration-200";

// A yes/no question shown over the page, in place of the browser's own
// confirm box. Render it only while the question is being asked.
export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  // What the button that goes ahead says, e.g. "Delete".
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    // Above the navbar (z-50), which is pinned to the top of the screen.
    <div
      onClick={onCancel}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        onClick={(event) => event.stopPropagation()}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-line bg-surface-raised p-5 shadow-lg shadow-black/60"
      >
        <div className="flex flex-col gap-1">
          <h2 id="confirm-title" className="text-base font-semibold text-foreground">
            {title}
          </h2>
          <p id="confirm-message" className="text-sm text-muted">
            {message}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Cancel takes focus, so Enter by reflex doesn't go ahead. */}
          <button
            type="button"
            onClick={onCancel}
            autoFocus
            className={`${buttonClasses} border border-line text-foreground hover:bg-line`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`${buttonClasses} bg-danger text-white hover:bg-danger/85`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
