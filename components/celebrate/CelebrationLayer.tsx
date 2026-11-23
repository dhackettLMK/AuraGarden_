"use client";

import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Oscar } from "@/components/oscar/Oscar";
import { subscribeCelebrations, type Stamped } from "@/lib/game/celebrate-bus";
import { celebrationStyle, petalRain } from "@/lib/game/instant";
import { formatAura, formatMultiplier } from "@/lib/format";
import { playChime, playLevelUp, playUnlock } from "@/lib/sound";
import { useGame } from "@/lib/game/GameProvider";
import { useSettings } from "@/lib/hooks";
import { STACK_WINDOW_MS } from "@/config/aura";
import dynamic from "next/dynamic";

const MomentCard = dynamic(() => import("./MomentCard").then((m) => m.MomentCard), { ssr: false });
const RealmSequence = dynamic(() => import("./RealmSequence").then((m) => m.RealmSequence), { ssr: false });

type Fly = { seq: number; base: number; multiplier: number; amount: number; x: number; y: number; small?: boolean };

/**
 * Everything that celebrates (brief 7.5): the flying "+25", Oscar with his
 * orb, stacking, combo badges, petal rain and the queue of bigger moments.
 */
export function CelebrationLayer() {
  const [flies, setFlies] = useState<Fly[]>([]);
  const [oscar, setOscar] = useState<{ amount: number; line: string; combo: number; key: number; pose: "cheer" | "proud" | "dance" } | null>(null);
  const [queue, setQueue] = useState<Stamped[]>([]);
  const [current, setCurrent] = useState<Stamped | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAwardAt = useRef(0);

  useEffect(() => {
    const bumpHide = (ms: number) => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setOscar(null), ms);
    };
    return subscribeCelebrations((e) => {
      const { style, reduce } = celebrationStyle();
      if (e.kind === "award") {
        const origin = e.origin ?? { x: window.innerWidth - 90, y: window.innerHeight - 180 };
        if (!reduce) setFlies((f) => [...f, { seq: e.seq, base: e.base, multiplier: e.multiplier, amount: e.amount, x: origin.x, y: origin.y, small: e.small }]);
        else glowPill();
        if (style !== "minimal") {
          const stacking = Date.now() - lastAwardAt.current < STACK_WINDOW_MS + 2200;
          lastAwardAt.current = Date.now();
          setOscar((o) => ({
            amount: (stacking && o ? o.amount : 0) + e.amount,
            line: e.line,
            combo: stacking && o ? o.combo : 0,
            key: stacking && o ? o.key : e.seq,
            pose: o?.pose === "dance" && stacking ? "dance" : "cheer",
          }));
          bumpHide(2200);
        }
      } else if (e.kind === "combo") {
        setOscar((o) => (o ? { ...o, combo: o.combo + e.amount, amount: o.amount + e.amount, line: e.line } : o));
        bumpHide(2200);
      } else if (e.kind === "goal" || e.kind === "deck") {
        petalRain();
        playChime();
        if (style !== "minimal") {
          setOscar((o) => ({ amount: (o?.amount ?? 0) + e.amount, line: e.line, combo: o?.combo ?? 0, key: o?.key ?? e.seq, pose: "dance" }));
          bumpHide(3200);
        }
      } else if (style !== "minimal" || e.kind === "levelup") {
        setQueue((q) => [...q, e]);
      }
    });
  }, []);

  // Show queued moments one at a time, once a run of completions has settled.
  useEffect(() => {
    if (current || !queue.length) return;
    let t: ReturnType<typeof setTimeout>;
    const tryShow = () => {
      const quiet = Date.now() - lastAwardAt.current;
      if (quiet < 1600) {
        t = setTimeout(tryShow, 1600 - quiet);
        return;
      }
      const [next, ...rest] = queue;
      setQueue(rest);
      setCurrent(next);
      if (next.kind === "levelup") playLevelUp();
      else if (next.kind !== "realm") playUnlock();
    };
    t = setTimeout(tryShow, 900);
    return () => clearTimeout(t);
  }, [queue, current]);


  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-[75]" aria-hidden="true">
        {flies.map((f) => (
          <FlyingAward key={f.seq} fly={f} onDone={() => setFlies((all) => all.filter((x) => x.seq !== f.seq))} />
        ))}
      </div>
      <OscarPopup state={oscar} onDismiss={() => setOscar(null)} />
      <div aria-live="polite" className="sr-only">
        {oscar ? `Plus ${formatAura(oscar.amount, "full")} aura. ${oscar.line}` : ""}
      </div>
      {current?.kind === "realm" ? <RealmSequence event={current} onClose={() => setCurrent(null)} /> : current ? <MomentCard event={current} onClose={() => setCurrent(null)} /> : null}
    </>
  );
}

