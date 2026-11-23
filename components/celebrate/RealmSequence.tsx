"use client";

import { Dialog } from "radix-ui";
import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Oscar } from "@/components/oscar/Oscar";
import { Button } from "@/components/ui/Button";
import { MeadowScene, LakeScene } from "@/components/garden/art/realms";
import { REALMS } from "@/config/realms";
import { formatMultiplier } from "@/lib/format";
import { playRealm } from "@/lib/sound";
import { useGame } from "@/lib/game/GameProvider";
import { useSettings } from "@/lib/hooks";
import type { Stamped } from "@/lib/game/celebrate-bus";

/**
 * The biggest moment in the app (brief 7.5): the garden zooms out to the
 * world map, mist rolls back from the new realm, its name writes itself
 * across the sky, the boost doubles, and Oscar arrives wearing something new.
 */
export function RealmSequence({
  event,
  onClose,
}: {
  event: Stamped;
  onClose: () => void;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const game = useGame();
  const settings = useSettings();
  const [step, setStep] = useState(reduce ? 5 : 0);
  const e = event.kind === "realm" ? event : null;

  useEffect(() => {
    if (!e) return;
    playRealm();
    if (reduce) return;
    const timers = [600, 1500, 2600, 3700, 4700].map((ms, i) =>
      setTimeout(() => setStep(i + 1), ms),
    );
    return () => timers.forEach(clearTimeout);
  }, [e, reduce]);

  if (!e) return null;
  const realm = REALMS[e.realm - 1];
  const neighbours = REALMS.slice(Math.max(0, e.realm - 2), e.realm + 1);
  const outfit =
    e.realm === 3
      ? "backpack"
      : (settings?.oscarOutfit ?? (e.realm === 2 ? "sun-hat" : null));

  return (
    <Dialog.Root open onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-[90] overflow-hidden bg-[#CFE6EE] outline-none dark:bg-[#132A31]"
        >
          {/* the world map zooming out */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center gap-6 px-6"
            initial={reduce ? false : { scale: 2.4, opacity: 0 }}
            animate={{ scale: step >= 1 ? 1 : 2.4, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {neighbours.map((r) => {
              const isNew = r.n === e.realm;
              return (
                <div
                  key={r.id}
                  className={`relative aspect-[16/10] shrink-0 overflow-hidden rounded-[28px] shadow-[var(--shadow-lift)] ring-4 ring-white/80 ${isNew ? "w-[min(78vw,720px)]" : "hidden w-[22vw] opacity-60 md:block"}`}
                >
                  {r.n === 2 ? (
                    <MeadowScene
                      unlocked={new Set(["wildflowers", "poppies"])}
                      className="block h-full w-full"
                    />
                  ) : r.n === 3 ? (
                    <LakeScene
                      unlocked={new Set(["swans", "willow", "lilies"])}
                      className="block h-full w-full"
                    />
                  ) : (
                    <div
                      className="h-full w-full"
                      style={{
                        background: `linear-gradient(160deg, ${r.palette[0]}, ${r.palette[2]})`,
                      }}
                    />
                  )}
                  {isNew && (
                    <motion.div
                      className="mist absolute inset-0"
                      initial={{ opacity: 1, x: 0 }}
                      animate={
                        step >= 2 ? { opacity: 0, x: "40%" } : { opacity: 1 }
                      }
                      transition={{ duration: 1.6, ease: "easeOut" }}
                      style={{
                        background:
                          "radial-gradient(70% 70% at 40% 50%, rgba(255,255,255,0.95), rgba(255,255,255,0.7) 60%, rgba(255,255,255,0.4))",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </motion.div>

          {/* name writes itself across the sky */}
          <div className="absolute inset-x-0 top-[9%] text-center">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: step >= 2 ? 1 : 0 }}
              className="text-sm font-bold uppercase tracking-[0.2em] text-ink-muted"
            >
              A new realm opens
            </motion.p>
            <Dialog.Title asChild>
              <motion.h2
                className="mx-auto mt-2 w-fit px-4 font-display text-[clamp(32px,7vw,64px)] font-semibold leading-tight text-ink"
                initial={reduce ? false : { clipPath: "inset(0 100% 0 0)" }}
                animate={{
                  clipPath: step >= 3 ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
                }}
                transition={{ duration: 1.4, ease: "easeInOut" }}
              >
                {realm.name}
              </motion.h2>
            </Dialog.Title>
          </div>

          {/* the boost doubles */}
          <motion.div
            className="absolute inset-x-0 bottom-[22%] flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: step >= 4 ? 1 : 0, y: step >= 4 ? 0 : 20 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <div className="flex items-center gap-3 rounded-full bg-surface px-6 py-3 shadow-[var(--shadow-lift)]">
              <span className="font-semibold text-ink-muted">Realm boost</span>
              <span className="tabular font-display text-2xl font-bold text-ink-muted line-through decoration-2">
                {formatMultiplier(e.boostFrom)}
              </span>
              <span className="text-xl">→</span>
              <motion.span
                className="aura-text tabular font-display text-3xl font-bold"
                initial={{ scale: 0.6 }}
                animate={{ scale: step >= 4 ? [0.6, 1.3, 1] : 0.6 }}
                transition={{ duration: 0.6 }}
              >
                {formatMultiplier(e.boostTo)}
              </motion.span>
            </div>
          </motion.div>

          {/* Oscar arrives wearing something new */}
          <motion.div
            className="absolute bottom-[max(24px,env(safe-area-inset-bottom))] left-0 right-0 flex flex-col items-center gap-3 px-6"
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: step >= 5 ? 1 : 0, y: step >= 5 ? 0 : 80 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
          >
            <div className="flex items-end gap-2">
              <Oscar
                size={96}
                pose={step >= 5 ? "awe" : "idle"}
                level={game.level}
                outfit={outfit}
              />
              <p className="mb-10 max-w-[240px] rounded-2xl rounded-bl-md bg-surface px-3.5 py-2.5 text-[15px] font-medium shadow-[var(--shadow-soft)]">
                {e.line}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="bg-surface/70"
                onClick={onClose}
              >
                Later
              </Button>
              <Button
                onClick={() => {
                  onClose();
                  router.push("/garden?view=map");
                }}
                autoFocus
              >
                See the world map
              </Button>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
