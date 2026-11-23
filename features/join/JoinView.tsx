"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Oscar } from "@/components/oscar/Oscar";
import { Button } from "@/components/ui/Button";
import { extractKey } from "@/lib/key";
import { getGardenKey, getMeta } from "@/lib/data/garden";
import { checkKey, joinGarden } from "@/lib/sync/api";

type State =
  | { kind: "checking" }
  | { kind: "confirm"; key: string; name: string | null; replaces: boolean }
  | { kind: "joining" }
  | { kind: "bad"; message: string };

/** /join#k=<key>: the key never reaches the server in the URL (brief 12.1). */
export function JoinView() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "checking" });

  useEffect(() => {
    const key = extractKey(window.location.hash);
    // Take the key out of the address bar and history straight away.
    history.replaceState(null, "", "/join");
    (async () => {
      if (!key) return setState({ kind: "bad", message: "That link is missing its garden key. Check you copied all of it." });
      const current = await getGardenKey();
      if (current === key) return router.replace("/");
      const res = await checkKey(key).catch(() => null);
      if (!res) return setState({ kind: "bad", message: "You seem to be offline. Connect and open the link again." });
      if (res.syncOff) return setState({ kind: "bad", message: "Sync is off on this site, so gardens can't be opened on other devices yet." });
      if (!res.ok) return setState({ kind: "bad", message: "That garden link doesn't work any more. If you made a new link, use that one." });
      const rekey = await getMeta<boolean>("needsRekey");
      setState({ kind: "confirm", key, name: res.name, replaces: !!current && !rekey });
    })();
  }, [router]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-[radial-gradient(120%_80%_at_50%_0%,#FFF7EC_0%,var(--background)_60%)] px-6 text-center">
      <Oscar size={130} pose={state.kind === "bad" ? "thinking" : "wave"} />
      <h1 className="font-display text-[44px] font-semibold leading-tight">Your garden link</h1>
      {state.kind === "checking" && <p className="text-lg font-semibold text-ink-muted">Checking it…</p>}
      {state.kind === "joining" && <p className="text-lg font-semibold text-ink-muted">Bringing your garden over…</p>}
      {state.kind === "bad" && (
        <>
          <h2 className="text-lg font-semibold">Hmm, that didn&apos;t work</h2>
          <p className="max-w-xs text-[15px] text-ink-muted">{state.message}</p>
          <Button onClick={() => router.replace("/")}>Go to AuraGarden</Button>
        </>
      )}
      {state.kind === "confirm" && (
        <>
          <h2 className="max-w-md text-xl font-semibold leading-snug">Open {state.name ? `${state.name}'s` : "this"} garden on this device?</h2>
          {state.replaces && <p className="max-w-sm rounded-2xl bg-gentle/60 px-4 py-3 text-[15px] text-gentle-ink">This device already has a garden. Opening this one replaces it here (the other garden is still safe under its own link).</p>}
          <div className="flex w-full max-w-xs flex-col gap-2">
            <Button
              size="lg"
              onClick={async () => {
                setState({ kind: "joining" });
                await joinGarden(state.key);
                router.replace("/");
              }}
            >
              Open garden
            </Button>
            <Button variant="ghost" onClick={() => router.replace("/")}>
              Not now
            </Button>
          </div>
        </>
      )}
    </main>
  );
}
