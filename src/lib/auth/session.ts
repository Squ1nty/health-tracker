import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import type { ObjectId } from "mongodb";
import { getAuthCollections } from "@/lib/auth/collections";

const SESSION_COOKIE = "session";
const SESSION_DAYS = 30;

// What the rest of the app is allowed to know about the logged-in user.
// Never includes the password hash.
export type CurrentUser = {
  id: string;
  name: string;
  email: string;
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// The cookie holds a random token; the database holds only its hash.
export async function createSession(userId: ObjectId) {
  const { sessions } = await getAuthCollections();

  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await sessions.insertOne({
    tokenHash: hashToken(token),
    userId,
    createdAt: now,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  cookieStore.delete(SESSION_COOKIE);

  if (token) {
    const { sessions } = await getAuthCollections();
    await sessions.deleteOne({ tokenHash: hashToken(token) });
  }
}

// Looks the session cookie up in the database. Wrapped in React's cache so
// the layout and any page asking in the same request share one lookup.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { users, sessions } = await getAuthCollections();

    const session = await sessions.findOne({
      tokenHash: hashToken(token),
      expiresAt: { $gt: new Date() },
    });
    if (!session) return null;

    const user = await users.findOne(
      { _id: session.userId },
      { projection: { name: 1, email: 1 } }
    );
    if (!user) return null;

    return { id: user._id.toHexString(), name: user.name, email: user.email };
  } catch (error) {
    // If the database is unreachable, treat the visitor as logged out
    // instead of crashing every page.
    console.error("Failed to load session", error);
    return null;
  }
});
