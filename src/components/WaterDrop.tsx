// Drop outline in a 100x130 box: point at the top (y=4), round base
// bottoming out at y=120.
const DROP_PATH = "M50 4 C50 4 12 52 12 82 A38 38 0 0 0 88 82 C88 52 50 4 50 4 Z";
const DROP_TOP = 4;
const DROP_BOTTOM = 120;

export default function WaterDrop({
  level = 0,
}: {
  // How full the drop is, 0-1. Stays empty until water logging is built.
  level?: number;
}) {
  const clamped = Math.min(1, Math.max(0, level));
  const fillHeight = (DROP_BOTTOM - DROP_TOP) * clamped;

  return (
    <div className="flex w-full justify-center py-4">
      <svg
        viewBox="0 0 100 130"
        role="img"
        aria-label={`Water drop, ${Math.round(clamped * 100)}% full`}
        className="w-56 md:w-72"
      >
        <defs>
          <clipPath id="water-drop-clip">
            <path d={DROP_PATH} />
          </clipPath>
        </defs>

        <path d={DROP_PATH} className="fill-surface" />
        {/* Water rises from the base; the clip keeps it inside the drop shape. */}
        <rect
          x="0"
          y={DROP_BOTTOM - fillHeight}
          width="100"
          height={fillHeight}
          clipPath="url(#water-drop-clip)"
          className="fill-accent"
        />
        <path
          d={DROP_PATH}
          fill="none"
          strokeWidth="1.5"
          strokeLinejoin="round"
          className="stroke-faint"
        />
      </svg>
    </div>
  );
}
