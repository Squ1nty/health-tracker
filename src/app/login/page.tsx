import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Log in | Health Tracker",
};

export default async function LoginPage() {
  // Already logged in: nothing to do here.
  if (await getCurrentUser()) redirect("/");

  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
