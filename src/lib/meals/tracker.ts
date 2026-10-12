import "server-only";
import { ObjectId, type Collection, type Db, type Document } from "mongodb";
import { applyValidator, getDb } from "@/lib/mongodb";
import { MAX_EATEN_ITEMS } from "@/lib/meals/shared";
import { daysFromUtcToday } from "@/lib/steps/shared";

// One document per user per day, holding the food items ticked off as
// eaten that day.
export type MealLogDoc = {
  userId: ObjectId;
  // The user's local calendar day, YYYY-MM-DD.
  date: string;
  // Row ids of the eaten foods, from the plan that was active at the time.
  eaten: string[];
  updatedAt: Date;
};

const MEAL_LOG_VALIDATOR: Document = {
  $jsonSchema: {
    bsonType: "object",
    required: ["userId", "date", "eaten", "updatedAt"],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "objectId" },
      userId: { bsonType: "objectId" },
      date: { bsonType: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
      eaten: {
        bsonType: "array",
        maxItems: MAX_EATEN_ITEMS,
        uniqueItems: true,
        items: { bsonType: "string", pattern: "^[a-z0-9]{1,40}$" },
      },
      updatedAt: { bsonType: "date" },
    },
  },
};

async function setUp(db: Db) {
  await applyValidator(db, "mealLogs", MEAL_LOG_VALIDATOR);
  // Unique: a user has one list of eaten items per day.
  await db.collection("mealLogs").createIndex({ userId: 1, date: 1 }, { unique: true });
}

declare global {
  var _mealLogsSetup: { rules: string; promise: Promise<void> } | undefined;
}

const RULES = JSON.stringify(MEAL_LOG_VALIDATOR);

// Validator and index are applied once per server process, on first use,
// and again if the validator changes (see plans.ts).
async function getMealLogs(): Promise<Collection<MealLogDoc>> {
  const db = await getDb();
  if (global._mealLogsSetup?.rules !== RULES) {
    const promise = setUp(db).catch((error) => {
      if (global._mealLogsSetup?.promise === promise) global._mealLogsSetup = undefined;
      throw error;
    });
    global._mealLogsSetup = { rules: RULES, promise };
  }
  await global._mealLogsSetup.promise;
  return db.collection<MealLogDoc>("mealLogs");
}

// Dates are the user's local calendar day, which can be one day ahead of
// or behind the server's UTC date. Only today can be ticked, so a date is
// accepted if it's within a day of the server's.
export function isTrackableDate(date: string) {
  const offset = daysFromUtcToday(date);
  return offset !== null && Math.abs(offset) <= 1;
}

export type MealLog = {
  // How many items were eaten on each logged day, keyed by YYYY-MM-DD.
  itemsByDate: Record<string, number>;
  // The eaten row ids for the days that could be the user's today.
  recentEaten: Record<string, string[]>;
};

export async function getMealLog(userId: string): Promise<MealLog> {
  const logs = await getMealLogs();
  const docs = await logs
    .find({ userId: new ObjectId(userId) }, { projection: { date: 1, eaten: 1 } })
    .toArray();

  const log: MealLog = { itemsByDate: {}, recentEaten: {} };
  for (const doc of docs) {
    log.itemsByDate[doc.date] = doc.eaten.length;
    if (isTrackableDate(doc.date)) log.recentEaten[doc.date] = doc.eaten;
  }
  return log;
}

// Ticks or unticks one food item for the day.
export async function setItemEaten(userId: string, date: string, rowId: string, eaten: boolean) {
  const logs = await getMealLogs();
  const filter = { userId: new ObjectId(userId), date };
  if (eaten) {
    await logs.updateOne(
      filter,
      { $addToSet: { eaten: rowId }, $set: { updatedAt: new Date() } },
      { upsert: true }
    );
  } else {
    await logs.updateOne(filter, { $pull: { eaten: rowId }, $set: { updatedAt: new Date() } });
  }
}
