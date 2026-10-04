import "server-only";
import { ObjectId, type Collection, type Db, type Document } from "mongodb";
import { applyValidator, getDb } from "@/lib/mongodb";
import { MAX_ENTRY_ML } from "@/lib/water/shared";

// One document per logged entry. A day's total is the sum of its entries,
// so nothing is overwritten and a removal is just a negative entry.
export type WaterLogDoc = {
  userId: ObjectId;
  // The user's local calendar day, YYYY-MM-DD.
  date: string;
  // Whole millilitres; negative when taking back a mislogged amount.
  ml: number;
  createdAt: Date;
};

const WATER_LOG_VALIDATOR: Document = {
  $jsonSchema: {
    bsonType: "object",
    required: ["userId", "date", "ml", "createdAt"],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "objectId" },
      userId: { bsonType: "objectId" },
      date: { bsonType: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
      ml: { bsonType: "int", minimum: -MAX_ENTRY_ML, maximum: MAX_ENTRY_ML },
      createdAt: { bsonType: "date" },
    },
  },
};

async function setUp(db: Db) {
  await applyValidator(db, "waterLogs", WATER_LOG_VALIDATOR);
  // Every query is "this user's entries", usually narrowed to one day.
  await db.collection("waterLogs").createIndex({ userId: 1, date: 1 });
}

declare global {
  var _waterSetupPromise: Promise<void> | undefined;
}

// Validator and index are applied once per server process, on first use.
async function getWaterLogs(): Promise<Collection<WaterLogDoc>> {
  const db = await getDb();
  if (!global._waterSetupPromise) {
    global._waterSetupPromise = setUp(db).catch((error) => {
      global._waterSetupPromise = undefined;
      throw error;
    });
  }
  await global._waterSetupPromise;
  return db.collection<WaterLogDoc>("waterLogs");
}

// Total ml per day for one user, keyed by YYYY-MM-DD. Days netting to zero
// are left out.
export async function getWaterTotals(userId: string): Promise<Record<string, number>> {
  const logs = await getWaterLogs();
  const rows = await logs
    .aggregate<{ _id: string; ml: number }>([
      { $match: { userId: new ObjectId(userId) } },
      { $group: { _id: "$date", ml: { $sum: "$ml" } } },
    ])
    .toArray();

  const totals: Record<string, number> = {};
  for (const row of rows) {
    if (row.ml > 0) totals[row._id] = row.ml;
  }
  return totals;
}

export async function getDayTotal(userId: string, date: string) {
  const logs = await getWaterLogs();
  const [row] = await logs
    .aggregate<{ ml: number }>([
      { $match: { userId: new ObjectId(userId), date } },
      { $group: { _id: null, ml: { $sum: "$ml" } } },
    ])
    .toArray();
  return row?.ml ?? 0;
}

export async function addWaterLog(userId: string, date: string, ml: number) {
  const logs = await getWaterLogs();
  await logs.insertOne({
    userId: new ObjectId(userId),
    date,
    ml,
    createdAt: new Date(),
  });
}
