"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { KeyRound, Sprout } from "lucide-react";
import { getGift, type GiftConfig } from "@/config/gifts";
import { createGarden } from "@/lib/data/garden";
import { updateSettings } from "@/lib/data/settings";
import { greetingFor } from "@/lib/day";
import { useGardenStatus, useSettings } from "@/lib/hooks";
import { haptic, playChime, playDing, playRustle, playWhoosh, unlockAudio } from "@/lib/sound";
import { Button } from "@/components/ui/Button";
import { Oscar, type OscarPose } from "@/components/oscar/Oscar";
import { JoinSheet } from "@/features/welcome/JoinSheet";
import { GiftBox, GiftTag, type BoxStage } from "./GiftBox";

type Stage = "arrival" | "untie" | "lid" | "oscar" | "note" | "reveal" | "choose";

export function LauraGift({ slug }: { slug: string }) {
  return (
    <Suspense>
      <GiftInner slug={slug} />
    </Suspense>
  );
}

function GiftInner({ slug }: { slug: string }) {
  const gift = getGift(slug)!;
  const params = useSearchParams();
  const status = useGardenStatus();
  const settings = useSettings();
  if (params.get("skip") === "1") return <main className="min-h-dvh bg-background" aria-label="Loading" />;
  // A device that already has her garden gets the short version (unless she asked to replay).
  if (status === "ready" && settings && params.get("replay") !== "1") return <ReturnVisit gift={gift} name={settings.displayName || gift.recipient} timezone={settings.timezone} />;
  // The arrival paints straight away (even before we know whether there's a garden).
  return <FullUnwrap gift={gift} hasGarden={status === "ready"} />;
}

