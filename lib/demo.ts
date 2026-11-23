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
