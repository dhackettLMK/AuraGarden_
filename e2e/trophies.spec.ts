import { expect, test } from "@playwright/test";
import { seed, waitForCard } from "./helpers";

test("project rank-ups celebrate and the Martial Arts belt changes colour at 1K project aura", async ({ page }) => {
  await seed(page, "laura-empty");
  await page.goto("/projects");
  const beltFill = () => page.locator('a[href="/projects/prj_martial"] svg path').first().getAttribute("fill");
  const before = await beltFill();
  expect(before?.toUpperCase()).toBe("#F4F1EA"); // white belt
  await page.evaluate(() => (window as unknown as { __ag: { grant: (n: number, p: string) => Promise<void> } }).__ag.grant(1000, "prj_martial"));
  // The rank-up card arrives once completions go quiet.
  await waitForCard(page, "Yellow belt");
  await expect(page.getByRole("heading", { name: "Yellow belt" })).toBeVisible();
  await expect.poll(async () => (await beltFill())?.toUpperCase()).toBe("#F2C94C");
  await page.getByRole("button", { name: "Lovely" }).click();
  await page.goto("/trophies");
  await expect(page.getByText("Yellow belt").first()).toBeVisible();
});
