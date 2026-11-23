import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

async function pillTotal(page: import("@playwright/test").Page) {
  const label = await page.locator("#aura-pill").getAttribute("aria-label");
  return Number(label!.match(/Aura ([\d,]+)/)![1].replace(/,/g, ""));
}

test.describe("aura", () => {
  test("ticking a task shows Oscar and +25 and raises the total by exactly 25 at ×1", async ({ page }) => {
    await seed(page, "laura");
    await page.goto("/tasks");
    // The first completion of the day also earns the +10 first-of-day bonus.
    await page.getByRole("checkbox", { name: /Complete "Ring Nana"/ }).click();
    await expect.poll(() => pillTotal(page)).toBe(35);
    await expect(page.getByRole("button", { name: "Oscar" })).toBeVisible();
    await expect(page.getByText("+25").first()).toBeVisible();
    // Dismiss the daisy unlock card when it arrives.
    await page.getByRole("button", { name: "Later" }).click();

    const before = await pillTotal(page);
    await page.getByRole("checkbox", { name: /Complete "Read chapter 4"/ }).click();
    await expect.poll(() => pillTotal(page)).toBe(before + 25);
  });

  test("a double tap awards once; un-ticking removes exactly that award; re-ticking restores it", async ({ page }) => {
    await seed(page, "laura");
    await page.goto("/tasks");
    const box = page.getByRole("checkbox", { name: /Complete "Buy oat milk"/ });
    await box.dblclick();
    await expect.poll(() => pillTotal(page)).toBe(35);
    await page.waitForTimeout(400);
    expect(await pillTotal(page)).toBe(35);
    await page.getByRole("button", { name: "Later" }).click();
    await page.getByRole("button", { name: "Done", exact: false }).filter({ hasText: "Done" }).last().click();
    await page.getByRole("checkbox", { name: /Mark "Buy oat milk" not done/ }).click();
    await expect.poll(() => pillTotal(page)).toBe(10);
    await page.getByRole("checkbox", { name: /Complete "Buy oat milk"/ }).click();
    await expect.poll(() => pillTotal(page)).toBe(35);
  });
});
