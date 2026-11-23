"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useState } from "react";
import { sproutStageFor, type SproutStage } from "@/config/levels";
import { Accessory } from "./Accessory";

export type OscarPose =
  | "idle"
  | "cheer"
  | "proud"
  | "dance"
  | "awe"
  | "wave"
  | "thinking"
  | "sleepy"
  | "peek"
  | "swim";

export interface OscarProps {
  size?: number;
  pose?: OscarPose;
  level?: number;
  outfit?: string | null;
  className?: string;
  /** Animate idle breathing and blinks. */
  alive?: boolean;
  /** Spin once when this number changes (tap reaction). */
  spinKey?: number;
  title?: string;
}

const C = {
  skin: "#A6CFA1",
  skinShade: "#8EBB8B",
  skinDeep: "#7BA978",
  shellTop: "#6E9E76",
  shellBottom: "#4B7755",
  patch: "#89B58D",
  patchDeep: "#5F8C68",
  rim: "#3E6247",
  belly: "#F6EBD2",
  bellyShade: "#E9D9B6",
  eye: "#2A2521",
  cheek: "#F3A7A2",
  mouth: "#3A2E2A",
};

/**
 * Oscar the Turtle: an original character drawn from brief 8.1. One SVG with
 * separately animated parts, so expressions are poses rather than images.
 */
