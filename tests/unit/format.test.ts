import { describe, expect, it } from "vitest";
import { formatAura, formatMultiplier } from "@/lib/format";

describe("formatAura", () => {
  it("shows full numbers with commas below a million", () => {
    expect(formatAura(0)).toBe("0");
    expect(formatAura(812_450)).toBe("812,450");
    expect(formatAura(999_999)).toBe("999,999");
  });
  it("shortens from a million with up to two decimals", () => {
    expect(formatAura(1_234_567)).toBe("1.23M");
    expect(formatAura(45_600_000)).toBe("45.6M");
    expect(formatAura(1_200_000_000)).toBe("1.20B");
    expect(formatAura(999_000_000_000)).toBe("999B");
    expect(formatAura(3_400_000_000_000)).toBe("3.40T");
  });
  it("never rounds up past the real value", () => {
    expect(formatAura(1_999_999)).toBe("1.99M");
  });
  it("can always show full", () => {
    expect(formatAura(1_234_567, "full")).toBe("1,234,567");
  });
  it("formats multipliers", () => {
    expect(formatMultiplier(4)).toBe("×4");
    expect(formatMultiplier(3.375)).toBe("×3.38");
    expect(formatMultiplier(128)).toBe("×128");
  });
});
