const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Circular progress ring; the steps counterpart to the water drop.
// Whatever is passed as children sits in the middle.
export default function StepsRing({
  level = 0,
  children,
}: {
  // How complete the ring is, 0-1 (today's steps as a share of the daily goal).
  level?: number;
  children?: React.ReactNode;
}) {
  const clamped = Math.min(1, Math.max(0, level));

  return (
    <div className="relative w-56 md:w-64">
      {/* Rotated so the ring starts filling from the top instead of the right. */}
      <svg
        viewBox="0 0 120 120"
        role="img"
        aria-label={`Step goal ring, ${Math.round(clamped * 100)}% complete`}
        className="-rotate-90"
      >
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          strokeWidth="7"
          className="stroke-surface-raised"
        />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - clamped)}
          // Hidden at zero, where the rounded cap would still draw a dot.
          className={`stroke-accent transition-[stroke-dashoffset] duration-700 ease-out ${
            clamped === 0 ? "opacity-0" : ""
          }`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        {children}
      </div>
    </div>
  );
}
