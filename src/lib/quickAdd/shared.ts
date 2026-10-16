// Quick add constants and helpers shared by the browser and the server.

// The trackers with a row of quick add buttons.
export const QUICK_ADD_KINDS = ["water", "steps"] as const;
export type QuickAddKind = (typeof QUICK_ADD_KINDS)[number];

// The four buttons' amounts, left to right: the two minus buttons, then
// the two plus buttons. Each is a positive size; the button supplies the sign.
export type QuickAdds = [number, number, number, number];

export const DEFAULT_QUICK_ADDS: Record<QuickAddKind, QuickAdds> = {
  water: [250, 100, 100, 250],
  steps: [1000, 100, 100, 1000],
};

// Four digits is as much as the smallest button can show.
export const QUICK_ADD_MAX = 9999;

export function isQuickAddKind(value: unknown): value is QuickAddKind {
  return QUICK_ADD_KINDS.includes(value as QuickAddKind);
}

// Which side, if any, has both its buttons on the same amount. Two of the
// same button would do the same thing, so that isn't allowed.
export function duplicateSide(amounts: QuickAdds): "minus" | "plus" | null {
  if (amounts[0] === amounts[1]) return "minus";
  if (amounts[2] === amounts[3]) return "plus";
  return null;
}

export function duplicateMessage(side: "minus" | "plus", amount: number) {
  const sign = side === "minus" ? "-" : "+";
  return `Both ${side} buttons are set to ${sign}${amount}. Give each one its own amount.`;
}

// Checks amounts sent from the browser; null if they aren't four whole
// numbers from 1 to QUICK_ADD_MAX.
export function parseQuickAdds(input: unknown): QuickAdds | null {
  if (!Array.isArray(input) || input.length !== 4) return null;
  for (const value of input) {
    if (typeof value !== "number" || !Number.isInteger(value)) return null;
    if (value < 1 || value > QUICK_ADD_MAX) return null;
  }
  return [input[0], input[1], input[2], input[3]];
}
