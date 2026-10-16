"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { setQuickAdds } from "@/lib/quickAdd/settings";
import {
  QUICK_ADD_MAX,
  duplicateMessage,
  duplicateSide,
  isQuickAddKind,
  parseQuickAdds,
} from "@/lib/quickAdd/shared";

export type SaveQuickAddsResult = { ok: true } | { ok: false; error: string };

// Saves the logged-in user's quick add amounts for one tracker. Arguments
// arrive from the browser, so they're treated as untrusted.
export async function saveQuickAdds(input: {
  kind: string;
  amounts: number[];
}): Promise<SaveQuickAddsResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in again." };

  const kind = input?.kind;
  if (!isQuickAddKind(kind)) return { ok: false, error: "Unknown tracker." };
  const amounts = parseQuickAdds(input?.amounts);
  if (!amounts) {
    return {
      ok: false,
      error: `Each button needs a whole number from 1 to ${QUICK_ADD_MAX.toLocaleString("en-US")}.`,
    };
  }
  const duplicate = duplicateSide(amounts);
  if (duplicate) {
    return { ok: false, error: duplicateMessage(duplicate, amounts[duplicate === "minus" ? 0 : 2]) };
  }

  try {
    await setQuickAdds(user.id, kind, amounts);
  } catch (error) {
    console.error("Saving quick adds failed", error);
    return { ok: false, error: "Something went wrong on our end. Please try again." };
  }

  revalidatePath(`/${kind}`);
  return { ok: true };
}
