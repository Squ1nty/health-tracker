import "server-only";
import { ObjectId, type Collection, type Db, type Document } from "mongodb";
import { applyValidator, getDb } from "@/lib/mongodb";
import {
  DEFAULT_QUICK_ADDS,
  QUICK_ADD_MAX,
  type QuickAddKind,
  type QuickAdds,
} from "@/lib/quickAdd/shared";

// One document per user, holding their own quick add amounts for each
// tracker. A tracker that's missing still uses the defaults.
export type QuickAddDoc = {
  userId: ObjectId;
  water?: QuickAdds;
  steps?: QuickAdds;
  updatedAt: Date;
};

const AMOUNTS: Document = {
  bsonType: "array",
  minItems: 4,
  maxItems: 4,
  items: { bsonType: "int", minimum: 1, maximum: QUICK_ADD_MAX },
};

const QUICK_ADD_VALIDATOR: Document = {
  $jsonSchema: {
    bsonType: "object",
    required: ["userId", "updatedAt"],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "objectId" },
      userId: { bsonType: "objectId" },
      water: AMOUNTS,
      steps: AMOUNTS,
      updatedAt: { bsonType: "date" },
    },
  },
};

async function setUp(db: Db) {
  await applyValidator(db, "quickAdds", QUICK_ADD_VALIDATOR);
  // Unique: a user has one set of quick add amounts.
  await db.collection("quickAdds").createIndex({ userId: 1 }, { unique: true });
}

declare global {
  var _quickAddsSetup: { rules: string; promise: Promise<void> } | undefined;
}

const RULES = JSON.stringify(QUICK_ADD_VALIDATOR);

// Validator and index are applied once per server process, on first use,
// and again if the validator changes (see meals/plans.ts).
async function getQuickAddDocs(): Promise<Collection<QuickAddDoc>> {
  const db = await getDb();
  if (global._quickAddsSetup?.rules !== RULES) {
    const promise = setUp(db).catch((error) => {
      if (global._quickAddsSetup?.promise === promise) global._quickAddsSetup = undefined;
      throw error;
    });
    global._quickAddsSetup = { rules: RULES, promise };
  }
  await global._quickAddsSetup.promise;
  return db.collection<QuickAddDoc>("quickAdds");
}

export async function getQuickAdds(userId: string, kind: QuickAddKind): Promise<QuickAdds> {
  const docs = await getQuickAddDocs();
  const doc = await docs.findOne(
    { userId: new ObjectId(userId) },
    { projection: { [kind]: 1 } }
  );
  return doc?.[kind] ?? DEFAULT_QUICK_ADDS[kind];
}

export async function setQuickAdds(userId: string, kind: QuickAddKind, amounts: QuickAdds) {
  const docs = await getQuickAddDocs();
  await docs.updateOne(
    { userId: new ObjectId(userId) },
    { $set: { [kind]: amounts, updatedAt: new Date() } },
    { upsert: true }
  );
}
