"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getGift } from "@/config/gifts";
import { createGarden } from "@/lib/data/garden";
import { useGardenStatus } from "@/lib/hooks";
import { Button } from "@/components/ui/Button";
import { Oscar } from "@/components/oscar/Oscar";

/** Phase 1 stand-in for the unwrap: starts the gift garden. */
export function LauraGift({ slug }: { slug: string }) {
  const gift = getGift(slug)!;
  const status = useGardenStatus();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
      <Oscar size={140} pose="wave" />
      <h1 className="font-display text-4xl font-semibold">Hey {gift.recipient},</h1>
      <p className="font-hand text-2xl">{gift.tagLine}</p>
      {status === "ready" ? (
        <Button size="lg" onClick={() => router.push("/")}>Open my garden</Button>
      ) : (
        <Button
          size="lg"
          disabled={busy || status === "loading"}
          onClick={async () => {
            setBusy(true);
            await createGarden({ name: gift.recipient, giftSlug: gift.slug });
            router.push("/");
          }}
        >
          Start my garden
        </Button>
      )}
    </main>
  );
}
