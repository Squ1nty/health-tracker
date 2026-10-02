"use client";

import { createContext, useContext } from "react";

export type AuthUser = {
  name: string;
  email: string;
};

// undefined = no provider mounted; null = logged out.
const AuthContext = createContext<AuthUser | null | undefined>(undefined);

// The root layout reads the session on the server and passes the user in,
// so client components (e.g. the navbar) can tell who is logged in without
// their own request.
export default function AuthProvider({
  user,
  children,
}: {
  user: AuthUser | null;
  children: React.ReactNode;
}) {
  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const user = useContext(AuthContext);
  if (user === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return { user, isLoggedIn: user !== null };
}
