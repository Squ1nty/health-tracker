import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getAvatar } from "@/lib/profile/avatars";

// Serves a user's profile picture to anyone logged in. The URL carries a
// version (?v=) that changes with each new picture, so it's cached for good.
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/avatar/[userId]">) {
  if (!(await getCurrentUser())) return new Response(null, { status: 401 });

  const { userId } = await ctx.params;
  let avatar;
  try {
    avatar = await getAvatar(userId);
  } catch (error) {
    console.error("Failed to load avatar", error);
    return new Response(null, { status: 500 });
  }
  if (!avatar) return new Response(null, { status: 404 });

  return new Response(new Uint8Array(avatar.data.buffer), {
    headers: {
      "Content-Type": avatar.contentType,
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
