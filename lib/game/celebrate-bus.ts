"use client";

export type CelebrationEvent =
  | { kind: "award"; base: number; multiplier: number; amount: number; origin?: { x: number; y: number }; line: string; small?: boolean }
  | { kind: "combo"; amount: number; line: string }
  | { kind: "goal"; amount: number; line: string }
  | { kind: "deck"; amount: number; line: string }
  | { kind: "levelup"; from: number; to: number; title: string; line: string }
  | { kind: "unlock"; itemId: string; name: string; line: string }
  | { kind: "realm"; realm: number; name: string; boostFrom: number; boostTo: number; line: string }
  | { kind: "achievement"; achievementId: string; name: string; tier: string; bonus: number; line: string }
  | { kind: "rank"; projectId: string; projectName: string; rank: string; color: string; belt: boolean; line: string };

export type Stamped = CelebrationEvent & { seq: number; at: number };

type Listener = (e: Stamped) => void;
const listeners = new Set<Listener>();
const backlog: Stamped[] = [];
let seq = 1;

/** Hand a moment to the celebration layer. Safe to call outside React. */
export function celebrate(e: CelebrationEvent) {
  if (typeof window === "undefined") return;
  const stamped = { ...e, seq: seq++, at: Date.now() } as Stamped;
  if (!listeners.size) {
    backlog.push(stamped);
    return;
  }
  for (const l of listeners) l(stamped);
}

export function subscribeCelebrations(l: Listener) {
  listeners.add(l);
  while (backlog.length) l(backlog.shift()!);
  return () => {
    listeners.delete(l);
  };
}
