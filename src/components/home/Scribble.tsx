import { Caveat } from "next/font/google";

// A handwriting font, for notes that look scribbled onto the get started page.
export const handwriting = Caveat({ subsets: ["latin"], weight: "600" });

// A hand-drawn arrow for the scribbled notes, pointing up and to the right
// before any rotating.
export function ScribbleArrow({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`h-10 w-10 ${className}`}
    >
      <path d="M8 36C9 22 17 11 31 6" />
      <path d="M31 6L22 5M31 6L26 14" />
    </svg>
  );
}
