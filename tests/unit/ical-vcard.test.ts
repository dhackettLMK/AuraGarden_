import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parseICS } from "@/lib/ical";
import { parseVCF, toVCF } from "@/lib/vcard";
import { blankContact } from "@/lib/data/contacts";

const ics = readFileSync("tests/fixtures/recurring.ics", "utf8");
const from = Date.UTC(2026, 10, 22);
const to = Date.UTC(2026, 11, 6);

describe("parseICS", () => {
  it("expands weekly recurrences inside the window", () => {
    const ev = parseICS(ics, from, to);
    const lectures = ev.filter((e) => e.title === "Marketing lecture");
    expect(lectures.map((e) => new Date(e.start).toISOString().slice(0, 10))).toEqual(["2026-11-23", "2026-11-25", "2026-11-30", "2026-12-02"]);
  });
  it("honours EXDATE and all-day events", () => {
    const ev = parseICS(ics, from, to);
    const training = ev.filter((e) => e.title === "Training").map((e) => new Date(e.start).toISOString().slice(0, 10));
    expect(training).not.toContain("2026-11-26");
    expect(training).toContain("2026-11-24");
    const swap = ev.find((e) => e.title === "Swap day")!;
    expect(swap.allDay).toBe(true);
  });
  it("rejects things that aren't calendars", () => {
    expect(() => parseICS("<html>nope</html>", from, to)).toThrow();
  });
});

describe("vCard", () => {
  it("parses common fields", () => {
    const [c] = parseVCF("BEGIN:VCARD\r\nVERSION:3.0\r\nN:Byrne;Aoife;;;\r\nFN:Aoife Byrne\r\nTEL;TYPE=CELL:+353 87 000 0000\r\nEMAIL:aoife@example.com\r\nORG:SETU\r\nBDAY:2004-03-17\r\nURL:https://instagram.com/aoife.b\r\nEND:VCARD\r\n");
    expect(c).toMatchObject({ name: "Aoife Byrne", phone: "+353 87 000 0000", email: "aoife@example.com", organisation: "SETU", birthday: "2004-03-17", instagram: "aoife.b" });
  });
  it("round-trips", () => {
    const out = toVCF([blankContact({ name: "Ciara Walsh", phone: "0870000000", notes: "Met at the swap, loves vintage" })]);
    const [c] = parseVCF(out);
    expect(c.name).toBe("Ciara Walsh");
    expect(c.notes).toBe("Met at the swap, loves vintage");
  });
  it("handles multiple cards and folded lines", () => {
    const list = parseVCF("BEGIN:VCARD\nFN:A\nNOTE:long\n  line\nEND:VCARD\nBEGIN:VCARD\nN:Two;Person\nEND:VCARD\n");
    expect(list.map((c) => c.name)).toEqual(["A", "Person Two"]);
    expect(list[0].notes).toBe("long line");
  });
});
