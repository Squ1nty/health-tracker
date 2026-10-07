import "server-only";
import { ObjectId, type Collection, type Db, type Document } from "mongodb";
import { applyValidator, getDb } from "@/lib/mongodb";
import { MEAL_PLAN_FIELDS_SCHEMA } from "@/lib/meals/plans";
import {
  MAX_SAVED_PLANS,
  copyName,
  planTotals,
  sameName,
  type MealPlan,
  type SavedPlanSummary,
} from "@/lib/meals/shared";

// One document per saved plan: a copy of the plan as it was when the user
// saved it. Editing the current plan afterwards doesn't change the copy
// until it's saved again. A user's saved plans each have their own name.
export type SavedMealPlanDoc = MealPlan & {
  userId: ObjectId;
  // Where the plan sits in the user's list, lowest first.
  position: number;
  savedAt: Date;
};

const SAVED_PLAN_VALIDATOR: Document = {
  $jsonSchema: {
    bsonType: "object",
    required: ["userId", "name", "targets", "rows", "position", "savedAt"],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "objectId" },
      userId: { bsonType: "objectId" },
      ...MEAL_PLAN_FIELDS_SCHEMA,
      position: { bsonType: "int", minimum: 0 },
      savedAt: { bsonType: "date" },
    },
  },
};

async function setUp(db: Db) {
  await applyValidator(db, "savedMealPlans", SAVED_PLAN_VALIDATOR);
  await db.collection("savedMealPlans").createIndex({ userId: 1, position: 1 });
}

declare global {
  var _savedMealsSetup: { rules: string; promise: Promise<void> } | undefined;
}

const RULES = JSON.stringify(SAVED_PLAN_VALIDATOR);

// Validator and index are applied once per server process, on first use,
// and again if the validator changes (see plans.ts).
async function getSavedPlans(): Promise<Collection<SavedMealPlanDoc>> {
  const db = await getDb();
  if (global._savedMealsSetup?.rules !== RULES) {
    const promise = setUp(db).catch((error) => {
      if (global._savedMealsSetup?.promise === promise) global._savedMealsSetup = undefined;
      throw error;
    });
    global._savedMealsSetup = { rules: RULES, promise };
  }
  await global._savedMealsSetup.promise;
  return db.collection<SavedMealPlanDoc>("savedMealPlans");
}

// The user's saved plans in list order.
export async function listSavedPlans(userId: string): Promise<SavedPlanSummary[]> {
  const plans = await getSavedPlans();
  const docs = await plans
    .find({ userId: new ObjectId(userId) }, { projection: { name: 1, rows: 1 } })
    .sort({ position: 1, savedAt: 1 })
    .toArray();
  return docs.map((doc) => ({
    id: doc._id.toString(),
    name: doc.name,
    totals: planTotals(doc.rows),
  }));
}

export async function countSavedPlans(userId: string) {
  const plans = await getSavedPlans();
  return plans.countDocuments({ userId: new ObjectId(userId) });
}

// Saves the plan under its name. A name the user hasn't used is added to
// the end of their list; a name they have used updates that saved plan in
// place, so saving never makes a second copy. Returns what happened:
// "unchanged" if the saved plan already matches, "full" if there's no
// room for another.
export async function keepPlan(userId: string, plan: MealPlan) {
  const plans = await getSavedPlans();
  const owner = new ObjectId(userId);
  const saved = await plans.find({ userId: owner }).sort({ position: 1 }).toArray();

  const existing = saved.find((other) => sameName(other.name, plan.name));
  if (existing) {
    const before = JSON.stringify([existing.name, existing.targets, existing.rows]);
    if (before === JSON.stringify([plan.name, plan.targets, plan.rows])) return "unchanged";
    await plans.updateOne(
      { _id: existing._id, userId: owner },
      { $set: { name: plan.name, targets: plan.targets, rows: plan.rows, savedAt: new Date() } }
    );
    return "updated";
  }

  if (saved.length >= MAX_SAVED_PLANS) return "full";
  const last = saved.at(-1);
  await plans.insertOne({
    userId: owner,
    name: plan.name,
    targets: plan.targets,
    rows: plan.rows,
    position: last ? last.position + 1 : 0,
    savedAt: new Date(),
  });
  return "added";
}

// Adds a copy of a saved plan straight after it, named with a number (see
// copyName). Returns the copy, "full" if there's no room, or null if the
// plan isn't the user's.
export async function duplicateSavedPlan(
  userId: string,
  id: string
): Promise<SavedPlanSummary | "full" | null> {
  const plans = await getSavedPlans();
  const owner = new ObjectId(userId);
  const saved = await plans.find({ userId: owner }).toArray();

  const original = saved.find((other) => other._id.toString() === id);
  if (!original) return null;
  if (saved.length >= MAX_SAVED_PLANS) return "full";

  const name = copyName(
    original.name,
    saved.map((other) => other.name)
  );
  // Make room for the copy by moving everything below the original down one.
  await plans.updateMany(
    { userId: owner, position: { $gt: original.position } },
    { $inc: { position: 1 } }
  );
  const { insertedId } = await plans.insertOne({
    userId: owner,
    name,
    targets: original.targets,
    rows: original.rows,
    position: original.position + 1,
    savedAt: new Date(),
  });
  return { id: insertedId.toString(), name, totals: planTotals(original.rows) };
}

export async function deleteSavedPlan(userId: string, id: string) {
  const plans = await getSavedPlans();
  await plans.deleteOne({ _id: new ObjectId(id), userId: new ObjectId(userId) });
}

// Puts the user's plans in the given order. Ids that aren't theirs match
// nothing, so they're ignored.
export async function reorderSavedPlans(userId: string, ids: string[]) {
  if (ids.length === 0) return;
  const plans = await getSavedPlans();
  const owner = new ObjectId(userId);
  await plans.bulkWrite(
    ids.map((id, position) => ({
      updateOne: {
        filter: { _id: new ObjectId(id), userId: owner },
        update: { $set: { position } },
      },
    }))
  );
}
