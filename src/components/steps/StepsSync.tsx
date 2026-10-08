"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { createStepSyncToken, revokeStepSyncToken } from "@/app/actions/steps";

const noopSubscribe = () => () => {};

// This site's address as the phone will need to type it, read only in the
// browser (the server render uses a placeholder).
function useOrigin() {
  return useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => ""
  );
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const secondaryButton =
  "flex h-9 cursor-pointer items-center justify-center rounded-md border border-line px-3 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40";

export default function StepsSync({
  tokenInfo,
}: {
  // When the user's sync token was created and last used (ISO strings), or
  // null if they don't have one. The token itself is never sent back here.
  tokenInfo: { createdAt: string; lastUsedAt: string | null } | null;
}) {
  const origin = useOrigin();
  // Held only in memory, right after creation; gone on reload.
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const endpoint = `${origin || "https://your-site"}/api/steps`;
  const isLocalhost = /\/\/(localhost|127\.0\.0\.1)/.test(origin);

  const create = () => {
    if (
      tokenInfo &&
      !window.confirm(
        "Replace your sync token? The current one stops working, so the Shortcut will need the new one."
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const result = await createStepSyncToken();
        if (result.ok) {
          setNewToken(result.token);
          setCopied(false);
        } else {
          setError(result.error);
        }
      } catch {
        setError("Couldn't reach the server. Check your connection and try again.");
      }
    });
  };

  const revoke = () => {
    if (!window.confirm("Turn off iPhone sync? The Shortcut will stop being able to send steps.")) {
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const result = await revokeStepSyncToken();
        if (result.ok) setNewToken(null);
        else setError(result.error);
      } catch {
        setError("Couldn't reach the server. Check your connection and try again.");
      }
    });
  };

  const copy = async () => {
    if (!newToken) return;
    try {
      await navigator.clipboard.writeText(newToken);
      setCopied(true);
    } catch {
      setError("Couldn't copy automatically. Select the token and copy it by hand.");
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Sync from iPhone</h2>
        <p className="mt-1 text-xs text-muted">
          An iPhone Shortcut can read your steps from Apple Health and send them here
          automatically. It signs in with a sync token instead of your password.
        </p>
      </div>

      <p className="text-xs text-muted" suppressHydrationWarning>
        {tokenInfo
          ? `Sync is on. Token created ${formatWhen(tokenInfo.createdAt)}. ${
              tokenInfo.lastUsedAt
                ? `Last synced ${formatWhen(tokenInfo.lastUsedAt)}.`
                : "Nothing synced yet."
            }`
          : "Sync is off. Create a token to set it up."}
      </p>

      {newToken && (
        <div className="flex flex-col gap-2 rounded-md border border-accent/40 bg-accent/10 p-3">
          <p className="text-xs text-foreground">
            Your sync token. Copy it now: it won&apos;t be shown again.
          </p>
          <code className="select-all break-all rounded bg-background px-2 py-1.5 text-xs text-foreground">
            {newToken}
          </code>
          <button type="button" onClick={copy} className={`${secondaryButton} self-start`}>
            {copied ? "Copied" : "Copy token"}
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={create} disabled={pending} className={secondaryButton}>
          {pending ? "Working…" : tokenInfo ? "Replace token" : "Create sync token"}
        </button>
        {tokenInfo && (
          <button type="button" onClick={revoke} disabled={pending} className={secondaryButton}>
            Turn off sync
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}

      <details className="text-xs text-muted">
        <summary className="cursor-pointer select-none text-sm text-foreground">
          How to set up the Shortcut
        </summary>
        {isLocalhost && (
          <p className="mt-3 rounded-md border border-danger/40 bg-danger/10 p-2 text-danger">
            You&apos;re viewing this on localhost, which your phone can&apos;t reach. In the
            Shortcut, use this computer&apos;s network address instead (e.g.
            http://192.168.x.x:3000) while on the same Wi-Fi, or the site&apos;s real
            address once it&apos;s deployed.
          </p>
        )}
        <ol className="mt-3 flex list-decimal flex-col gap-2 pl-4">
          <li>
            Open the <b>Shortcuts</b> app on your iPhone, tap <b>+</b> and name the shortcut
            (e.g. &quot;Sync steps&quot;).
          </li>
          <li>
            Add <b>Find Health Samples</b>. Set Type to <b>Steps</b> and add the filter{" "}
            <b>Start Date is today</b>.
          </li>
          <li>
            Add <b>Calculate Statistics</b> and set it to <b>Sum</b> of the Health Samples.
          </li>
          <li>
            Add <b>Format Date</b> for the <b>Current Date</b>, with Date Format{" "}
            <b>Custom</b>: <code className="text-foreground">yyyy-MM-dd</code>
          </li>
          <li>
            Add <b>Get Contents of URL</b> with URL{" "}
            <code className="break-all text-foreground">{endpoint}</code>, then under Show
            More:
            <ul className="mt-1 flex list-disc flex-col gap-1 pl-4">
              <li>
                Method: <b>POST</b>
              </li>
              <li>
                Headers: <code className="text-foreground">Authorization</code> ={" "}
                <code className="text-foreground">Bearer YOUR_TOKEN</code>
              </li>
              <li>
                Request Body: <b>JSON</b>, with <code className="text-foreground">date</code>{" "}
                (Text) = Formatted Date and <code className="text-foreground">steps</code>{" "}
                (Number) = Statistics
              </li>
            </ul>
          </li>
          <li>Run it once. Allow access to Health when asked, then check this page.</li>
          <li>
            To make it automatic: Shortcuts → <b>Automation</b> → <b>+</b> →{" "}
            <b>Time of Day</b> (e.g. 11:50 PM, daily, Run Immediately) → run this shortcut.
          </li>
        </ol>
      </details>
    </div>
  );
}
