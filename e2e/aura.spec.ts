import { expect, test, type Page } from "@playwright/test";
import { seed, waitForCard } from "./helpers";

async function pillTotal(page: Page) {
  const label = await page.locator("#aura-pill").getAttribute("aria-label");
  return Number(label!.match(/Aura ([\d,]+)/)![1].replace(/,/g, ""));
}

/** Task awards in the ledger for a task title. */
async function taskAwards(page: Page, title: string) {
  return page.evaluate(
    (t) =>
      new Promise<{ amount: number; multiplier: number; voided: boolean }[]>((resolve) => {
        const req = indexedDB.open("auragarden");
        req.onsuccess = () => {
          const tx = req.result.transaction(["tasks", "aura_ledger"]);
          const tr = tx.objectStore("tasks").getAll();
          tr.onsuccess = () => {
            const ids = new Set((tr.result as { id: string; title: string }[]).filter((x) => x.title === t).map((x) => x.id));
            const lr = tx.objectStore("aura_ledger").getAll();
            lr.onsuccess = () => resolve((lr.result as { source: string; refId: string; amount: number; multiplier: number; voided: boolean }[]).filter((r) => r.source === "task" && ids.has(r.refId)).map(({ amount, multiplier, voided }) => ({ amount, multiplier, voided })));
          };
        };
      }),
    title,
  );
}

test.describe("aura", () => {
  test("ticking a task shows Oscar and +25, at ×1 the award is exactly 25", async ({ page }) => {
    // A fresh garden: no streak, realm 1, no trophies, so the boost is ×1.
    await seed(page, "laura-empty");
    await page.goto("/my-list");
    await page.getByLabel("Add to Today").fill("Ring Nana");
    await page.getByLabel("Add to Today").press("Enter");
    const before = await pillTotal(page);
    await page.getByRole("checkbox", { name: /Complete "Ring Nana"/ }).click();
    await expect(page.getByRole("button", { name: "Oscar" })).toBeVisible();
    await expect(page.getByText("+25").first()).toBeVisible();
    await expect.poll(() => taskAwards(page, "Ring Nana")).toEqual([{ amount: 25, multiplier: 1, voided: false }]);
    // The pill rises by the 25, plus the first-of-day bonus and any trophies it unlocked.
    await expect.poll(() => pillTotal(page)).toBeGreaterThanOrEqual(before + 35);
  });

  test("a double tap awards once; un-ticking removes exactly that award; re-ticking restores it", async ({ page }) => {
    await seed(page, "laura");
    await page.goto("/tasks");
    await waitForCard(page);
    await page.getByRole("checkbox", { name: /Complete "Buy oat milk"/ }).dblclick();
    await expect.poll(() => taskAwards(page, "Buy oat milk")).toHaveLength(1);
    await page.waitForTimeout(500);
    expect(await taskAwards(page, "Buy oat milk")).toHaveLength(1);
    await waitForCard(page);
    const award = (await taskAwards(page, "Buy oat milk"))[0];
    const total = await pillTotal(page);
    await page.getByRole("button", { name: "Done", exact: false }).filter({ hasText: "Done" }).last().click();
    await page.getByRole("checkbox", { name: /Mark "Buy oat milk" not done/ }).click();
    await expect.poll(() => pillTotal(page)).toBe(total - award.amount);
    await page.getByRole("checkbox", { name: /Complete "Buy oat milk"/ }).click();
    await expect.poll(() => pillTotal(page)).toBe(total);
    expect(await taskAwards(page, "Buy oat milk")).toEqual([{ ...award, voided: false }]);
  });
});
