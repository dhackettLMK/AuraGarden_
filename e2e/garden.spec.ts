import { expect, test, type Page } from "@playwright/test";
import { seed } from "./helpers";

async function grant(page: Page, n: number) {
  await page.evaluate((x) => (window as unknown as { __ag: { grant: (n: number) => Promise<void> } }).__ag.grant(x), n);
}

/** Dismiss moment cards until one with this heading shows (or none remain). */
async function waitForCard(page: Page, heading?: string) {
  for (let i = 0; i < 24; i++) {
    const dialog = page.getByRole("dialog");
    if (await dialog.first().isVisible().catch(() => false)) {
      if (heading && (await dialog.getByRole("heading", { name: heading }).count())) return;
      const btn = dialog.getByRole("button", { name: /^(Later|Lovely)$/ });
      if (await btn.first().isVisible().catch(() => false)) await btn.first().click();
    } else if (!heading && i > 3) return;
    await page.waitForTimeout(800);
  }
}

test.describe("garden unlocks", () => {
  test("crossing 25, 100 and 250 unlocks the daisy, the sun and the tulips, each with a reveal card", async ({ page }) => {
    await seed(page, "laura");
    await page.goto("/tasks");
    await page.getByRole("checkbox", { name: /Complete "Ring Nana"/ }).click(); // 35
    await waitForCard(page, "Your first daisy");
    await expect(page.getByRole("heading", { name: "Your first daisy" })).toBeVisible();
    await page.getByRole("button", { name: "Later" }).click();

    await grant(page, 70); // 105
    await waitForCard(page, "The sun breaks through");
    await expect(page.getByRole("heading", { name: "The sun breaks through" })).toBeVisible();
    await page.getByRole("button", { name: "Later" }).click();

    await grant(page, 150); // 255
    await waitForCard(page, "A tulip bed");
    await expect(page.getByRole("heading", { name: "A tulip bed" })).toBeVisible();
    await page.getByRole("button", { name: "See it" }).click();
    await expect(page).toHaveURL(/\/garden\?spot=tulips/);
    await expect(page.locator("g.garden-spot")).toHaveCount(1);
  });

  test("crossing 50,000 plays the new-realm sequence and doubles the realm boost", async ({ page }) => {
    await seed(page, "laura");
    await page.goto("/tasks");
    await grant(page, 49_990);
    await waitForCard(page);
    await page.getByRole("checkbox", { name: /Complete "Ring Nana"/ }).click();
    await waitForCard(page, "The Wildflower Meadow");
    await expect(page.getByRole("heading", { name: "The Wildflower Meadow" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("×2", { exact: true })).toBeVisible({ timeout: 8000 });
    await page.getByRole("button", { name: "Later" }).click();
    await page.locator("#aura-pill").click();
    await expect(page.getByText("2 realms open · The Wildflower Meadow")).toBeVisible();
  });
});
