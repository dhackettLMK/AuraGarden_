import { expect, test } from "@playwright/test";

test("/laura plays the full unwrap on a first visit, starts her garden, and the short one on return", async ({ page }) => {
  await page.goto("/laura");
  await expect(page.getByRole("heading", { name: "Hey Laura," })).toBeVisible();
  await expect(page.getByText("For Laura, grow something great.")).toBeVisible();
  await expect(page.getByLabel("From David, with love")).toBeVisible();
  await page.getByRole("button", { name: "Tap to unwrap" }).click();
  await expect(page.getByText("Hiya Laura! I'm Oscar. Welcome to your AuraGarden.")).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole("button", { name: "Start my garden" })).toBeVisible({ timeout: 6000 });
  await page.getByRole("button", { name: "Start my garden" }).click();
  // Onboarding: Aura, Garden, Projects, then her first task.
  await expect(page.getByRole("heading", { name: "Every task earns aura" })).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("heading", { name: "Your projects are ready" })).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByLabel("Your first task").fill("Reply to Aoife");
  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("checkbox", { name: /Complete "Reply to Aoife"/ }).click();
  await expect(page.getByRole("heading", { name: "Your first aura!" })).toBeVisible();

  // Return visit: the short version, then Home.
  await page.goto("/laura");
  await expect(page.getByRole("heading", { name: /Welcome back, Laura/ })).toBeVisible();
  await expect(page).toHaveURL(/\/\?from=unwrap$/, { timeout: 5000 });
});

test("Skip appears after a second and jumps ahead", async ({ page }) => {
  await page.goto("/laura");
  await page.getByRole("button", { name: "Tap to unwrap" }).click();
  await page.getByRole("button", { name: "Skip" }).click({ timeout: 4000 });
  await expect(page.getByRole("button", { name: "Start my garden" })).toBeVisible();
});

test("/ never plays the unwrap and starts a blank garden", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Grow a garden/ })).toBeVisible();
  await expect(page.getByText("Tap to unwrap")).toHaveCount(0);
  await page.getByRole("button", { name: "Start a garden" }).click();
  await page.getByLabel("What should Oscar call you?").fill("Sam");
  await page.getByRole("button", { name: "Plant my garden" }).click();
  await expect(page.getByRole("heading", { name: "Every task earns aura" })).toBeVisible({ timeout: 8000 });
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  // A blank garden has no starter projects.
  await expect(page.getByRole("heading", { name: "Make it yours" })).toBeVisible();
});
