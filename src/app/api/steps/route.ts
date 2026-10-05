import { revalidatePath } from "next/cache";
import { setDaySteps } from "@/lib/steps/logs";
import { isLoggableDate, parseSteps, MAX_DAY_STEPS, MAX_DAYS_BACK } from "@/lib/steps/shared";
import { findUserIdBySyncToken } from "@/lib/steps/tokens";

// Receives a day's step total from outside the browser, e.g. the iPhone
// Shortcut that reads Apple Health:
//
//   POST /api/steps
//   Authorization: Bearer <sync token from the Steps page>
//   { "date": "2026-10-05", "steps": 8432 }
//
// Sending the same day again replaces its total, so the Shortcut can run
// several times a day.
export async function POST(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = /^Bearer\s+(\S+)$/i.exec(header)?.[1];
  if (!token) {
    return error(401, "Missing sync token. Send it as: Authorization: Bearer <token>");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error(400, "The request body must be JSON.");
  }
  const { date, steps: rawSteps } = (body ?? {}) as { date?: unknown; steps?: unknown };

  try {
    const userId = await findUserIdBySyncToken(token);
    if (!userId) return error(401, "This sync token isn't valid. Create a new one on the Steps page.");

    if (typeof date !== "string" || !isLoggableDate(date)) {
      return error(
        400,
        `"date" must be a day in the last ${MAX_DAYS_BACK} days, formatted YYYY-MM-DD.`
      );
    }
    const steps = parseSteps(rawSteps);
    if (steps === null) {
      return error(400, `"steps" must be a number from 0 to ${MAX_DAY_STEPS}.`);
    }

    await setDaySteps(userId, date, steps, "shortcut");
    revalidatePath("/steps");
    return Response.json({ ok: true, date, steps });
  } catch (cause) {
    console.error("Step sync failed", cause);
    return error(500, "Something went wrong on our end. Please try again.");
  }
}

function error(status: number, message: string) {
  return Response.json({ ok: false, error: message }, { status });
}
