import { describe, expect, it } from "vitest";
import { catchupDue, daysToBirthday, whatsappNumber } from "@/lib/people";
import { blankContact } from "@/lib/data/contacts";

describe("people helpers", () => {
  it("counts days to the next birthday", () => {
    expect(daysToBirthday("2004-11-25", "2026-11-23")).toBe(2);
    expect(daysToBirthday("--11-23", "2026-11-23")).toBe(0);
    expect(daysToBirthday("2004-01-05", "2026-11-23")).toBe(43);
    expect(daysToBirthday(null, "2026-11-23")).toBeNull();
  });
  it("knows when a catch-up is due", () => {
    const c = blankContact({ name: "A", keepInTouchDays: 14, lastContacted: new Date(2026, 10, 1, 12).getTime() });
    expect(catchupDue(c, "2026-11-23")).toBe(8);
    expect(catchupDue({ ...c, keepInTouchDays: null }, "2026-11-23")).toBeNull();
  });
  it("formats WhatsApp numbers", () => {
    expect(whatsappNumber("087 123 4567")).toBe("353871234567");
    expect(whatsappNumber("+44 7700 900000")).toBe("447700900000");
  });
});