export function Oscar({
  size = 72,
  pose = "idle",
  level = 1,
  outfit = null,
  className,
  alive = true,
  spinKey = 0,
  title = "Oscar the turtle",
}: OscarProps) {
  const uid = useId().replace(/:/g, "");
  const reduce = useReducedMotion();
  const animate = alive && !reduce;
  const [blink, setBlink] = useState(false);
  const stage = sproutStageFor(level);

  useEffect(() => {
    if (!animate || pose === "sleepy") return;
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(
        () => {
          setBlink(true);
          setTimeout(() => setBlink(false), 140);
          loop();
        },
        3000 + Math.random() * 3000,
      );
    };
    loop();
    return () => clearTimeout(t);
  }, [animate, pose]);

  const happyEyes = pose === "cheer" || pose === "dance";
  const wideEyes = pose === "awe";
  const lids = pose === "sleepy" ? 0.55 : blink ? 1 : 0;
  const legsUp = pose === "cheer";
  const waving = pose === "wave";
  const thinking = pose === "thinking";
  const headTilt = thinking ? -9 : pose === "proud" ? 4 : pose === "awe" ? -3 : 0;

  const bodyAnim =
    !animate
      ? {}
      : pose === "dance"
        ? { rotate: [0, -6, 6, -6, 6, 0], y: [0, -6, 0, -6, 0] }
        : pose === "awe"
          ? { y: [0, 0, -14, 0] }
          : pose === "cheer"
            ? { y: [0, -8, 0] }
            : pose === "swim"
              ? { y: [0, -2.5, 0], rotate: [0, 1.5, 0] }
              : {};
  const bodyTransition =
    pose === "dance"
      ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" as const }
      : pose === "awe"
        ? { duration: 1.4, times: [0, 0.55, 0.75, 1] }
        : pose === "cheer"
          ? { duration: 0.5, ease: "easeOut" as const }
          : pose === "swim"
            ? { duration: 2.6, repeat: Infinity, ease: "easeInOut" as const }
            : {};

  return (
    <motion.svg
      viewBox="0 0 140 124"
      width={size}
      height={(size * 124) / 140}
      className={className}
      role="img"
      aria-label={title}
      key={spinKey}
      initial={spinKey ? { rotate: 0 } : false}
      animate={spinKey && animate ? { rotate: 360 } : undefined}
      transition={{ type: "spring", stiffness: 160, damping: 14 }}
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id={`shell-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.shellTop} />
          <stop offset="1" stopColor={C.shellBottom} />
        </linearGradient>
        <radialGradient id={`head-${uid}`} cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#B9DDB2" />
          <stop offset="0.7" stopColor={C.skin} />
          <stop offset="1" stopColor={C.skinShade} />
        </radialGradient>
        <radialGradient id={`orb-${uid}`} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#FFF6DA" />
          <stop offset="0.35" stopColor="#FFD36E" />
          <stop offset="0.7" stopColor="#F59FC6" />
          <stop offset="1" stopColor="#B79CF2" />
        </radialGradient>
        <radialGradient id={`orbglow-${uid}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.4" stopColor="#FFD36E" stopOpacity="0.55" />
          <stop offset="1" stopColor="#F59FC6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`aurora-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#B79CF2" />
          <stop offset="0.5" stopColor="#F59FC6" />
          <stop offset="1" stopColor="#FFD36E" />
        </linearGradient>
      </defs>

      {pose === "swim" && <SwimRing />}

      <motion.g
        animate={bodyAnim}
        transition={bodyTransition}
        style={{ transformOrigin: "70px 110px", transformBox: "view-box" }}
      >
        {/* back foot and tail */}
        <ellipse cx="114" cy="104" rx="11" ry="8" fill={C.skinShade} />
        <path d="M126 88c6 1 10 4 11 8-5 1-9 0-13-3z" fill={C.skinShade} />

        {/* shell (breathes) */}
        <motion.g
          animate={animate ? { scale: [1, 1.015, 1] } : undefined}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "84px 92px", transformBox: "view-box" }}
        >
          <path d="M36 92C36 54 57 30 84 30s48 24 48 62z" fill={`url(#shell-${uid})`} />
          {/* soft rounded patches */}
          <path d="M70 46c5-5 15-5 20 0 4 4 4 11 0 15-5 5-15 5-20 0-4-4-4-11 0-15z" fill={C.patch} opacity=".9" />
          <path d="M97 55c4-3 11-2 14 2 3 5 3 11-1 14-4 3-11 3-14-1-3-4-3-11 1-15z" fill={C.patch} opacity=".85" />
          <path d="M58 62c4-3 10-2 13 2 2 4 2 10-2 13-4 3-10 2-13-2-2-4-1-10 2-13z" fill={C.patch} opacity=".8" />
          <path d="M80 70c5-3 12-2 15 3 2 4 1 10-3 12-5 3-12 2-15-2-2-5-1-10 3-13z" fill={C.patch} opacity=".75" />
          <path d="M113 76c3-1 7 1 8 4 1 3 0 6-3 7-3 1-6-1-7-4s-1-6 2-7z" fill={C.patch} opacity=".7" />
          {/* highlight */}
          <path d="M62 40c8-6 18-8 28-6-11 2-20 7-26 15z" fill="#fff" opacity=".18" />
          {/* rim band */}
          <path d="M34 90c0-3 2-5 5-5h90c3 0 5 2 5 5v2c0 4-3 7-7 7H41c-4 0-7-3-7-7z" fill={C.rim} />
          <path d="M40 92h88" stroke="#fff" strokeOpacity=".12" strokeWidth="2" strokeLinecap="round" />
          {/* sprout grows with her level */}
          <Sprout stage={stage} uid={uid} sparkle={pose === "proud" && animate} />
          <Accessory id={outfit} slot="shell" />
        </motion.g>

        {/* belly (cream plastron) */}
        <ellipse cx="52" cy="96" rx="25" ry="15" fill={C.belly} />
        <path d="M34 98c8 5 28 6 38 0" stroke={C.bellyShade} strokeWidth="2" fill="none" strokeLinecap="round" />
        <Accessory id={outfit} slot="body" />

        {/* front legs */}
        <motion.g
          animate={{ rotate: legsUp ? -55 : thinking ? -70 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          style={{ transformOrigin: "32px 96px", transformBox: "view-box" }}
        >
          <ellipse cx="30" cy="106" rx="10" ry="9" fill={C.skin} />
          <path d="M24 111c2 1.5 4 1.5 6 0M30 112c2 1.5 4 1.5 6 0" stroke={C.skinDeep} strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </motion.g>
        <motion.g
          animate={
            waving && animate
              ? { rotate: [-120, -150, -120, -150, -120] }
              : { rotate: legsUp ? 55 : waving ? -120 : 0 }
          }
          transition={
            waving && animate
              ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
              : { type: "spring", stiffness: 300, damping: 18 }
          }
          style={{ transformOrigin: "70px 98px", transformBox: "view-box" }}
        >
          <ellipse cx="72" cy="108" rx="10" ry="9" fill={C.skin} />
          <path d="M66 113c2 1.5 4 1.5 6 0M72 114c2 1.5 4 1.5 6 0" stroke={C.skinDeep} strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </motion.g>
        <Accessory id={outfit} slot="hand" />

        {/* the orb he hands out */}
        {(pose === "cheer" || pose === "proud") && (
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 16, delay: 0.05 }}
            style={{ transformOrigin: "52px 84px", transformBox: "view-box" }}
          >
            <circle cx="52" cy="84" r="20" fill={`url(#orbglow-${uid})`} />
            <circle cx="52" cy="84" r="10" fill={`url(#orb-${uid})`} />
            <ellipse cx="48.5" cy="80" rx="3.2" ry="2.1" fill="#fff" opacity=".8" transform="rotate(-30 48.5 80)" />
          </motion.g>
        )}

        {/* head */}
        <motion.g
          animate={{ rotate: headTilt }}
          transition={{ type: "spring", stiffness: 220, damping: 16 }}
          style={{ transformOrigin: "46px 80px", transformBox: "view-box" }}
        >
          <ellipse cx="46" cy="76" rx="12" ry="9" fill={C.skinShade} />
          <circle cx="44" cy="52" r="29" fill={`url(#head-${uid})`} />
          {/* little crown of light on the forehead */}
          <path d="M30 32c6-4 15-5 22-2" stroke="#fff" strokeOpacity=".35" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* cheeks */}
          <ellipse cx="24" cy="62" rx="6" ry="4" fill={C.cheek} opacity=".7" />
          <ellipse cx="64" cy="62" rx="6" ry="4" fill={C.cheek} opacity=".7" />

          {/* eyes */}
          {happyEyes ? (
            <g stroke={C.eye} strokeWidth="3.6" strokeLinecap="round" fill="none">
              <path d="M27 52c2.5-5 9.5-5 12 0" />
              <path d="M49 52c2.5-5 9.5-5 12 0" />
            </g>
          ) : (
            <g>
              <Eye cx={33} cy={50} wide={wideEyes} lid={lids} />
              <Eye cx={55} cy={50} wide={wideEyes} lid={lids} />
            </g>
          )}

          {/* mouth */}
          {pose === "awe" ? (
            <ellipse cx="44" cy="67" rx="4.2" ry="5" fill={C.mouth} />
          ) : pose === "sleepy" ? (
            <path d="M40 66c2.5 1.5 5.5 1.5 8 0" stroke={C.mouth} strokeWidth="2.4" strokeLinecap="round" fill="none" />
          ) : happyEyes || pose === "proud" ? (
            <path d="M37 64c3 6 11 6 14 0z" fill={C.mouth} />
          ) : (
            <path d="M38.5 64.5c3 3.6 8 3.6 11 0" stroke={C.mouth} strokeWidth="2.6" strokeLinecap="round" fill="none" />
          )}
          {(happyEyes || pose === "proud") && <path d="M40 66.5c2 1.8 6 1.8 8 0" stroke={C.cheek} strokeWidth="2" strokeLinecap="round" />}
          <Accessory id={outfit} slot="head" />
        </motion.g>

        {pose === "sleepy" && <Zzz animate={animate} />}
      </motion.g>
    </motion.svg>
  );
}

