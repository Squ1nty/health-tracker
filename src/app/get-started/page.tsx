import type { Metadata } from "next";
import { redirect } from "next/navigation";
import GetStarted from "@/components/home/GetStarted";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Get started | Health Tracker",
};

export default async function GetStartedPage() {
  // Already a member: straight to the app.
  if (await getCurrentUser()) redirect("/");

  return <GetStarted />;
}
