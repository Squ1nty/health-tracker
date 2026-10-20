import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import type { Collection, Db, Document } from "mongodb";
import { applyValidator, getDb } from "@/lib/mongodb";

// Failed logins are counted over a rolling window, per email and per IP
// address. The email limit stops guessing one account's password; the
// looser IP limit stops one visitor working through many accounts.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_EMAIL = 5;
const MAX_PER_IP = 20;

// One document per failed attempt and per thing it counts against. The
// key is a hash, so no emails or IP addresses are stored.
type LoginAttemptDoc = { key: string; createdAt: Date };

const LOGIN_ATTEMPT_VALIDATOR: Document = {
  $jsonSchema: {
    bsonType: "object",
    required: ["key", "createdAt"],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "objectId" },
      key: { bsonType: "string", minLength: 64, maxLength: 64 },
      createdAt: { bsonType: "date" },
    },
  },
};

async function setUp(db: Db) {
  await applyValidator(db, "loginAttempts", LOGIN_ATTEMPT_VALIDATOR);
  await Promise.all([
    db.collection("loginAttempts").createIndex({ key: 1, createdAt: -1 }),
    // TTL index: MongoDB deletes each attempt once it's out of the window.
    db
      .collection("loginAttempts")
      .createIndex({ createdAt: 1 }, { expireAfterSeconds: WINDOW_MS / 1000 }),
  ]);
}

declare global {
  var _loginAttemptsSetup: { rules: string; promise: Promise<void> } | undefined;
}

const RULES = JSON.stringify(LOGIN_ATTEMPT_VALIDATOR);

// Validator and indexes are applied once per server process, on first use,
// and again if the validator changes (see meals/plans.ts).
async function getLoginAttempts(): Promise<Collection<LoginAttemptDoc>> {
  const db = await getDb();
  if (global._loginAttemptsSetup?.rules !== RULES) {
    const promise = setUp(db).catch((error) => {
      if (global._loginAttemptsSetup?.promise === promise) global._loginAttemptsSetup = undefined;
      throw error;
    });
    global._loginAttemptsSetup = { rules: RULES, promise };
  }
  await global._loginAttemptsSetup.promise;
  return db.collection<LoginAttemptDoc>("loginAttempts");
}

function hashKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

// The visitor's IP address, as passed on by the host's proxy. Null when
// there isn't one, e.g. in local development.
async function clientIp() {
  const list = await headers();
  const forwarded = list.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || list.get("x-real-ip") || null;
}

async function limits(email: string) {
  const ip = await clientIp();
  const keys = [{ key: hashKey(`email:${email}`), max: MAX_PER_EMAIL }];
  if (ip) keys.push({ key: hashKey(`ip:${ip}`), max: MAX_PER_IP });
  return keys;
}

// How long until this email can try again from here, in ms; 0 if it can
// try now. Counted the same whether or not the account exists, so this
// can't be used to check which emails are registered.
export async function loginLockout(email: string) {
  const attempts = await getLoginAttempts();
  const since = new Date(Date.now() - WINDOW_MS);
  let wait = 0;

  for (const { key, max } of await limits(email)) {
    // The max-th most recent failure. If it's still in the window, the
    // limit is reached until it ages out.
    const [limiting] = await attempts
      .find({ key, createdAt: { $gt: since } }, { projection: { createdAt: 1 } })
      .sort({ createdAt: -1 })
      .skip(max - 1)
      .limit(1)
      .toArray();
    if (limiting) {
      wait = Math.max(wait, limiting.createdAt.getTime() + WINDOW_MS - Date.now());
    }
  }
  return wait;
}

export async function recordFailedLogin(email: string) {
  const attempts = await getLoginAttempts();
  const createdAt = new Date();
  await attempts.insertMany((await limits(email)).map(({ key }) => ({ key, createdAt })));
}

// A successful login wipes the email's failures, but not the IP's.
export async function clearFailedLogins(email: string) {
  const attempts = await getLoginAttempts();
  await attempts.deleteMany({ key: hashKey(`email:${email}`) });
}
