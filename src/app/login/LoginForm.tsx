"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { login, signup } from "@/app/actions/auth";
import { NAME_MAX, PASSWORD_MAX, PASSWORD_MIN } from "@/lib/auth/validation";

type Mode = "login" | "signup";

const inputClasses = (hasError: boolean) =>
  `flex h-10 w-full items-center rounded-md border px-3 py-0 text-sm outline-none transition-colors focus:border-accent ${
    hasError ? "border-danger bg-danger/10" : "border-line bg-surface"
  }`;

const labelClasses = "mb-1 block text-sm font-medium text-muted";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-xs text-danger">
      {message}
    </p>
  );
}

// Password field with an eye button that toggles between dots and plain text.
function PasswordInput({
  hasError,
  disabled,
  ...props
}: { hasError: boolean } & Omit<React.ComponentProps<"input">, "type" | "className">) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        disabled={disabled}
        type={visible ? "text" : "password"}
        className={`${inputClasses(hasError)} pr-10`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        disabled={disabled}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center rounded-r-md text-faint transition-colors hover:text-foreground"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-4 w-4"
        >
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
          {/* Slash through the eye while the password is showing: click to hide. */}
          {visible && <path d="m3 3 18 18" />}
        </svg>
      </button>
    </div>
  );
}

export default function LoginForm() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(
    searchParams.get("mode") === "signup" ? "signup" : "login"
  );

  // Each mode keeps its own result, so switching tabs doesn't show the
  // other form's errors.
  const [signupState, signupAction, signupPending] = useActionState(signup, undefined);
  const [loginState, loginAction, loginPending] = useActionState(login, undefined);

  const isSignup = mode === "signup";
  const state = isSignup ? signupState : loginState;
  const errors = state?.errors ?? {};
  const pending = signupPending || loginPending;

  return (
    <div className="flex min-h-svh w-full flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col items-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-foreground">
              {isSignup ? "Create an account" : "Welcome back"}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {isSignup
                ? "Sign up to start tracking your health"
                : "Log in to continue tracking your health"}
            </p>
          </div>

          <div className="relative mb-4 flex rounded-lg bg-surface p-1 text-sm font-medium">
            <div
              className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-md bg-surface-raised transition-transform duration-200 ease-out cursor-pointer ${
                isSignup ? "translate-x-full" : "translate-x-0"
              }`}
            />
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`relative z-10 flex-1 rounded-md py-1.5 transition-colors ${
                !isSignup ? "text-foreground" : "text-muted"
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`relative z-10 flex-1 rounded-md py-1.5 transition-colors ${
                isSignup ? "text-foreground" : "text-muted"
              }`}
            >
              Sign up
            </button>
          </div>

          {state?.message && (
            <div
              role="alert"
              className="mb-4 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
            >
              {state.message}
            </div>
          )}

          {/* noValidate: the server action is the single source of validation,
              so errors show in our own styling rather than browser popups.
              React resets the form after each submit; defaultValue puts back
              what was typed (passwords are deliberately not restored). */}
          <form
            action={isSignup ? signupAction : loginAction}
            noValidate
            className="flex flex-col"
          >
            <div>
              <label htmlFor="email" className={labelClasses}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                defaultValue={state?.values?.email}
                aria-invalid={Boolean(errors.email)}
                aria-describedby="email-error"
                className={inputClasses(Boolean(errors.email))}
              />
              <FieldError id="email-error" message={errors.email} />
            </div>

            {/* The sign-up-only fields stay mounted so they can animate, and
                are disabled in login mode so they're skipped by Tab and left
                out of the submitted form. */}
            <div
              className={`grid transition-all duration-200 ease-out ${
                isSignup ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="pt-3">
                  <label htmlFor="name" className={labelClasses}>
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    maxLength={NAME_MAX}
                    placeholder="Jane Doe"
                    disabled={!isSignup}
                    defaultValue={signupState?.values?.name}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby="name-error"
                    className={inputClasses(Boolean(errors.name))}
                  />
                  <FieldError id="name-error" message={errors.name} />
                </div>
              </div>
            </div>

            <div className="pt-3">
              <label htmlFor="password" className={labelClasses}>
                Password
              </label>
              <PasswordInput
                id="password"
                name="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                maxLength={PASSWORD_MAX}
                placeholder="••••••••"
                aria-invalid={Boolean(errors.password)}
                aria-describedby="password-error password-hint"
                hasError={Boolean(errors.password)}
              />
              <FieldError id="password-error" message={errors.password} />
              {isSignup && !errors.password && (
                <p id="password-hint" className="mt-1 text-xs text-faint">
                  At least {PASSWORD_MIN} characters, with a letter and a number.
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
                  <label htmlFor="confirmPassword" className={labelClasses}>
                    Confirm password
                  </label>
                  <PasswordInput
                    id="confirmPassword"
                    name="confirmPassword"
                    autoComplete="new-password"
                    maxLength={PASSWORD_MAX}
                    placeholder="••••••••"
                    disabled={!isSignup}
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby="confirmPassword-error"
                    hasError={Boolean(errors.confirmPassword)}
                  />
                  <FieldError id="confirmPassword-error" message={errors.confirmPassword} />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="mt-4 flex h-10 items-center justify-center rounded-md bg-accent text-sm font-medium text-white cursor-pointer transition-all hover:scale-[102%] hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 disabled:hover:bg-accent"
            >
              {isSignup
                ? pending ? "Creating account…" : "Sign up"
                : pending ? "Logging in…" : "Log in"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-faint">
            <div className="h-px flex-1 bg-line" />
            or continue with
            <div className="h-px flex-1 bg-line" />
          </div>

          {/* TODO: wire these up to real Google / Apple OAuth once a backend exists */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled
              title="Coming soon"
              className="flex h-10 cursor-not-allowed items-center justify-center gap-2 rounded-md border border-line text-sm font-medium text-muted opacity-60"
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
              className="flex h-10 cursor-not-allowed items-center justify-center gap-2 rounded-md border border-line text-sm font-medium text-muted opacity-60"
            >
              <svg viewBox="0 0 384 512" className="h-6 w-6" fill="currentColor">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141 0 184.8 0 273.5c0 26.2 4.8 53.3 14.4 81.2 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-57.7-90-57.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
              </svg>
              Continue with Apple
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
