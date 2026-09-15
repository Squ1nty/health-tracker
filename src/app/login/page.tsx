"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";

type Mode = "login" | "signup";

export default function Login() {
  const [mode, setMode] = useState<Mode>("login");

  // Dev-only toggle so error styling can be previewed without a real backend.
  const [showError, setShowError] = useState(false);

  const isSignup = mode === "signup";
  const errorMessage = isSignup
    ? "An account with this email already exists."
    : "Incorrect email or password.";

  const inputClasses = (extra = "") =>
    `flex h-10 w-full items-center rounded-md border px-3 py-0 text-sm outline-none transition-colors focus:border-black ${
      showError ? "border-red-400 bg-red-50" : "border-neutral-300"
    } ${extra}`;

  return (
    <div className="relative w-full">
      <Navbar />
      <main className="min-h-svh flex flex-col items-center px-4 pt-28 pb-12">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-black">
              {isSignup ? "Create an account" : "Welcome back"}
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              {isSignup
                ? "Sign up to start tracking your health"
                : "Log in to continue tracking your health"}
            </p>
          </div>

          <div className="relative mb-4 flex rounded-lg bg-neutral-100 p-1 text-sm font-medium">
            <div
              className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-md bg-white shadow-sm transition-transform duration-200 ease-out ${
                isSignup ? "translate-x-full" : "translate-x-0"
              }`}
            />
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`relative z-10 flex-1 rounded-md py-1.5 transition-colors ${
                !isSignup ? "text-black" : "text-neutral-500"
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`relative z-10 flex-1 rounded-md py-1.5 transition-colors ${
                isSignup ? "text-black" : "text-neutral-500"
              }`}
            >
              Sign up
            </button>
          </div>

          {showError && (
            <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600">
              {errorMessage}
            </div>
          )}

          <form onSubmit={(e) => e.preventDefault()} className="flex flex-col">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Email
              </label>
              <input type="email" placeholder="you@example.com" className={inputClasses()} />
            </div>

            <div
              className={`grid transition-all duration-200 ease-out ${
                isSignup ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="pt-3">
                  <label className="mb-1 block text-sm font-medium text-neutral-700">
                    Name
                  </label>
                  <input type="text" placeholder="Jane Doe" className={inputClasses()} />
                </div>
              </div>
            </div>

            <div className="pt-3">
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Password
              </label>
              <input type="password" placeholder="••••••••" className={inputClasses()} />
              {showError && !isSignup && (
                <p className="mt-1 text-xs text-red-600">
                  Check your password and try again.
                </p>
              )}
            </div>

            <div
              className={`grid transition-all duration-200 ease-out ${
                isSignup ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="pt-3">
                  <label className="mb-1 block text-sm font-medium text-neutral-700">
                    Confirm password
                  </label>
                  <input type="password" placeholder="••••••••" className={inputClasses()} />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 flex h-10 items-center justify-center rounded-md bg-black text-sm font-medium text-white cursor-pointer transition-all hover:scale-[102%]"
            >
              {isSignup ? "Sign up" : "Log in"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-neutral-400">
            <div className="h-px flex-1 bg-neutral-200" />
            or continue with
            <div className="h-px flex-1 bg-neutral-200" />
          </div>

          {/* TODO: wire these up to real Google / Apple OAuth once a backend exists */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled
              title="Coming soon"
              className="flex h-10 cursor-not-allowed items-center justify-center gap-2 rounded-md border border-neutral-300 text-sm font-medium text-neutral-700 opacity-60"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5">
                <path
                  fill="#4285F4"
                  d="M23.52 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.44c-.28 1.48-1.13 2.73-2.4 3.58v2.98h3.86c2.26-2.08 3.62-5.16 3.62-8.8z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.92l-3.86-2.98c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.12-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29A11.98 11.98 0 000 12c0 1.94.47 3.77 1.29 5.38l3.98-3.09z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.84 3.6-4.96 6.73-4.96z"
                />
              </svg>
              Continue with Google
            </button>
            <button
              type="button"
              disabled
              title="Coming soon"
              className="flex h-10 cursor-not-allowed items-center justify-center gap-2 rounded-md border border-neutral-300 text-sm font-medium text-neutral-700 opacity-60"
            >
              <svg viewBox="0 0 384 512" className="h-6 w-6" fill="currentColor">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141 0 184.8 0 273.5c0 26.2 4.8 53.3 14.4 81.2 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-57.7-90-57.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
              </svg>
              Continue with Apple
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowError((v) => !v)}
            className="mt-6 w-full text-center text-xs text-neutral-400 underline"
          >
            Dev: toggle error state ({showError ? "on" : "off"})
          </button>
        </div>
      </main>
    </div>
  );
}
