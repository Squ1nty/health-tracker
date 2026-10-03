// Drop outline in a 100x130 box: point at the top (y=4), round base
// bottoming out at y=120.
const DROP_PATH = "M50 4 C50 4 12 52 12 82 A38 38 0 0 0 88 82 C88 52 50 4 50 4 Z";
const DROP_TOP = 4;
const DROP_BOTTOM = 120;

export default function WaterDrop({
  level = 0,
}: {
  // How full the drop is, 0-1 (today's intake as a share of the daily goal).
  level?: number;
}) {
  const clamped = Math.min(1, Math.max(0, level));

  return (
    <div className="flex w-full justify-center pt-4">
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
        {/* The water is a full-height block scaled up from the base, so the
            level can animate; the clip sits on the wrapper (not the block)
            so it isn't scaled along with it. */}
        <g clipPath="url(#water-drop-clip)">
          <rect
            x="0"
            y={DROP_TOP}
            width="100"
            height={DROP_BOTTOM - DROP_TOP}
            className="fill-accent transition-transform duration-700 ease-out"
            style={{
              transform: `scaleY(${clamped})`,
              transformOrigin: "bottom",
              transformBox: "fill-box",
            }}
          />
        </g>
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
