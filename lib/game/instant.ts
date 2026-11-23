"use client";

import confetti from "canvas-confetti";
import { STACK_WINDOW_MS, MAX_PITCH_STEPS } from "@/config/aura";
import { haptic, playDing, unlockAudio } from "../sound";

let lastAt = 0;
let step = 0;
let style: "full" | "calm" | "minimal" = "full";
let reduce = false;

export function configureCelebrations(opts: { style: "full" | "calm" | "minimal"; reduceMotion: boolean }) {
  style = opts.style;
  reduce = opts.reduceMotion;
}

export function celebrationStyle() {
  return { style, reduce };
}

/** Where we are in a run of completions (for pitch and Oscar stacking). */
export function stackStep() {
  return step;
}

let leaf: confetti.Shape | null = null;
let petal: confetti.Shape | null = null;
function shapes() {
  if (!leaf && typeof confetti.shapeFromPath === "function") {
    leaf = confetti.shapeFromPath({ path: "M0 10 C 2 3, 9 0, 14 2 C 12 8, 6 12, 0 10 Z" });
    petal = confetti.shapeFromPath({ path: "M6 0 C 11 3, 11 9, 6 13 C 1 9, 1 3, 6 0 Z" });
  }
  return { leaf, petal };
}

/**
 * Runs synchronously inside the tap handler so feedback starts within
 * 100 ms (brief 2.3): the ding (pitched up a semitone per stacked
 * completion), a 15 ms haptic tap and six to eight leaves bursting.
 */
export function instantFeedback(origin?: { x: number; y: number }) {
  unlockAudio();
  const t = Date.now();
  step = t - lastAt < STACK_WINDOW_MS ? Math.min(MAX_PITCH_STEPS, step + 1) : 0;
  lastAt = t;
  playDing(step);
  haptic(15);
  if (!origin || reduce || style === "minimal" || typeof window === "undefined") return;
  const { leaf: l } = shapes();
  void confetti({
    particleCount: style === "calm" ? 4 : 7,
    spread: 70,
    startVelocity: 16,
    gravity: 0.7,
    ticks: 70,
    scalar: 1.1,
    decay: 0.9,
    origin: { x: origin.x / window.innerWidth, y: origin.y / window.innerHeight },
    colors: ["#7DB46E", "#9ACB7F", "#A6CFA1", "#5F9A55"],
    shapes: l ? [l] : ["circle"],
    disableForReducedMotion: true,
    zIndex: 80,
  });
}

/** Leaves and petals fall from the top of the screen (daily goal). */
export function petalRain() {
  if (reduce || style !== "full" || typeof window === "undefined") return;
  const { leaf: l, petal: p } = shapes();
  const end = Date.now() + 1400;
  const frame = () => {
    void confetti({
      particleCount: 3,
      angle: 270,
      spread: 160,
      startVelocity: 4,
      gravity: 0.45,
      drift: (Math.random() - 0.5) * 1.5,
      ticks: 380,
      scalar: 1.3,
      origin: { x: Math.random(), y: -0.05 },
      colors: ["#F2C4C0", "#F59FC6", "#9ACB7F", "#FFD36E", "#FFFDF7"],
      shapes: l && p ? [l, p] : ["circle"],
      disableForReducedMotion: true,
      zIndex: 80,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}
