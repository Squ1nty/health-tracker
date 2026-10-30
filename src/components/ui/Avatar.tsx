// A round profile picture. Without an image it shows the first letter of the
// person's first name on a colour picked from their email, so each person
// keeps the same colour everywhere instead of a new one on every load.
const COLOURS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#ec4899",
];

function colourFor(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return COLOURS[Math.abs(hash) % COLOURS.length];
}

export default function Avatar({
  name,
  seed,
  image,
  className = "h-8 w-8 text-sm",
}: {
  name: string;
  // What the colour is picked from; the email, since names can be shared.
  seed: string;
  // Not uploadable yet; falls back to the letter until it is.
  image?: string | null;
  className?: string;
}) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt="" className={`shrink-0 rounded-full object-cover ${className}`} />;
  }

  return (
    <span
      aria-hidden
      style={{ backgroundColor: colourFor(seed) }}
      className={`grid shrink-0 place-items-center rounded-full font-semibold text-white ${className}`}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
