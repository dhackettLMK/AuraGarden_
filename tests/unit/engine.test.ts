import { describe, expect, it } from "vitest";
import { computeStreak, boostsFor, applyBoost } from "@/lib/game/engine";
import { addDays } from "@/lib/day";

const run = (start: string, n: number) => Array.from({ length: n }, (_, i) => addDays(start, i));

describe("streaks", () => {
  it("counts consecutive days and their tier", () => {
    const s = computeStreak(run("2026-10-01", 30), "2026-10-30");
    expect(s.current).toBe(30);
    expect(s.boost).toBe(2);
  });
  it("today not done yet doesn't break the streak", () => {
    const s = computeStreak(run("2026-10-01", 7), "2026-10-08");
    expect(s.current).toBe(7);
    expect(s.boost).toBe(1.25);
    expect(s.todayActive).toBe(false);
  });
  it("one rest day a week protects the streak", () => {
    // Mon 2 Nov to Sun 15 Nov 2026, missing Wed 4 Nov.
    const days = run("2026-11-02", 14).filter((d) => d !== "2026-11-04");
    const s = computeStreak(days, "2026-11-15");
    expect(s.restDays).toEqual(["2026-11-04"]);
    expect(s.current).toBe(13);
  });
  it("a second miss in the same week ends it, but the glow steps down a tier per missed day", () => {
    const days = [...run("2026-10-01", 30)]; // 30-day streak (×2)
    // Misses 31 Oct (rest), 1 Nov (break: decay from ×2 tier to ×1.5), 2 Nov (×1.25)
    const s = computeStreak(days, "2026-11-03");
    expect(s.current).toBe(0);
    expect(s.boost).toBe(1.25);
    const back = computeStreak([...days, "2026-11-03"], "2026-11-03");
    expect(back.current).toBe(1);
    expect(back.boost).toBe(1.25);
  });
});

describe("boosts", () => {
  it("+25 ×4 → +100 with a 30-day streak in realm 2 and no achievements", () => {
    const streak = computeStreak(run("2026-10-01", 30), "2026-10-30");
    const b = boostsFor({ streakBoost: streak.boost, total: 60_000, achievements: 0 });
    expect(b.total).toBe(4);
    expect(applyBoost(25, b.total)).toBe(100);
  });
  it("realm boost is permanent and trophies add 1% each", () => {
    const b = boostsFor({ streakBoost: 1, total: 10, realmsSeen: 3, achievements: 10 });
    expect(b.realm).toBe(4);
    expect(b.trophy).toBeCloseTo(1.1);
  });
  it("handles silly numbers", () => {
    const b = boostsFor({ streakBoost: 10, total: 6e8, achievements: 150 });
    expect(b.realm).toBe(512);
    expect(applyBoost(25, b.total)).toBe(Math.round(25 * 10 * 512 * 2.5));
  });
});
