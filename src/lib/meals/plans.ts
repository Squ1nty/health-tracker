import "server-only";
import { ObjectId, type Collection, type Db, type Document } from "mongodb";
import { applyValidator, getDb } from "@/lib/mongodb";
import {
  EMPTY_MEAL_PLAN,
  MACROS,
  MAX_MACRO_VALUE,
  MAX_MEAL_ROWS,
  MEAL_NAME_MAX,
  type MealPlan,
} from "@/lib/meals/shared";

// One document per user, holding their whole meal plan. The table is small
// and always edited as a unit, so each save replaces the plan.
export type MealPlanDoc = MealPlan & {
  userId: ObjectId;
  updatedAt: Date;
};

const MACRO_VALUES_SCHEMA: Document = {
  bsonType: "object",
  required: MACROS.map((macro) => macro.key),
  additionalProperties: false,
  properties: Object.fromEntries(
    MACROS.map((macro) => [
      macro.key,
      { bsonType: ["number", "null"], minimum: 0, maximum: MAX_MACRO_VALUE },
    ])
  ),
};

const MEAL_PLAN_VALIDATOR: Document = {
  $jsonSchema: {
    bsonType: "object",
    required: ["userId", "targets", "rows", "updatedAt"],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "objectId" },
      userId: { bsonType: "objectId" },
      // Not required: plans saved before naming existed don't have one.
      name: { bsonType: "string", maxLength: MEAL_NAME_MAX },
      targets: MACRO_VALUES_SCHEMA,
      rows: {
        bsonType: "array",
        maxItems: MAX_MEAL_ROWS,
        items: {
          bsonType: "object",
          required: ["id", "kind", "name"],
          additionalProperties: false,
          properties: {
            id: { bsonType: "string", pattern: "^[a-z0-9]{1,40}$" },
            kind: { enum: ["header", "food"] },
            name: { bsonType: "string", maxLength: MEAL_NAME_MAX },
            // Only food rows have values.
            values: MACRO_VALUES_SCHEMA,
          },
        },
      },
      updatedAt: { bsonType: "date" },
    },
  },
};

async function setUp(db: Db) {
  await applyValidator(db, "mealPlans", MEAL_PLAN_VALIDATOR);
  // Unique: a user has one meal plan.
  await db.collection("mealPlans").createIndex({ userId: 1 }, { unique: true });
}

declare global {
  var _mealsSetup: { rules: string; promise: Promise<void> } | undefined;
}

const RULES = JSON.stringify(MEAL_PLAN_VALIDATOR);

// Validator and index are applied once per server process, on first use,
// and again if the validator changes: the dev server keeps this global
// across hot reloads, so an edited schema would otherwise never reach the
// database until a restart.
async function getMealPlans(): Promise<Collection<MealPlanDoc>> {
  const db = await getDb();
  if (global._mealsSetup?.rules !== RULES) {
    const promise = setUp(db).catch((error) => {
      if (global._mealsSetup?.promise === promise) global._mealsSetup = undefined;
      throw error;
    });
    global._mealsSetup = { rules: RULES, promise };
  }
  await global._mealsSetup.promise;
  return db.collection<MealPlanDoc>("mealPlans");
}

// The user's plan, or an empty one if they haven't started it.
export async function getMealPlan(userId: string): Promise<MealPlan> {
  const plans = await getMealPlans();
  const doc = await plans.findOne(
    { userId: new ObjectId(userId) },
    { projection: { _id: 0, name: 1, targets: 1, rows: 1 } }
  );
  return doc ? { name: doc.name ?? "", targets: doc.targets, rows: doc.rows } : EMPTY_MEAL_PLAN;
}

// Saves the plan, replacing whatever was there.
export async function setMealPlan(userId: string, plan: MealPlan) {
  const plans = await getMealPlans();
  await plans.updateOne(
    { userId: new ObjectId(userId) },
    { $set: { name: plan.name, targets: plan.targets, rows: plan.rows, updatedAt: new Date() } },
    { upsert: true }
  );
}
