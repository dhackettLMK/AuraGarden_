"use client";

import { motion, useReducedMotion } from "motion/react";

export type BoxStage = "closed" | "untie" | "lid" | "open" | "fold";

const PAPER = "#9DBE98";
const PAPER_SHADE = "#86AC82";
const RIBBON = "#F2C4C0";
const RIBBON_SHADE = "#E3A9A4";

/** Sage paper with a faint leaf pattern (original). */
function LeafPattern({ id }: { id: string }) {
  return (
    <pattern id={id} width="44" height="44" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
      <path d="M10 22c0-7 6-12 12-12 0 7-6 12-12 12z" fill="#FFFFFF" opacity=".16" />
      <path d="M32 40c0-5 4-8 8-8 0 5-4 8-8 8z" fill="#FFFFFF" opacity=".12" />
      <circle cx="34" cy="10" r="1.6" fill="#FFFFFF" opacity=".18" />
    </pattern>
  );
}

/**
 * The gift box, built from SVG and CSS 3D transforms (brief 4). Stages:
 * closed → untie (bow and ribbon slip away) → lid (lid flies off) → open →
 * fold (the four walls fold outward flat and the paper becomes grass).
 */
export function GiftBox({ stage, children, onTap, wiggle = true }: { stage: BoxStage; children?: React.ReactNode; onTap?: () => void; wiggle?: boolean }) {
  const reduce = useReducedMotion();
  const untied = stage !== "closed";
  const lidOff = stage === "lid" || stage === "open" || stage === "fold";
  const folded = stage === "fold";
  const grass = folded ? "#8EBF77" : PAPER;
  const t = (d: number, delay = 0) => (reduce ? { duration: 0.01 } : { duration: d, delay, ease: [0.22, 1, 0.36, 1] as const });

  return (
    <motion.div
      className="relative mx-auto w-[min(72vw,300px)] select-none"
      style={{ perspective: 900, aspectRatio: "1 / 1.05" }}
      onClick={onTap}
      animate={stage === "closed" && !reduce ? { scale: [1, 1.025, 1], rotate: wiggle ? [0, 0, -2.5, 2.5, -1.5, 0, 0] : 0 } : { scale: 1, rotate: 0 }}
      transition={stage === "closed" ? { duration: 3.2, repeat: Infinity, ease: "easeInOut", times: wiggle ? [0, 0.6, 0.66, 0.72, 0.78, 0.84, 1] : undefined } : { duration: 0.3 }}
    >
      {/* the inside of the box, where light and Oscar come from */}
      <div className="absolute inset-x-[6%] bottom-0 top-[30%]" style={{ transformStyle: "preserve-3d", clipPath: "inset(-300% -60% 0 -60%)" }}>
        {/* the floor flattens into a little lawn when the walls fold out */}
        <motion.div
          className="absolute inset-0"
          style={{ transformOrigin: "50% 100%" }}
          animate={folded ? { scaleY: 0.2, scaleX: 1.5, borderRadius: "50%", background: "#8EBF77" } : { scaleY: 1, scaleX: 1, borderRadius: "10px", background: "#6E8F6A" }}
          transition={t(0.9, 0.2)}
        />
        {/* back wall */}
        <motion.div className="absolute inset-x-0 top-0 h-full origin-bottom rounded-t-[10px]" style={{ background: grass }} animate={{ rotateX: folded ? 88 : 0, opacity: folded ? 0 : 1 }} transition={t(0.9, 0.15)} />
        <div className="absolute inset-0 overflow-visible">{children}</div>
        {/* side walls fold outward */}
        <motion.div className="absolute bottom-0 left-0 top-0 w-[18%] origin-left" style={{ background: PAPER_SHADE }} animate={{ rotateY: folded ? -88 : 0, opacity: folded ? 0 : 1 }} transition={t(0.9, 0.05)} />
        <motion.div className="absolute bottom-0 right-0 top-0 w-[18%] origin-right" style={{ background: PAPER_SHADE }} animate={{ rotateY: folded ? 88 : 0, opacity: folded ? 0 : 1 }} transition={t(0.9, 0.05)} />
        {/* front wall: the patterned paper, folds down towards her */}
        <motion.div className="absolute inset-0 origin-bottom overflow-hidden rounded-b-[12px] rounded-t-[4px] shadow-[0_18px_40px_rgba(79,122,90,0.3)]" animate={{ rotateX: folded ? -86 : 0 }} transition={t(1, 0.1)}>
          <svg viewBox="0 0 100 70" preserveAspectRatio="none" className="h-full w-full" aria-hidden="true">
            <defs>
              <LeafPattern id="leafy-front" />
              <linearGradient id="front-shade" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#000" stopOpacity="0" />
                <stop offset="1" stopColor="#000" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <motion.rect width="100" height="70" animate={{ fill: grass }} transition={t(0.8, 0.3)} />
            <rect width="100" height="70" fill="url(#leafy-front)" opacity={folded ? 0 : 1} />
            <rect width="100" height="70" fill="url(#front-shade)" />
            {/* vertical ribbon on the box */}
            <motion.rect x="43" y="0" width="14" height="70" fill={RIBBON} animate={{ scaleY: untied ? 0 : 1, opacity: untied ? 0 : 1 }} style={{ transformOrigin: "50px 70px" }} transition={t(0.45)} />
            <motion.rect x="54" y="0" width="3" height="70" fill={RIBBON_SHADE} animate={{ scaleY: untied ? 0 : 1, opacity: untied ? 0 : 1 }} style={{ transformOrigin: "55px 70px" }} transition={t(0.45)} />
          </svg>
        </motion.div>
      </div>

      {/* lid */}
      <motion.div
        className="absolute inset-x-0 top-[18%] h-[17%]"
        animate={lidOff ? { y: [0, -60, -520], rotate: [0, -8, -28], x: [0, 0, 60], opacity: [1, 1, 0] } : { y: 0, rotate: 0, opacity: 1 }}
        transition={lidOff ? (reduce ? { duration: 0.01 } : { duration: 0.6, times: [0, 0.35, 1], ease: "easeIn" }) : { duration: 0.2 }}
      >
        <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="h-full w-full drop-shadow-[0_6px_10px_rgba(79,122,90,0.25)]" aria-hidden="true">
          <defs>
            <LeafPattern id="leafy-lid" />
          </defs>
          <rect x="0" y="0" width="100" height="24" rx="4" fill={PAPER} />
          <rect x="0" y="0" width="100" height="24" rx="4" fill="url(#leafy-lid)" />
          <rect x="0" y="18" width="100" height="6" fill={PAPER_SHADE} />
          <motion.rect x="43" y="0" width="14" height="24" fill={RIBBON} animate={{ opacity: untied ? 0 : 1 }} transition={t(0.3)} />
        </svg>
      </motion.div>

      {/* the bow: loops loosen and slide off both sides */}
      <div className="pointer-events-none absolute left-1/2 top-[5%] h-[20%] w-[62%] -translate-x-1/2">
        <motion.svg viewBox="0 0 60 34" className="absolute left-0 top-0 h-full w-1/2 overflow-visible" animate={untied ? { x: -180, rotate: -40, opacity: 0 } : { x: 0, rotate: 0, opacity: 1 }} transition={t(0.6)} aria-hidden="true">
          <path d="M58 22C44 4 16-4 6 8c-8 10 6 22 26 22 10 0 20-3 26-8z" fill={RIBBON} />
          <path d="M58 22C46 12 26 8 16 14c10 2 26 6 42 8z" fill={RIBBON_SHADE} />
          <path d="M52 28l-14 22 8-2 4 8 8-26z" fill={RIBBON} />
        </motion.svg>
        <motion.svg viewBox="0 0 60 34" className="absolute right-0 top-0 h-full w-1/2 overflow-visible" animate={untied ? { x: 180, rotate: 40, opacity: 0 } : { x: 0, rotate: 0, opacity: 1 }} transition={t(0.6)} aria-hidden="true">
          <path d="M2 22C16 4 44-4 54 8c8 10-6 22-26 22-10 0-20-3-26-8z" fill={RIBBON} />
          <path d="M2 22C14 12 34 8 44 14c-10 2-26 6-42 8z" fill={RIBBON_SHADE} />
          <path d="M8 28l14 22-8-2-4 8-8-26z" fill={RIBBON} />
        </motion.svg>
        <motion.div className="absolute left-1/2 top-[48%] h-[38%] w-[16%] -translate-x-1/2 rounded-[40%]" style={{ background: RIBBON_SHADE }} animate={{ scale: untied ? 0 : 1, opacity: untied ? 0 : 1 }} transition={t(0.3)} />
      </div>
    </motion.div>
  );
}

