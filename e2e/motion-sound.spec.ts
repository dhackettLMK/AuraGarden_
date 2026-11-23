import { expect, test } from "@playwright/test";
import { seed, waitForCard } from "./helpers";

// Count every oscillator and noise source the app starts.
const COUNT_SOUNDS = `
  (() => {
    window.__sounds = 0;
    const AC = window.AudioContext;
    if (!AC) return;
    const o = AC.prototype.createOscillator;
    AC.prototype.createOscillator = function () { window.__sounds++; return o.call(this); };
    const b = AC.prototype.createBufferSource;
    AC.prototype.createBufferSource = function () { window.__sounds++; return b.call(this); };
  })();
`;
const sounds = (page: import("@playwright/test").Page) => page.evaluate(() => (window as unknown as { __sounds: number }).__sounds);

test("with sound on the ding plays; with sound off nothing plays", async ({ page }) => {
  await page.addInitScript(COUNT_SOUNDS);
  await seed(page, "laura");
  await page.goto("/tasks");
  await waitForCard(page);
  await page.getByRole("checkbox", { name: /Complete "Ring Nana"/ }).click();
  await expect.poll(() => sounds(page)).toBeGreaterThan(0);

  await page.goto("/settings");
  const soundSwitch = page.getByRole("switch", { name: "Sound" });
  await soundSwitch.click();
  await expect(soundSwitch).toHaveAttribute("aria-checked", "false");
  await page.waitForTimeout(400);
  await page.goto("/tasks");
  await waitForCard(page);
  const before = await sounds(page);
  await page.getByRole("checkbox", { name: /Complete "Read chapter 4"/ }).click();
  await page.waitForTimeout(1200);
  expect(await sounds(page)).toBe(before);
});

test("with reduced motion nothing slides or bounces", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await seed(page, "laura");
  await page.goto("/tasks");
  await waitForCard(page);
  await page.getByRole("checkbox", { name: /Complete "Ring Nana"/ }).click();
  // No flying "+25" and no confetti canvas; the pill still updates.
  await page.waitForTimeout(150);
  await expect(page.locator(".aura-text-glow")).toHaveCount(0);
  await expect(page.locator("canvas")).toHaveCount(0);
  // Every CSS animation and transition is effectively instant.
  const slow = await page.evaluate(() =>
    [...document.querySelectorAll("*")].filter((el) => {
      const cs = getComputedStyle(el);
      const d = (v: string) => Math.max(...v.split(",").map((x) => parseFloat(x) || 0));
      return (cs.animationName !== "none" && d(cs.animationDuration) > 0.01) || d(cs.transitionDuration) > 0.01;
    }).length,
  );
  expect(slow).toBe(0);
  await ctx.close();
});
