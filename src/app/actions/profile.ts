"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { removeAvatar, setAvatar, sniffAvatarType } from "@/lib/profile/avatars";
import { AVATAR_MAX_BYTES } from "@/lib/profile/shared";

export type AvatarResult = { ok: true } | { ok: false; error: string };

// Saves the logged-in user's profile picture. The browser has already
// shrunk it, but the upload is still untrusted: it's checked for size and
// for really being an image before it's stored.
export async function uploadAvatar(formData: FormData): Promise<AvatarResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in again." };

  const file = formData.get("avatar");
  if (!(file instanceof Blob) || file.size === 0) {
    return { ok: false, error: "Please choose a picture." };
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return { ok: false, error: "That picture is too large. Please try another." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const contentType = sniffAvatarType(bytes);
  if (!contentType) return { ok: false, error: "That file isn't a supported picture." };

  try {
    await setAvatar(user.id, bytes, contentType);
  } catch (error) {
    console.error("Failed to save avatar", error);
    return { ok: false, error: "Couldn't save your picture. Please try again." };
  }
  // The picture shows in the navbar on every page.
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteAvatar(): Promise<AvatarResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in again." };

  try {
    await removeAvatar(user.id);
  } catch (error) {
    console.error("Failed to remove avatar", error);
    return { ok: false, error: "Couldn't remove your picture. Please try again." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
