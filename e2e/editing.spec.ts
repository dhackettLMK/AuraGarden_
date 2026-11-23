import { expect, test } from "@playwright/test";
import { seed } from "./helpers";

test.describe("core editing", () => {
  test("starter projects can be renamed, recoloured, re-iconed and deleted with undo", async ({ page }) => {
    await seed(page, "laura-empty");
    await page.goto("/projects/prj_hurley");
    await page.getByRole("button", { name: "Edit project" }).click();
    const dialog = page.getByRole("dialog");
    const name = dialog.getByLabel("Name", { exact: true });
    await name.fill("Hurley Pop's HQ");
    await dialog.getByRole("radio", { name: "#6C8EBF" }).click();
    await dialog.getByRole("radio", { name: "Emoji" }).click();
    await dialog.getByRole("button", { name: "🍿" }).click();
    await dialog.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hurley Pop's HQ");

    await page.getByRole("button", { name: "Edit project" }).click();
    await page.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Delete project" }).click();
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.getByText("Hurley Pop's HQ")).toHaveCount(1); // the toast
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByRole("link", { name: /Hurley Pop's HQ/ }).first()).toBeVisible();
  });

  test("My List items can be created, edited, reordered and deleted", async ({ page }) => {
    await seed(page, "laura-empty");
    await page.goto("/my-list");
    const add = page.getByLabel("Add to Today");
    await add.fill("Buy oat milk");
    await add.press("Enter");
    await add.fill("Ring Nana");
    await add.press("Enter");
    const rows = page.locator("[data-task-id]");
    await expect(rows).toHaveCount(2);
    // Newest lands on top.
    await expect(rows.first()).toContainText("Ring Nana");

    // Edit in place.
    await page.getByRole("button", { name: /Task title: Ring Nana/ }).click();
    await page.getByRole("textbox", { name: "Task title" }).fill("Ring Nana back");
    await page.getByRole("textbox", { name: "Task title" }).press("Enter");
    await expect(rows.first()).toContainText("Ring Nana back");

    // Reorder with the keyboard via the drag handle.
    const handle = page.getByRole("button", { name: "Reorder Buy oat milk" });
    await handle.focus();
    await page.keyboard.press("Space");
    await page.waitForTimeout(150);
    await page.keyboard.press("ArrowUp");
    await page.waitForTimeout(250);
    await page.keyboard.press("Space");
    await expect(rows.first()).toContainText("Buy oat milk");

    // Delete with undo via the detail sheet.
    await page.getByRole("button", { name: "Open details for Buy oat milk" }).first().click();
    await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
    await expect(rows).toHaveCount(1);
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(rows).toHaveCount(2);
  });

  test("quick add parses natural language into chips", async ({ page }) => {
    await seed(page, "laura-empty");
    await page.goto("/");
    await page.getByRole("button", { name: "Quick add" }).click();
    const input = page.getByRole("combobox", { name: "What's on your mind?" });
    await input.fill("essay draft fri 5pm #college !high");
    await expect(page.getByText("College Work").last()).toBeVisible();
    await expect(page.getByText("High priority")).toBeVisible();
    await input.press("Enter");
    await expect(page.getByText(/Added “essay draft/)).toBeVisible();
    await page.keyboard.press("Escape");
    await page.goto("/projects/prj_college");
    await expect(page.locator("[data-task-id]").filter({ hasText: "essay draft" })).toBeVisible();
  });
});
