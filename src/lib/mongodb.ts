import "server-only";
import { MongoClient, type Db, type Document } from "mongodb";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// Connects lazily on first use rather than at import time, so builds and
// pages that never touch the database don't need it to be running. The
// promise lives on globalThis so dev hot reloads reuse one connection pool.
function getClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable");
  }

  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
    })
      .connect()
      .catch((error) => {
        // Don't cache a failed connection, so the next request retries.
        global._mongoClientPromise = undefined;
        throw error;
      });
  }
  return global._mongoClientPromise;
}

// The database name comes from the path of MONGODB_URI.
export async function getDb(): Promise<Db> {
  return (await getClient()).db();
}

// Creates the collection with its validator (database-level schema rules),
// or updates the validator if the collection already exists.
export async function applyValidator(db: Db, name: string, validator: Document) {
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