function glowPill() {
  const pill = document.getElementById("aura-pill");
  if (!pill) return;
  pill.classList.remove("glowing");
  void pill.offsetWidth;
  pill.classList.add("glowing");
}

/** "+25" rises from the checkbox, the ×badge clicks in, it rolls up, then arcs into the pill. */
function FlyingAward({ fly, onDone }: { fly: Fly; onDone: () => void }) {
  const x = useMotionValue(fly.x);
  const y = useMotionValue(fly.y);
  const scale = useMotionValue(0.6);
  const opacity = useMotionValue(0);
  const value = useMotionValue(fly.base);
  const text = useTransform(value, (v) => `+${formatAura(Math.round(v))}`);
  const boosted = fly.multiplier > 1.0001;
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.all([
        animate(opacity, 1, { duration: 0.12 }),
        animate(scale, 1, { type: "spring", stiffness: 500, damping: 18 }),
        animate(y, fly.y - 44, { duration: 0.32, ease: [0.16, 1, 0.3, 1] }),
      ]);
      if (cancelled) return;
      if (boosted) {
        setShowBadge(true);
        await new Promise((r) => setTimeout(r, 120));
        await animate(value, fly.amount, { duration: 0.42, ease: [0.3, 0, 0.2, 1] });
      } else await new Promise((r) => setTimeout(r, 160));
      if (cancelled) return;
      const pill = document.getElementById("aura-pill")?.getBoundingClientRect();
      const tx = pill ? pill.left + pill.width * 0.55 : window.innerWidth - 80;
      const ty = pill ? pill.top + pill.height / 2 : 24;
      // Arc: x eases out, y eases in, so the path curves up into the pill.
      await Promise.all([
        animate(x, tx, { duration: 0.42, ease: [0.4, 0, 0.6, 1] }),
        animate(y, ty, { duration: 0.42, ease: [0.55, 0, 0.9, 0.6] }),
        animate(scale, 0.35, { duration: 0.42 }),
      ]);
      glowPill();
      await animate(opacity, 0, { duration: 0.1 });
      onDone();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div style={{ x, y, scale, opacity, translateX: "-50%", translateY: "-50%" }} className="absolute left-0 top-0 flex items-center gap-1.5 whitespace-nowrap">
      <motion.span className={`aura-text-glow tabular font-display font-bold ${fly.small ? "text-[22px]" : "text-[30px]"}`}>{text}</motion.span>
      {showBadge && (
        <motion.span
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 700, damping: 14 }}
          className="rounded-full bg-ink px-2 py-0.5 text-[13px] font-bold text-background shadow-[var(--shadow-soft)]"
        >
          {formatMultiplier(fly.multiplier)}
        </motion.span>
      )}
    </motion.div>
  );
}

/** Oscar springs up from the bottom-right, above the tab bar, holding his orb. */
function OscarPopup({
  state,
  onDismiss,
}: {
  state: { amount: number; line: string; combo: number; key: number; pose: "cheer" | "proud" | "dance" } | null;
  onDismiss: () => void;
}) {
  const settings = useSettings();
  const game = useGame();
  const [spin, setSpin] = useState(0);
  const calm = settings?.celebration === "calm";
  const size = calm ? 64 : 92;
  return (
    <AnimatePresence>
      {state && (
        <motion.div
          key={state.key}
          initial={{ y: 140, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 140, opacity: 0, transition: { duration: 0.25, ease: "easeIn" } }}
          transition={{ type: "spring", stiffness: 380, damping: 22, delay: 0.15 }}
          className="pointer-events-none fixed bottom-[calc(96px+env(safe-area-inset-bottom))] right-3 z-[76] flex items-end gap-1 md:bottom-6 md:right-6"
        >
          <motion.div
            layout
            className="pointer-events-auto mb-10 max-w-[220px] rounded-[18px] rounded-br-[6px] bg-surface px-3.5 py-2.5 shadow-[var(--shadow-lift)] ring-1 ring-line"
            onClick={onDismiss}
          >
            <div className="flex items-center gap-2">
              <span className="aura-text tabular font-display text-[20px] font-bold">+{formatAura(state.amount)}</span>
              {state.combo > 0 && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="rounded-full bg-gentle px-2 py-0.5 text-[11px] font-bold text-gentle-ink">
                  Combo! +{formatAura(state.combo)}
                </motion.span>
              )}
            </div>
            <p className="text-[14px] font-medium leading-snug text-ink">{state.line}</p>
          </motion.div>
          <button className="pointer-events-auto" onClick={() => setSpin((s) => s + 1)} aria-label="Oscar">
            <Oscar size={size} pose={state.pose} level={game.level} outfit={settings?.oscarOutfit} spinKey={spin} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
