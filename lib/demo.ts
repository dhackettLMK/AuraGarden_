import { createGarden, hasGarden } from "./data/garden";
import { createTask } from "./data/tasks";
import { addDays, todayKey } from "./day";
import { putMany, baseRecord } from "./data/core";
import { afterAward } from "./game/actions";
import type { AuraRecord } from "./types";

/** Seeds a garden for screenshots and tests. */
export async function seedDemo(kind: string) {
  if (await hasGarden()) return;
  if (kind === "blank") {
    await createGarden({ name: "Sam" });
    return;
  }
  await createGarden({ name: "Laura", giftSlug: "laura" });
  if (kind === "laura-empty") return;
  const today = todayKey();
  const demo: Parameters<typeof createTask>[0][] = [
    { title: "Essay draft for Marketing 101", projectId: "prj_college", sectionId: "sec_college_0", dueDate: addDays(today, 2), dueTime: "17:00", priority: 3, tags: ["essay"] },
    { title: "Revise for the stats exam", projectId: "prj_college", sectionId: "sec_college_1", dueDate: addDays(today, 6), big: true },
    { title: "Read chapter 4", projectId: "prj_college", dueDate: today },
    { title: "Plan the December swap", projectId: "prj_swapnserve", sectionId: "sec_swapnserve_0", dueDate: addDays(today, 3), priority: 2 },
    { title: "Post the drop-off times on Instagram", projectId: "prj_swapnserve", sectionId: "sec_swapnserve_1", dueDate: today },
    { title: "Order more cups", projectId: "prj_hurley", dueDate: addDays(today, -1) },
    { title: "Practise the new kata", projectId: "prj_martial", sectionId: "sec_martial_0", recurrence: { kind: "weekly", days: [2, 4] }, dueDate: addDays(today, 1) },
    { title: "Buy oat milk", sectionId: "sec_mylist_today" },
    { title: "Ring Nana", sectionId: "sec_mylist_today", dueDate: today },
    { title: "Learn to make sourdough", sectionId: "sec_mylist_someday" },
  ];
  for (const t of demo.reverse()) await createTask(t);
  await seedLife(today);
  const grow = /^laura-(\d+)$/.exec(kind);
  if (grow) await growGarden(Number(grow[1]), today);
}

/** Back-fill history: a streak of days with completions totalling about `target` aura. */
async function growGarden(target: number, today: string) {
  const days = 12;
  const per = Math.max(25, Math.round(target / days / 6));
  const rows: AuraRecord[] = [];
  const projects = ["prj_college", "prj_swapnserve", "prj_hurley", "prj_martial", null];
  for (let d = days; d >= 1; d--) {
    const day = addDays(today, -d);
    const at = new Date(`${day}T14:00:00`).getTime();
    for (let i = 0; i < 6; i++)
      rows.push({
        ...baseRecord(`task:demo-${d}-${i}:complete:${day}`),
        base: 25,
        multiplier: per / 25,
        amount: per,
        reason: ["Lecture notes", "Swap rail sorted", "Stock check", "Training session", "Laundry", "Reading"][i],
        source: "task",
        day,
        voided: false,
        projectId: projects[i % projects.length],
        refId: `demo-${d}-${i}`,
        at: at + i * 60_000,
      });
  }
  await putMany("aura_ledger", rows, { keepTimestamps: true });
  await afterAward(0);
}

/** Fires a celebration by kind, for previews and screenshots. */
export async function previewMoment(kind: string) {
  const { celebrate } = await import("./game/celebrate-bus");
  if (kind === "realm") celebrate({ kind: "realm", realm: 2, name: "The Wildflower Meadow", boostFrom: 1, boostTo: 2, line: "Laura. LAURA. There's a whole meadow out here." });
  if (kind === "level") celebrate({ kind: "levelup", from: 9, to: 10, title: "Budding", line: "Level up! I knew you had it in you." });
}

/** Grants aura directly (tests only), then runs the usual unlock checks. */
export async function grant(amount: number, projectId: string | null = null) {
  const { awardAura, readGameContext } = await import("./game/aura");
  const before = (await readGameContext()).total;
  await awardAura({ id: `bonus:grant:${Date.now()}`, base: amount, reason: "Test grant", source: "bonus", multiply: false, projectId });
  await afterAward(before);
}

async function seedLife(today: string) {
  const { createThought } = await import("./data/thoughts");
  const { createContact, logCatchup } = await import("./data/contacts");
  const { createEvent } = await import("./data/events");
  await createThought({ title: "Ideas for the Christmas swap", body: "<p>Kids corner, a mending table, hot chocolate.</p>", text: "Kids corner, a mending table, hot chocolate.", tags: ["swap"], projectIds: ["prj_swapnserve"], pinned: true, mood: 4 });
  await createThought({ title: "", body: "<p>Grading went better than I thought. Sensei said my stances are cleaner.</p>", text: "Grading went better than I thought. Sensei said my stances are cleaner.", tags: ["training"], projectIds: ["prj_martial"], mood: 5 });
  await createThought({ title: "Essay outline", body: "<p>Intro, three brands, what Gen Z actually wants, conclusion.</p>", text: "Intro, three brands, what Gen Z actually wants, conclusion.", tags: ["college"], mood: 3 });
  const people = [
    { name: "Aoife Byrne", organisation: "SETU", role: "Classmate", color: "#9CC9FF", keepInTouchDays: 14 },
    { name: "Ciara Walsh", organisation: "Swap 'N' Serve", role: "Volunteer lead", color: "#F6C828", birthday: `2004-${addDays(today, 5).slice(5)}` },
    { name: "Sensei Tom", organisation: "Dojo", role: "Instructor", color: "#E8A7A0" },
    { name: "Nana", role: "Family", color: "#C59BF5", keepInTouchDays: 7, lastContacted: Date.now() - 10 * 86_400_000 },
  ];
  for (const p of people) {
    const c = await createContact(p);
    if (p.name === "Aoife Byrne") await logCatchup(c.id, addDays(today, -3), "Coffee after the lecture");
  }
  const at = (d: string, h: number, m = 0) => new Date(`${d}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`).getTime();
  await createEvent({ title: "Marketing lecture", start: at(today, 10), end: at(today, 11), location: "Room 2.04", projectId: "prj_college", recurrence: { kind: "weekly", days: [1, 3] } });
  await createEvent({ title: "Training", start: at(addDays(today, 1), 18), end: at(addDays(today, 1), 19, 30), projectId: "prj_martial" });
  await createEvent({ title: "Swap planning call", start: at(addDays(today, 2), 13), end: at(addDays(today, 2), 13, 45), projectId: "prj_swapnserve" });
  await createEvent({ title: "Shift at Hurley Pop's", start: at(today, 15), end: at(today, 19), projectId: "prj_hurley" });
}
