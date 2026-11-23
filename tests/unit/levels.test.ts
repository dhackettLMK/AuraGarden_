import { describe, expect, it } from "vitest";
import { auraForLevel, levelFor, titleFor, sproutStageFor } from "@/config/levels";

describe("levels", () => {
  it("matches the brief's curve", () => {
    expect(auraForLevel(1)).toBe(0);
    expect(auraForLevel(2)).toBe(50);
    expect(auraForLevel(10)).toBe(12_150);
    expect(Math.round(auraForLevel(50) / 1e3)).toBe(840);
    expect(auraForLevel(100) / 1e6).toBeCloseTo(4.9, 1);
    expect(auraForLevel(1000) / 1e9).toBeCloseTo(1.58, 2);
  });
  it("finds the level for a total, including boundaries", () => {
    expect(levelFor(0)).toBe(1);
    expect(levelFor(49)).toBe(1);
    expect(levelFor(50)).toBe(2);
    expect(levelFor(12_150)).toBe(10);
    expect(levelFor(12_149)).toBe(9);
    expect(levelFor(1e15)).toBeGreaterThan(1000);
  });
  it("titles and sprouts", () => {
    expect(titleFor(1)).toBe("Seedling");
    expect(titleFor(52)).toBe("Main Character");
    expect(titleFor(1000)).toBe("Aura Deity");
    expect(sproutStageFor(9)).toBe("sprout");
    expect(sproutStageFor(10)).toBe("bud");
    expect(sproutStageFor(1000)).toBe("golden");
  });
});
