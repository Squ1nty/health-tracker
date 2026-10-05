import "server-only";
import { ObjectId, type Collection, type Db, type Document } from "mongodb";
import { applyValidator, getDb } from "@/lib/mongodb";
import { MAX_DAY_STEPS, type StepDay, type StepSource } from "@/lib/steps/shared";

// One document per user per day, holding that day's total. Unlike water
// (many small entries added up), a step count is already a running total,
// so each save replaces the day's number.
export type StepLogDoc = {
  userId: ObjectId;
  // The user's local calendar day, YYYY-MM-DD.
  date: string;
  steps: number;
  source: StepSource;
  updatedAt: Date;
};

const STEP_LOG_VALIDATOR: Document = {
  $jsonSchema: {
    bsonType: "object",
    required: ["userId", "date", "steps", "source", "updatedAt"],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "objectId" },
      userId: { bsonType: "objectId" },
      date: { bsonType: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
      steps: { bsonType: "int", minimum: 0, maximum: MAX_DAY_STEPS },
      source: { enum: ["manual", "shortcut"] },
      updatedAt: { bsonType: "date" },
    },
  },
};

async function setUp(db: Db) {
  await applyValidator(db, "stepLogs", STEP_LOG_VALIDATOR);
  // Unique: a user can only have one total per day.
  await db.collection("stepLogs").createIndex({ userId: 1, date: 1 }, { unique: true });
}

declare global {
  var _stepsSetupPromise: Promise<void> | undefined;
}

// Validator and index are applied once per server process, on first use.
async function getStepLogs(): Promise<Collection<StepLogDoc>> {
  const db = await getDb();
  if (!global._stepsSetupPromise) {
    global._stepsSetupPromise = setUp(db).catch((error) => {
      global._stepsSetupPromise = undefined;
      throw error;
    });
  }
  await global._stepsSetupPromise;
  return db.collection<StepLogDoc>("stepLogs");
}

// Every logged day for one user, keyed by YYYY-MM-DD.
export async function getStepsByDate(userId: string): Promise<Record<string, StepDay>> {
  const logs = await getStepLogs();
  const rows = await logs
    .find({ userId: new ObjectId(userId) }, { projection: { date: 1, steps: 1, source: 1 } })
    .toArray();

  const byDate: Record<string, StepDay> = {};
  for (const row of rows) {
    byDate[row.date] = { steps: row.steps, source: row.source };
  }
  return byDate;
}

// Sets the day's total, replacing whatever was there.
export async function setDaySteps(
  userId: string,
  date: string,
  steps: number,
  source: StepSource
) {
  const logs = await getStepLogs();
  await logs.updateOne(
    { userId: new ObjectId(userId), date },
    { $set: { steps, source, updatedAt: new Date() } },
    { upsert: true }
  );
}
