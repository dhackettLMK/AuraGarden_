"use client";

import { MomentCard } from "./MomentCard";
import type { Stamped } from "@/lib/game/celebrate-bus";

/** The new-realm sequence. Phase 4 replaces this with the full-screen reveal. */
export function RealmSequence({ event, onClose }: { event: Stamped; onClose: () => void }) {
  void event;
  return <MomentCard event={null} onClose={onClose} />;
}
