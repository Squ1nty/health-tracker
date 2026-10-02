"use server";

import { redirect } from "next/navigation";
import { getAuthCollections } from "@/lib/auth/collections";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, deleteSession } from "@/lib/auth/session";
import {
  validateLogin,
  validateSignup,
  type FieldErrors,
} from "@/lib/auth/validation";

export type AuthFormState =
  | {
      // Per-field problems, shown under the matching input.
      errors?: FieldErrors;
      // Form-level problem, shown in the banner above the form.
      message?: string;
      // Echoed back so the form keeps what was typed. Never includes passwords.
      values?: { name?: string; email?: string };
    }
  | undefined;

const EMAIL_TAKEN = "An account with this email already exists.";
const BAD_CREDENTIALS = "Incorrect email or password.";
const SERVER_ERROR = "Something went wrong on our end. Please try again.";

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

// 11000 = duplicate key, raised by the unique index on users.email.
function isDuplicateKey(error: unknown) {
  return (error as { code?: number }).code === 11000;
}

export async function signup(
  _previous: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const input = {
    name: field(formData, "name"),
    email: field(formData, "email"),
    password: field(formData, "password"),
    confirmPassword: field(formData, "confirmPassword"),
  };
  const values = { name: input.name, email: input.email };

  const result = validateSignup(input);
  if (!result.ok) return { errors: result.errors, values };
  const { name, email, password } = result.data;

  try {
    const { users } = await getAuthCollections();

    // Friendly early answer; the unique index below is the real guarantee
    // if two signups for the same email race each other.
    const existing = await users.findOne({ email }, { projection: { _id: 1 } });
    if (existing) return { errors: { email: EMAIL_TAKEN }, values };

    const { insertedId } = await users.insertOne({
      name,
      email,
      passwordHash: await hashPassword(password),
      createdAt: new Date(),
    });
    await createSession(insertedId);
  } catch (error) {
    if (isDuplicateKey(error)) return { errors: { email: EMAIL_TAKEN }, values };
    console.error("Signup failed", error);
    return { message: SERVER_ERROR, values };
  }

  // redirect() works by throwing, so it has to sit outside the try/catch.
  redirect("/");
}

// Hash to compare against when the email isn't registered, so a login
// attempt takes the same time whether or not the account exists.
let dummyHash: Promise<string> | undefined;

export async function login(
  _previous: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const input = {
    email: field(formData, "email"),
    password: field(formData, "password"),
  };
  const values = { email: input.email };

  const result = validateLogin(input);
  if (!result.ok) return { errors: result.errors, values };
  const { email, password } = result.data;

  try {
    const { users } = await getAuthCollections();
    const user = await users.findOne({ email });

    dummyHash ??= hashPassword("not-a-real-password");
    const passwordMatches = await verifyPassword(
      password,
      user?.passwordHash ?? (await dummyHash)
    );
    // One message for both "no such account" and "wrong password", so the
    // form can't be used to check which emails are registered.
    if (!user || !passwordMatches) return { message: BAD_CREDENTIALS, values };

    await createSession(user._id);
  } catch (error) {
    console.error("Login failed", error);
    return { message: SERVER_ERROR, values };
  }

  redirect("/");
}

export async function logout() {
  try {
    await deleteSession();
  } catch (error) {
    // The cookie is already cleared; the orphaned session row expires on its own.
    console.error("Logout failed to delete session", error);
  }
  redirect("/");
}
