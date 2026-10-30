import type { Metadata } from "next";
import { ObjectId } from "mongodb";
import { redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import AvatarEditor from "@/components/profile/AvatarEditor";
import { getAuthCollections } from "@/lib/auth/collections";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Profile | Health Tracker",
};

async function getJoinedAt(userId: string) {
  try {
    const { users } = await getAuthCollections();
    const user = await users.findOne(
      { _id: new ObjectId(userId) },
      { projection: { createdAt: 1 } }
    );
    return user?.createdAt ?? null;
  } catch (error) {
    console.error("Failed to load profile", error);
    return null;
  }
}

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const joinedAt = await getJoinedAt(user.id);

  return (
    <div className="flex min-h-svh w-full flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col items-center px-4 py-8">
        {/* Header: the picture leads, Twitter-style, with who you are under it. */}
        <header className="flex w-full max-w-md flex-col items-center gap-4 border-b border-line pb-8 text-center">
          <AvatarEditor name={user.name} email={user.email} image={user.avatarUrl} />
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="truncate text-2xl font-extrabold tracking-tight text-foreground">
              {user.name}
            </h1>
            <p className="truncate text-sm text-muted">{user.email}</p>
            {joinedAt && (
              <p className="text-xs text-faint">
                Joined{" "}
                {joinedAt.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
            )}
          </div>
        </header>
      </main>
    </div>
  );
}
