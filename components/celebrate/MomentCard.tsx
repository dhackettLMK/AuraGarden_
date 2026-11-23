"use client";

import { Dialog } from "radix-ui";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { Oscar } from "@/components/oscar/Oscar";
import { Button } from "@/components/ui/Button";
import { AuraOrb } from "@/components/icons/AuraOrb";
import { BeltIcon } from "@/components/icons/BeltIcon";
import type { Stamped } from "@/lib/game/celebrate-bus";
import { useGame } from "@/lib/game/GameProvider";
import { useSettings } from "@/lib/hooks";
import { formatAura } from "@/lib/format";
import { TIER_COLORS } from "@/config/tiers";
import { ItemThumb } from "@/components/garden/ItemThumb";

/**
 * Bigger moments (brief 7.5): the screen dims softly and a card appears.
 * Unlocks offer "See it" (opens the garden with the item spotlit) and "Later".
 */
export function MomentCard({ event, onClose }: { event: Stamped | null; onClose: () => void }) {
  const router = useRouter();
  const game = useGame();
  const settings = useSettings();
  const open = !!event && event.kind !== "realm";
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay fixed inset-0 z-[85] bg-[#1c1712]/45 backdrop-blur-[3px]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-[86] w-[calc(100%-40px)] max-w-sm -translate-x-1/2 -translate-y-1/2 outline-none"
        >
          {event && (
            <motion.div
              key={event.seq}
              initial={{ opacity: 0, rotateY: event.kind === "achievement" ? 90 : 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, rotateY: 0, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              style={{ transformPerspective: 900 }}
              className="relative overflow-hidden rounded-[28px] bg-surface p-6 pt-8 text-center shadow-[var(--shadow-lift)]"
            >
              <div className="absolute inset-x-0 top-0 h-40 opacity-60 aura-bg [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden="true" />
              <div className="relative">
                {event.kind === "levelup" && (
                  <>
                    <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full aura-animated shadow-[var(--shadow-glow)]">
                      <span className="font-display text-[44px] font-bold text-[#3a2340] tabular">{event.to}</span>
                    </div>
                    <Dialog.Title className="mt-4 font-display text-[28px] font-semibold">
                      {event.to - event.from > 1 ? `+${event.to - event.from} levels!` : "Level up!"}
                    </Dialog.Title>
                    <p className="mt-1 text-[17px] font-semibold text-ink-muted">
                      Level {event.to} · {event.title}
                    </p>
                  </>
                )}
                {event.kind === "unlock" && (
                  <>
                    <p className="text-sm font-bold uppercase tracking-[0.12em] text-ink-muted">New in your garden</p>
                    <div className="mx-auto mt-3 flex h-32 w-32 items-center justify-center rounded-[28px] bg-primary-soft">
                      <ItemThumb id={event.itemId} size={104} />
                    </div>
                    <Dialog.Title className="mt-4 font-display text-[26px] font-semibold leading-tight">{event.name}</Dialog.Title>
                  </>
                )}
                {event.kind === "achievement" && (
                  <>
                    <p className="text-sm font-bold uppercase tracking-[0.12em] text-ink-muted">New trophy</p>
                    <div className="mx-auto mt-3 flex h-28 w-28 items-center justify-center rounded-full shadow-[var(--shadow-lift)]" style={{ background: TIER_COLORS[event.tier as keyof typeof TIER_COLORS] ?? "#E7B53C" }}>
                      <AuraOrb size={56} />
                    </div>
                    <Dialog.Title className="mt-4 font-display text-[24px] font-semibold leading-tight">{event.name}</Dialog.Title>
                    <p className="mt-1 font-semibold capitalize text-ink-muted">
                      {event.tier} · <span className="aura-text">+{formatAura(event.bonus)} aura</span>
                    </p>
                  </>
                )}
                {event.kind === "rank" && (
                  <>
                    <p className="text-sm font-bold uppercase tracking-[0.12em] text-ink-muted">{event.projectName}</p>
                    <div className="mx-auto mt-3 flex h-28 w-28 items-center justify-center rounded-full bg-surface-sunk">
                      {event.belt ? <BeltIcon size={84} color={event.color} /> : <span className="h-14 w-14 rounded-full" style={{ background: event.color }} />}
                    </div>
                    <Dialog.Title className="mt-4 font-display text-[26px] font-semibold">{event.rank}</Dialog.Title>
                  </>
                )}
                <div className="mt-4 flex items-end justify-center gap-2">
                  <Oscar size={64} pose={event.kind === "levelup" ? "dance" : "proud"} level={game.level} outfit={settings?.oscarOutfit} />
                  <p className="mb-6 max-w-[180px] rounded-2xl rounded-bl-md bg-surface-sunk px-3 py-2 text-left text-[14px] font-medium">{"line" in event ? event.line : ""}</p>
                </div>
                <div className="mt-4 flex gap-2">
                  {event.kind === "unlock" ? (
                    <>
                      <Button variant="ghost" className="flex-1" onClick={onClose}>
                        Later
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => {
                          onClose();
                          router.push(`/garden?spot=${event.itemId}`);
                        }}
                      >
                        See it
                      </Button>
                    </>
                  ) : (
                    <Button className="flex-1" onClick={onClose} autoFocus>
                      Lovely
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
