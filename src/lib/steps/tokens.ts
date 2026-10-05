import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { ObjectId, type Collection, type Db, type Document } from "mongodb";
import { applyValidator, getDb } from "@/lib/mongodb";

// A sync token lets something that can't log in with a password (the
// iPhone Shortcut) send steps for one account. Each user has at most one.
export type SyncTokenDoc = {
  userId: ObjectId;
  // SHA-256 of the token; the token itself is only ever shown once, at creation.
  tokenHash: string;
  createdAt: Date;
  lastUsedAt: Date | null;
};

export type SyncTokenInfo = { createdAt: Date; lastUsedAt: Date | null };

const TOKEN_PREFIX = "ht_";

const SYNC_TOKEN_VALIDATOR: Document = {
  $jsonSchema: {
    bsonType: "object",
    required: ["userId", "tokenHash", "createdAt", "lastUsedAt"],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "objectId" },
      userId: { bsonType: "objectId" },
      tokenHash: { bsonType: "string", minLength: 64, maxLength: 64 },
      createdAt: { bsonType: "date" },
      lastUsedAt: { bsonType: ["date", "null"] },
    },
  },
};

async function setUp(db: Db) {
  await applyValidator(db, "syncTokens", SYNC_TOKEN_VALIDATOR);
  await Promise.all([
    db.collection("syncTokens").createIndex({ userId: 1 }, { unique: true }),
    db.collection("syncTokens").createIndex({ tokenHash: 1 }, { unique: true }),
  ]);
}

declare global {
  var _syncTokenSetupPromise: Promise<void> | undefined;
}

async function getSyncTokens(): Promise<Collection<SyncTokenDoc>> {
  const db = await getDb();
  if (!global._syncTokenSetupPromise) {
    global._syncTokenSetupPromise = setUp(db).catch((error) => {
      global._syncTokenSetupPromise = undefined;
      throw error;
    });
  }
  await global._syncTokenSetupPromise;
  return db.collection<SyncTokenDoc>("syncTokens");
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// Creates the user's token, replacing (and so invalidating) any existing
// one. Returns the raw token, which can't be recovered afterwards.
export async function createSyncToken(userId: string) {
  const tokens = await getSyncTokens();
  const token = TOKEN_PREFIX + randomBytes(32).toString("base64url");

  await tokens.updateOne(
    { userId: new ObjectId(userId) },
    { $set: { tokenHash: hashToken(token), createdAt: new Date(), lastUsedAt: null } },
    { upsert: true }
  );
  return token;
}

export async function revokeSyncToken(userId: string) {
  const tokens = await getSyncTokens();
  await tokens.deleteOne({ userId: new ObjectId(userId) });
}

export async function getSyncTokenInfo(userId: string): Promise<SyncTokenInfo | null> {
  const tokens = await getSyncTokens();
  const doc = await tokens.findOne({ userId: new ObjectId(userId) });
  return doc && { createdAt: doc.createdAt, lastUsedAt: doc.lastUsedAt };
}

// Resolves a presented token to its user and records the use. Returns null
// for anything that isn't a current token.
export async function findUserIdBySyncToken(token: string) {
  if (!token.startsWith(TOKEN_PREFIX)) return null;
  const tokens = await getSyncTokens();
  const doc = await tokens.findOneAndUpdate(
    { tokenHash: hashToken(token) },
    { $set: { lastUsedAt: new Date() } }
  );
  return doc ? doc.userId.toHexString() : null;
}