/** The full unwrap (brief 4): about 4–6 s after the first tap. */
function FullUnwrap({ gift, hasGarden }: { gift: GiftConfig; hasGarden: boolean }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [stage, setStage] = useState<Stage>("arrival");
  const [skipVisible, setSkipVisible] = useState(false);
  const [oscarPose, setOscarPose] = useState<OscarPose>("peek");
  const [joinOpen, setJoinOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const after = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, reduce ? Math.min(ms, 400) : ms));

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);

  const finish = useCallback(() => {
    timers.current.forEach(clearTimeout);
    if (hasGarden) {
      router.replace("/?from=unwrap");
      return;
    }
    setStage("choose");
  }, [hasGarden, router]);

  const reveal = useCallback(() => {
    setStage("reveal");
    after(1300, finish);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finish]);

  const start = () => {
    if (stage !== "arrival") return;
    unlockAudio();
    haptic(10);
    playRustle();
    setTimeout(() => playWhoosh(), 120);
    setStage("untie");
    after(1000, () => setSkipVisible(true));
    after(650, () => setStage("lid"));
    after(1150, () => {
      setStage("oscar");
      setOscarPose("peek");
      after(450, () => {
        playDing(0);
        setTimeout(() => playChime(), 220);
        setOscarPose("wave");
      });
      after(1500, () => (gift.note ? setStage("note") : reveal()));
    });
  };

  async function startGarden() {
    setBusy(true);
    await createGarden({ name: gift.recipient, giftSlug: gift.slug });
    await updateSettings({ unwrappedAt: Date.now() });
    router.replace("/?from=unwrap");
  }

  const boxStage: BoxStage = stage === "arrival" ? "closed" : stage === "untie" ? "untie" : stage === "reveal" || stage === "choose" ? "fold" : "lid";
  const showTitle = stage === "arrival";

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#FFF7EC_0%,#FCE9E2_55%,#F6D3CE_100%)] px-6 pb-10 pt-safe text-[#2E2A26]">
      <Specks />
      {skipVisible && stage !== "choose" && stage !== "reveal" && (
        <button onClick={finish} className="absolute right-4 top-[max(16px,env(safe-area-inset-top))] z-30 rounded-full px-4 py-2 text-sm font-semibold text-[#6F665D] hover:bg-white/50">
          Skip
        </button>
      )}

      <AnimatePresence>
        {showTitle && (
          <motion.div className="relative z-10 mb-6 text-center" exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
            <h1 className="fade-up font-display text-[clamp(34px,9vw,52px)] font-semibold leading-tight">Hey {gift.recipient},</h1>
            <p className="fade-up mt-1 font-display text-[clamp(20px,5vw,26px)] text-[#6F665D]" style={{ animationDelay: "600ms" }}>
              someone made you something.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="relative z-10 w-full"
        initial={reduce ? false : { y: 80, scale: 0.6 }}
        animate={stage === "reveal" || stage === "choose" ? { y: 0, scale: 0.8, opacity: 1 } : { y: 0, scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 16, delay: stage === "arrival" ? 0.9 : 0 }}
      >
        {/* light rays and aura particles once the lid is off */}
        <AnimatePresence>
          {(stage === "lid" || stage === "oscar" || stage === "note") && (
            <motion.div className="pointer-events-none absolute left-1/2 top-[38%] -z-0 h-[150vmax] w-[150vmax] -translate-x-1/2 -translate-y-1/2" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
              <div className="rays h-full w-full" />
            </motion.div>
          )}
        </AnimatePresence>
        {(stage === "lid" || stage === "oscar" || stage === "note") && !reduce && <AuraParticles />}

        <GiftBox stage={boxStage} onTap={start}>
          <motion.div
            className="absolute bottom-[8%] left-1/2 w-[62%] -translate-x-1/2"
            initial={{ y: "70%" }}
            animate={{ y: stage === "oscar" || stage === "note" ? (oscarPose === "wave" ? "-62%" : "-8%") : stage === "reveal" || stage === "choose" ? "4%" : "70%" }}
            transition={{ type: "spring", stiffness: 200, damping: 16 }}
          >
            <Oscar size={190} pose={oscarPose} className="h-auto w-full" />
          </motion.div>
        </GiftBox>

        <AnimatePresence>
          {stage === "arrival" && (
            <motion.div initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: 30 }} transition={{ delay: 1.2, duration: 0.5 }} className="-mt-2">
              <GiftTag line={gift.tagLine} signature={gift.signature} written={!!reduce} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {(stage === "oscar" || stage === "note") && oscarPose === "wave" && (
            <motion.p initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} className="relative z-20 mx-auto -mt-4 w-fit max-w-[300px] rounded-[20px] bg-white px-5 py-3 text-center text-[17px] font-semibold shadow-[0_10px_30px_rgba(79,122,90,0.2)]" role="status">
              Hiya {gift.recipient}! I&apos;m Oscar. Welcome to your AuraGarden.
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {stage === "arrival" && (
        <motion.button
          onClick={start}
          className="relative z-10 mt-6 rounded-full px-6 py-3 text-[17px] font-semibold text-[#4F7A5A]"
          initial={{ opacity: 0 }}
          animate={reduce ? { opacity: 1 } : { opacity: [0.55, 1, 0.55] }}
          transition={reduce ? { delay: 2 } : { duration: 2, repeat: Infinity, delay: 3.4 }}
        >
          Tap to unwrap
        </motion.button>
      )}

      {stage === "note" && gift.note && (
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="relative z-20 mt-4 max-w-sm rounded-[22px] bg-[#FFFBF2] p-5 text-center shadow-[0_12px_30px_rgba(79,122,90,0.25)]">
          <p className="font-hand text-[22px] leading-snug">{gift.note}</p>
          <Button className="mt-4" onClick={reveal}>
            Open my garden
          </Button>
        </motion.div>
      )}

      {/* the paper becomes grass and the garden ground spreads */}
      <AnimatePresence>
        {(stage === "reveal" || stage === "choose") && (
          <motion.div className="pointer-events-none absolute inset-x-0 bottom-0 z-0" initial={{ height: 0 }} animate={{ height: "46%" }} transition={{ duration: reduce ? 0.01 : 1.1, ease: [0.22, 1, 0.36, 1] }}>
            <svg viewBox="0 0 400 200" preserveAspectRatio="none" className="h-full w-full" aria-hidden="true">
              <path d="M0 40C80 10 160 20 220 32s120 4 180-20V200H0z" fill="#A9D18E" />
              <path d="M0 80c90-24 190-18 260 0s100 10 140 0V200H0z" fill="#8EBF77" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {stage === "choose" && (
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduce ? 0 : 0.3 }} className="relative z-20 mt-2 flex w-full max-w-sm flex-col gap-3">
          <Button size="lg" onClick={startGarden} disabled={busy}>
            <Sprout size={20} /> Start my garden
          </Button>
          <Button size="lg" variant="outline" className="bg-white/80" onClick={() => setJoinOpen(true)}>
            <KeyRound size={18} /> I already have a garden
          </Button>
        </motion.div>
      )}
      <JoinSheet open={joinOpen} onOpenChange={setJoinOpen} />
    </main>
  );
}

/** Return visits: a small box unties itself beside a welcome back, then Home (1.5 s). */
function ReturnVisit({ gift, name, timezone }: { gift: GiftConfig; name: string; timezone?: string }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [stage, setStage] = useState<BoxStage>("closed");
  const [greeting] = useState(() => greetingFor(Date.now(), timezone));
  useEffect(() => {
    const a = setTimeout(() => setStage("untie"), reduce ? 0 : 350);
    const b = setTimeout(() => setStage("lid"), reduce ? 0 : 800);
    const c = setTimeout(() => router.replace("/?from=unwrap"), 1500);
    return () => [a, b, c].forEach(clearTimeout);
  }, [router, reduce]);
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#FFF7EC_0%,#FCE9E2_60%,#F6D3CE_100%)] px-6 text-[#2E2A26]">
      <Specks />
      <div className="relative z-10 flex items-center gap-5">
        <div className="w-28">
          <GiftBox stage={stage} wiggle={false}>
            <motion.div className="absolute bottom-[6%] left-1/2 w-[70%] -translate-x-1/2" initial={{ y: "70%" }} animate={{ y: stage === "lid" ? "-30%" : "70%" }} transition={{ type: "spring", stiffness: 220, damping: 16 }}>
              <Oscar size={80} pose="wave" className="h-auto w-full" />
            </motion.div>
          </GiftBox>
        </div>
        <motion.div initial={reduce ? false : { opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="font-display text-[clamp(26px,7vw,40px)] font-semibold leading-tight">Welcome back, {name}</h1>
          <p className="mt-1 text-[17px] text-[#6F665D]">{greeting}. Your garden missed you.</p>
          <span className="sr-only">{gift.tagLine}</span>
        </motion.div>
      </div>
    </main>
  );
}

function Specks() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {Array.from({ length: 22 }).map((_, i) => (
        <span
          key={i}
          className="speck absolute rounded-full bg-white"
          style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, width: 3 + (i % 4), height: 3 + (i % 4), animationDelay: `${(i % 7) * 0.9}s`, animationDuration: `${9 + (i % 5)}s`, opacity: 0.55 }}
        />
      ))}
    </div>
  );
}

function AuraParticles() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[20%] z-0 h-[60%]" aria-hidden="true">
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute h-2.5 w-2.5 rounded-full"
          style={{ left: `${30 + ((i * 41) % 40)}%`, bottom: 0, background: ["#B79CF2", "#F59FC6", "#FFD36E"][i % 3], boxShadow: "0 0 12px rgba(255,211,110,0.9)" }}
          initial={{ y: 0, opacity: 0, scale: 0.4 }}
          animate={{ y: -220 - (i % 5) * 40, opacity: [0, 1, 0], scale: [0.4, 1, 0.6], x: ((i % 3) - 1) * 30 }}
          transition={{ duration: 2.2, delay: (i % 9) * 0.12, repeat: Infinity, repeatDelay: 0.4 }}
        />
      ))}
    </div>
  );
}
