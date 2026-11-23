/**
 * Takes the per-phase design screenshots: 390×844 and 1440×900, light and dark.
 * Usage: npx tsx scripts/screenshots.ts [route ...]   (server must be running)
 * Env: BASE (default http://localhost:3100), OUT (default screenshots/), SEED=laura|blank
 */
import { chromium, type Page } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3100";
const OUT = process.env.OUT ?? "screenshots";
const routes = process.argv.slice(2).length ? process.argv.slice(2) : ["/"];
const sizes = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
];

async function seed(page: Page) {
  await page.goto(`${BASE}/laura?skip=1`);
  await page.evaluate((k) => ((window as unknown as { __seed: string }).__seed = k), process.env.SEED ?? "laura");
  await page.evaluate(async () => {
    const w = window as unknown as { __ag?: { seedDemo?: (k: string) => Promise<void> } };
    for (let i = 0; i < 50 && !w.__ag?.seedDemo; i++) await new Promise((r) => setTimeout(r, 100));
    await w.__ag?.seedDemo?.((window as unknown as { __seed: string }).__seed);
  }, undefined);
}

(async () => {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const scheme of ["light", "dark"] as const) {
    for (const size of sizes) {
      const ctx = await browser.newContext({ viewport: size, colorScheme: scheme, deviceScaleFactor: 1, reducedMotion: "reduce" });
      const page = await ctx.newPage();
      page.on("pageerror", (e) => console.error("pageerror", e.message));
      await seed(page);
      for (const route of routes) {
        const [path, action] = route.split("@");
        await page.goto(`${BASE}${path}`);
        await page.waitForTimeout(Number(process.env.WAIT ?? 900));
        if (action === "aura") {
          await page.locator("#aura-pill").click();
          await page.waitForTimeout(700);
        } else if (action === "add") {
          await page.getByRole("button", { name: "Quick add" }).first().click().catch(() => page.keyboard.press("n"));
          await page.waitForTimeout(500);
        }
        const file = `${OUT}/${(process.env.SEED ?? "laura")}-${route.replace(/[/?=&#]+/g, "_").replace(/^_|_$/g, "") || "home"}-${size.name}-${scheme}.png`;
        await page.screenshot({ path: file, fullPage: process.env.FULL === "1" });
        console.log(file);
      }
      await ctx.close();
    }
  }
  await browser.close();
})();
