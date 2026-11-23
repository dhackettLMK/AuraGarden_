import { describe, expect, it } from "vitest";
import { addDays, dayDiff, gardenDay, weekdayOf } from "@/lib/day";

describe("garden days", () => {
  it("end at 3 a.m. Dublin time", () => {
    // 23 Nov 2026 02:30 in Dublin (UTC+0 in winter) still belongs to the 22nd.
    expect(gardenDay(Date.UTC(2026, 10, 23, 2, 30))).toBe("2026-11-22");
    expect(gardenDay(Date.UTC(2026, 10, 23, 3, 1))).toBe("2026-11-23");
    // Summer time: 02:30 IST is 01:30 UTC.
    expect(gardenDay(Date.UTC(2026, 6, 10, 1, 30))).toBe("2026-07-09");
    expect(gardenDay(Date.UTC(2026, 6, 10, 2, 30))).toBe("2026-07-10");
  });
  it("does date maths", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(dayDiff("2026-11-01", "2026-11-23")).toBe(22);
    expect(weekdayOf("2026-11-23")).toBe(1);
  });
});
