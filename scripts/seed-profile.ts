/**
 * Seeds a Chrome profile with a demo garden so Lighthouse can audit app pages.
 * Usage: npx tsx scripts/seed-profile.ts <profile-dir> [seed]   (server on :3100)
 * Then: lighthouse http://localhost:3100/ --disable-storage-reset --chrome-flags="--user-data-dir=<profile-dir>"
 */
import { chromium } from "playwright";

type Hooks = { __ag?: { seedDemo: (k: string) => Promise<void> } };

(async () => {
  const ctx = await chromium.launchPersistentContext(process.argv[2], { headless: true });
  const p = await ctx.newPage();
  await p.goto("http://localhost:3100/laura?skip=1");
  await p.waitForFunction(() => !!(window as unknown as Hooks).__ag);
  await p.evaluate((k) => (window as unknown as Hooks).__ag!.seedDemo(k), process.argv[3] ?? "laura-3000");
  await p.goto("http://localhost:3100/");
  await p.waitForTimeout(2500);
  await ctx.close();
})();
