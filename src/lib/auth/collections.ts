import "server-only";
import type { Collection, Db, Document, ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { EMAIL_MAX, NAME_MAX } from "@/lib/auth/validation";

// _id is left off both types: the driver adds it on reads and generates it on insert.
export type UserDoc = {
  name: string;
  // Always stored trimmed and lowercased; unique.
  email: string;
  passwordHash: string;
  createdAt: Date;
};

export type SessionDoc = {
  // SHA-256 of the cookie token, so a database leak can't be replayed as a login.
  tokenHash: string;
  userId: ObjectId;
  createdAt: Date;
  expiresAt: Date;
};

// Database-level rules. These back up the app's own validation: even a
// buggy code path or a manual insert can't store a malformed account.
const USER_VALIDATOR: Document = {
  $jsonSchema: {
    bsonType: "object",
    required: ["name", "email", "passwordHash", "createdAt"],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "objectId" },
      name: { bsonType: "string", minLength: 1, maxLength: NAME_MAX },
      email: {
        bsonType: "string",
        maxLength: EMAIL_MAX,
        pattern: "^[^\\sA-Z@]+@[^\\sA-Z@]+\\.[^\\sA-Z@]+$",
      },
      passwordHash: { bsonType: "string", pattern: "^scrypt\\$" },
      createdAt: { bsonType: "date" },
    },
  },
};

const SESSION_VALIDATOR: Document = {
  $jsonSchema: {
    bsonType: "object",
    required: ["tokenHash", "userId", "createdAt", "expiresAt"],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "objectId" },
      tokenHash: { bsonType: "string", minLength: 64, maxLength: 64 },
      userId: { bsonType: "objectId" },
      createdAt: { bsonType: "date" },
      expiresAt: { bsonType: "date" },
    },
  },
};

// Creates the collection with its validator, or updates the validator if
// the collection already exists.
async function applyValidator(db: Db, name: string, validator: Document) {
  const exists = await db.listCollections({ name }, { nameOnly: true }).hasNext();
  if (exists) {
    await db.command({ collMod: name, validator, validationLevel: "strict" });
    return;
  }
  try {
    await db.createCollection(name, { validator });
  } catch (error) {
    // 48 = NamespaceExists: another request created it between the check and here.
    if ((error as { code?: number }).code !== 48) throw error;
  }
}

async function setUp(db: Db) {
  await Promise.all([
    applyValidator(db, "users", USER_VALIDATOR),
    applyValidator(db, "sessions", SESSION_VALIDATOR),
  ]);
  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("sessions").createIndex({ tokenHash: 1 }, { unique: true }),
    // TTL index: MongoDB deletes each session once its expiresAt passes.
    db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
}

declare global {
  var _authSetupPromise: Promise<void> | undefined;
}

// Validators and indexes are applied once per server process, on first use.
export async function getAuthCollections(): Promise<{
  users: Collection<UserDoc>;
  sessions: Collection<SessionDoc>;
}> {
  const db = await getDb();
  if (!global._authSetupPromise) {
    global._authSetupPromise = setUp(db).catch((error) => {
      global._authSetupPromise = undefined;
      throw error;
    });
  }
  await global._authSetupPromise;

  return {
    users: db.collection<UserDoc>("users"),
    sessions: db.collection<SessionDoc>("sessions"),
  };
}
