import { useSyncExternalStore } from "react";
import { dateKey } from "@/lib/water/shared";

const noopSubscribe = () => () => {};

// Today's date key in the visitor's own timezone, read only in the browser.
// The server doesn't know the visitor's timezone, so its snapshot is null
// and the real date fills in on hydration.
export function useTodayKey() {
  return useSyncExternalStore(
    noopSubscribe,
    () => dateKey(new Date()),
    () => null
  );
}
