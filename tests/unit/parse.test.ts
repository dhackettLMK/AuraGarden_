import { describe, expect, it } from "vitest";
import { parseQuickInput } from "@/lib/parse";

const projects = [
  { id: "c", name: "College Work" },
  { id: "s", name: "Swap 'N' Serve" },
  { id: "h", name: "Hurley Pop's" },
  { id: "m", name: "Martial Arts Training" },
];
const ref = new Date(2026, 10, 23, 10, 0); // Mon 23 Nov 2026

describe("parseQuickInput", () => {
  it("parses the brief's example", () => {
    const r = parseQuickInput("essay draft fri 5pm #college !high", projects, ref);
    expect(r.title).toBe("essay draft");
    expect(r.dueDate).toBe("2026-11-27");
    expect(r.dueTime).toBe("17:00");
    expect(r.projectId).toBe("c");
    expect(r.priority).toBe(3);
  });
  it("matches projects by word and keeps other tags", () => {
    const r = parseQuickInput("sort donations #swap #urgent-ish tomorrow", projects, ref);
    expect(r.projectId).toBe("s");
    expect(r.tags).toEqual(["urgent-ish"]);
    expect(r.dueDate).toBe("2026-11-24");
    expect(r.dueTime).toBeNull();
  });
  it("leaves plain text alone", () => {
    const r = parseQuickInput("buy oat milk", projects, ref);
    expect(r).toMatchObject({ title: "buy oat milk", dueDate: null, projectId: null, priority: 0, tags: [] });
  });
  it("understands martial", () => {
    expect(parseQuickInput("kata practice #martial", projects, ref).projectId).toBe("m");
  });
});
