import { describe, expect, it } from "vitest";
import { OSCAR_LINES, lineCount, pickLine } from "@/config/oscar-lines";

describe("Oscar's lines", () => {
  it("has at least 80 lines, each at most 12 words and one emoji", () => {
    expect(lineCount()).toBeGreaterThanOrEqual(80);
    for (const lines of Object.values(OSCAR_LINES))
      for (const l of lines) {
        expect(l.replace(/\{\w+\}/g, "x").split(/\s+/).length).toBeLessThanOrEqual(12);
        expect((l.match(/\p{Extended_Pictographic}/gu) ?? []).length).toBeLessThanOrEqual(1);
      }
  });
  it("never repeats back to back", () => {
    let prev = "";
    for (let i = 0; i < 50; i++) {
      const l = pickLine("task", { amount: "25" });
      expect(l).not.toBe(prev);
      prev = l;
    }
  });
  it("drops the name cleanly when not used", () => {
    expect(pickLine("realm", { name: "" })).not.toMatch(/\{|\}/);
  });
});