function Eye({ cx, cy, wide, lid }: { cx: number; cy: number; wide: boolean; lid: number }) {
  const rx = wide ? 8.4 : 7;
  const ry = wide ? 10 : 8.6;
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={C.eye} />
      <circle cx={cx + 2.4} cy={cy - 3.4} r={wide ? 3 : 2.6} fill="#fff" />
      <circle cx={cx - 2.6} cy={cy + 3.2} r={1.25} fill="#fff" opacity=".85" />
      {/* eyelid */}
      <motion.rect
        x={cx - rx - 1}
        y={cy - ry - 1}
        width={rx * 2 + 2}
        height={ry * 2 + 2}
        rx={rx}
        fill="#A6CFA1"
        initial={false}
        animate={{ scaleY: lid }}
        transition={{ duration: lid === 1 ? 0.07 : 0.12 }}
        style={{ transformOrigin: `${cx}px ${cy - ry - 1}px`, transformBox: "view-box" }}
      />
      {lid > 0 && lid < 1 && (
        <path
          d={`M${cx - rx} ${cy - ry + lid * ry * 2}h${rx * 2}`}
          stroke="#7BA978"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      )}
    </g>
  );
}

function Sprout({ stage, uid, sparkle }: { stage: SproutStage; uid: string; sparkle: boolean }) {
  const leafA = "#7DB46E";
  const leafB = "#9ACB7F";
  const stem = <path d="M84 31c0-6 0-10 1-15" stroke="#5F9A55" strokeWidth="2.6" strokeLinecap="round" fill="none" />;
  const leaves = (
    <>
      <path d="M85 20c-6-6-14-5-16-2 4 4 10 5 16 2z" fill={leafA} />
      <path d="M85 17c4-7 12-8 15-5-3 5-9 7-15 5z" fill={leafB} />
    </>
  );
  const daisy = (x: number, y: number, s = 1) => (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {Array.from({ length: 8 }).map((_, i) => (
        <ellipse key={i} cx="0" cy="-5" rx="2.4" ry="4.4" fill="#FFFDF7" transform={`rotate(${i * 45})`} />
      ))}
      <circle r="3" fill="#F4C443" />
    </g>
  );
  return (
    <g>
      {stage === "crown" || stage === "aurora" || stage === "golden" ? (
        <g>
          {[-22, -11, 0, 11, 22].map((dx, i) => (
            <g key={dx}>
              <path d={`M${84 + dx} ${33 + Math.abs(dx) * 0.28}l0-5`} stroke="#5F9A55" strokeWidth="2" />
              {stage === "aurora" && i === 2 ? null : daisy(84 + dx, 27 + Math.abs(dx) * 0.28, 0.62)}
            </g>
          ))}
          {stage === "aurora" && (
            <g>
              {stem}
              {Array.from({ length: 6 }).map((_, i) => (
                <ellipse key={i} cx="85" cy="9" rx="3.6" ry="7" fill={`url(#aurora-${uid})`} transform={`rotate(${i * 60} 85 15)`} opacity=".95" />
              ))}
              <circle cx="85" cy="15" r="3.4" fill="#FFF6DA" />
              <circle cx="85" cy="15" r="11" fill="#FFD36E" opacity=".18" />
            </g>
          )}
          {stage === "golden" && (
            <path d="M74 18l3 8h16l3-8-6 4-5-8-5 8z" fill="#E7B53C" stroke="#C99A2A" strokeWidth="1" strokeLinejoin="round" />
          )}
        </g>
      ) : (
        <g>
          {stem}
          {leaves}
          {stage === "bud" && <path d="M85 8c3 2 4 6 0 9-4-3-3-7 0-9z" fill="#F2A3B5" />}
          {stage === "daisy" && daisy(85, 11)}
          {stage === "two" && (
            <>
              {daisy(85, 11)}
              <path d="M90 31c2-5 5-8 9-10" stroke="#5F9A55" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              <g transform="translate(101 19)">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ellipse key={i} cx="0" cy="-3.8" rx="2.4" ry="3.6" fill="#F4A8BE" transform={`rotate(${i * 60})`} />
                ))}
                <circle r="2.4" fill="#FCE3A1" />
              </g>
            </>
          )}
        </g>
      )}
      {sparkle && (
        <motion.g
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: [0, 1, 0], scale: [0.4, 1.1, 0.6] }}
          transition={{ duration: 1.2, repeat: 2 }}
          style={{ transformOrigin: "98px 10px", transformBox: "view-box" }}
        >
          <path d="M98 2l1.6 5 5 1.6-5 1.6-1.6 5-1.6-5-5-1.6 5-1.6z" fill="#FFD36E" />
          <path d="M72 8l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill="#F59FC6" />
        </motion.g>
      )}
    </g>
  );
}

function Zzz({ animate }: { animate: boolean }) {
  return (
    <motion.text
      x="72"
      y="24"
      fontSize="14"
      fontWeight="700"
      fill="#8FA7C9"
      fontFamily="var(--font-jakarta), sans-serif"
      animate={animate ? { y: [24, 14, 24], opacity: [0.2, 1, 0.2] } : undefined}
      transition={{ duration: 3, repeat: Infinity }}
    >
      z
    </motion.text>
  );
}

function SwimRing() {
  return (
    <g>
      <ellipse cx="70" cy="110" rx="54" ry="13" fill="#FF8FA3" />
      <ellipse cx="70" cy="108" rx="40" ry="7" fill="#7FC8E8" opacity=".9" />
      {[-40, 0, 40].map((dx) => (
        <path key={dx} d={`M${70 + dx - 6} ${104 + Math.abs(dx) * 0.05}h12v12h-12z`} fill="#fff" opacity=".9" />
      ))}
    </g>
  );
}
