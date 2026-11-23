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
  if (process.env.SEED === "blank") return;
  await page.evaluate(async () => {
    const w = window as unknown as { __ag?: { seedDemo?: (k: string) => Promise<void> } };
    for (let i = 0; i < 50 && !w.__ag?.seedDemo; i++) await new Promise((r) => setTimeout(r, 100));
    await w.__ag?.seedDemo?.(new URLSearchParams(location.search).get("demo") ?? "laura");
  });
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
        await page.goto(`${BASE}${route}`);
        await page.waitForTimeout(Number(process.env.WAIT ?? 900));
        const file = `${OUT}/${route.replace(/[/?=&#]+/g, "_").replace(/^_|_$/g, "") || "home"}-${size.name}-${scheme}.png`;
        await page.screenshot({ path: file, fullPage: process.env.FULL === "1" });
        console.log(file);
      }
      await ctx.close();
    }
  }
  await browser.close();
})();