/** The paper tag that swings from the bow: tag line in Caveat, "David" writing itself, a heart that beats. */
export function GiftTag({ line, signature, written = false }: { line: string; signature: string; written?: boolean }) {
  const reduce = useReducedMotion();
  const instant = reduce || written;
  return (
    <motion.div
      className="relative mx-auto w-[min(64vw,250px)] origin-top"
      initial={{ rotate: instant ? 0 : -8 }}
      animate={instant ? { rotate: 0 } : { rotate: [-8, 5, -3, 2, 0] }}
      transition={{ duration: 2.2, ease: "easeOut" }}
    >
      <div className="mx-auto h-5 w-px bg-[#B8A992]" aria-hidden="true" />
      <div className="relative rounded-[14px] bg-[#FFFBF2] px-5 pb-4 pt-5 text-center shadow-[0_10px_24px_rgba(79,122,90,0.22)] ring-1 ring-[#EDE2CC]" style={{ clipPath: "polygon(12% 0, 88% 0, 100% 14%, 100% 100%, 0 100%, 0 14%)" }}>
        <span className="absolute left-1/2 top-2 h-2.5 w-2.5 -translate-x-1/2 rounded-full ring-2 ring-[#D8CBB2]" aria-hidden="true" />
        <p className="font-hand text-[25px] leading-[1.1] text-[#4A3F35]">{line}</p>
        <div className="mt-1 flex items-center justify-center gap-1.5" aria-label={`From ${signature}, with love`}>
          <motion.span
            className="-mx-3 px-3 font-signature text-[40px] leading-[1.15] text-[#3F5D47]"
            initial={{ clipPath: instant ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)" }}
            animate={{ clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: instant ? 0 : 0.9, delay: instant ? 0 : 1.1, ease: "easeInOut" }}
            aria-hidden="true"
          >
            {signature}
          </motion.span>
          <svg viewBox="0 0 26 24" width="24" height="22" aria-hidden="true" className="mt-2 overflow-visible">
            <motion.path
              d="M13 21C5 15 2 11 2 7.2 2 4.3 4.3 2 7.1 2c2.4 0 4.4 1.5 5.9 3.7C14.5 3.5 16.5 2 18.9 2 21.7 2 24 4.3 24 7.2 24 11 21 15 13 21z"
              fill="#E78A9B"
              stroke="#D8667C"
              strokeWidth="1.6"
              strokeLinejoin="round"
              initial={instant ? false : { pathLength: 0, fillOpacity: 0 }}
              animate={instant ? { pathLength: 1, fillOpacity: 1 } : { pathLength: 1, fillOpacity: 1, scale: [1, 1, 1.25, 1] }}
              transition={instant ? { duration: 0 } : { pathLength: { duration: 0.6, delay: 2.0 }, fillOpacity: { duration: 0.3, delay: 2.5 }, scale: { duration: 0.6, delay: 2.75, times: [0, 0.2, 0.5, 1] } }}
              style={{ transformOrigin: "13px 12px" }}
            />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}
