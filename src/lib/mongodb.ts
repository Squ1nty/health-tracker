import "server-only";
import { MongoClient, type Db } from "mongodb";

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
