// Profile picture constants and helpers shared by the browser and the server.

// The picture is shrunk in the browser before upload: its shortest side to
// this many pixels, keeping its shape, so it still fills the circle.
export const AVATAR_SIZE = 256;
// Caps the longest side too, so a panorama doesn't come out huge.
export const AVATAR_MAX_SIDE = 1024;
// Largest upload the server accepts once shrunk (typically 20–40 KB).
export const AVATAR_MAX_BYTES = 300 * 1024;
export const AVATAR_TYPES = ["image/webp", "image/jpeg"] as const;
export type AvatarType = (typeof AVATAR_TYPES)[number];

// The version on the end changes with each new picture, so browsers can
// cache a picture forever and still pick up a replacement straight away.
export function avatarUrl(userId: string, updatedAt: Date) {
  return `/api/avatar/${userId}?v=${updatedAt.getTime()}`;
}
