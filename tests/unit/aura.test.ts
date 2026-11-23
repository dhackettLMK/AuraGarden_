import { beforeEach, describe, expect, it } from "vitest";
import { GardenDB, setDB, getDB } from "@/lib/db";
import { createGarden } from "@/lib/data/garden";
import { createTask } from "@/lib/data/tasks";
import { completeTask, uncompleteTask } from "@/lib/game/actions";
import { totalOf } from "@/lib/game/engine";

let n = 0;
beforeEach(async () => {
  setDB(new GardenDB(`test-${n++}`));
  await createGarden({ name: "Laura", giftSlug: "laura" });
});

// Totals exclude trophy bonuses, which arrive separately (and unmultiplied).
const total = async () => totalOf((await getDB().aura_ledger.toArray()).filter((r) => r.source !== "achievement" && r.source !== "rank"));
const taskAwards = async () => (await getDB().aura_ledger.toArray()).filter((r) => r.source === "task");

describe("awardAura through completeTask", () => {
  it("raises the total by exactly 25 (+10 first of the day) at ×1", async () => {
    const t = await createTask({ title: "Read chapter 4" });
    await completeTask(t);
    const awards = await taskAwards();
    expect(awards).toHaveLength(1);
    expect(awards[0].amount).toBe(25);
    expect(awards[0].multiplier).toBe(1);
    expect(await total()).toBe(35);
    const trophies = (await getDB().achievements.toArray()).map((a) => a.achievementId);
    expect(trophies).toContain("tasks-1");
  });

  it("a double tap awards once", async () => {
    const t = await createTask({ title: "Essay" });
    await Promise.all([completeTask(t), completeTask(t)]);
    expect((await taskAwards()).filter((r) => !r.voided)).toHaveLength(1);
  });

  it("un-ticking removes exactly that award and re-ticking restores the same record", async () => {
    const t = await createTask({ title: "Essay" });
    await completeTask(t);
    const after = await total();
    const fresh = (await getDB().tasks.get(t.id))!;
    await uncompleteTask(fresh);
    expect(await total()).toBe(after - 25);
    const again = (await getDB().tasks.get(t.id))!;
    await completeTask(again);
    expect(await total()).toBe(after);
    const awards = await taskAwards();
    expect(awards).toHaveLength(1);
    expect(awards[0].voided).toBe(false);
  });

  it("big tasks are worth 50", async () => {
    const t = await createTask({ title: "Dissertation chapter", big: true });
    await completeTask(t);
    expect((await taskAwards())[0].amount).toBe(50);
  });

  it("crossing 25, 100 and 250 unlocks the daisy, the sun and the tulips", async () => {
    for (let i = 0; i < 8; i++) {
      const t = await createTask({ title: `Task ${i}` });
      await completeTask(t);
    }
    const items = (await getDB().garden_items.toArray()).map((g) => g.itemId);
    expect(items).toEqual(expect.arrayContaining(["grass", "daisy", "sun", "tulips"]));
  });
});
