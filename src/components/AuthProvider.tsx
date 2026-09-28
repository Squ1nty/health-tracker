"use client";

import { createContext, useContext, useState } from "react";

type AuthContextValue = {
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Dev-only login flag, shared across pages via the root layout so the
// logged-in view (e.g. the Stats nav tabs) survives client-side navigation.
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
