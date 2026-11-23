import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS, tiersFor } from "@/config/achievements";
import { WARDROBE } from "@/config/wardrobe";

describe("achievements", () => {
  it("has more than 150, all unique", () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(150);
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
  });
  it("ends long families on Mythic and Celestial", () => {
    expect(tiersFor(7).slice(-2)).toEqual(["mythic", "celestial"]);
    expect(tiersFor(12)[0]).toBe("bronze");
    expect(tiersFor(3)).toEqual(["bronze", "silver", "gold"]);
  });
  it("every wardrobe accessory is earned by a real achievement", () => {
    for (const w of WARDROBE) expect(ACHIEVEMENTS.some((a) => a.id === w.earnedBy)).toBe(true);
  });
});
