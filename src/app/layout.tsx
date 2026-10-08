import type { Metadata, Viewport } from "next";
import "./globals.css";
import AuthProvider from "@/components/layout/AuthProvider";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Health Tracker",
  description: "Track your health and wellness goals",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const currentUser = await getCurrentUser();
  // Only the fields the UI needs cross over to client components.
  const user = currentUser && { name: currentUser.name, email: currentUser.email };

  return (
    <html
      lang="en"
      className='h-full antialiased'
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider user={user}>{children}</AuthProvider>
      </body>
    </html>
  );
}
