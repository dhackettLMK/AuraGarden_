import type { Page } from "@playwright/test";

/** Seed a garden on this device through the local-only dev hook. */
export async function seed(page: Page, kind: "laura" | "laura-empty" | "blank" = "laura-empty") {
  await page.goto("/laura?skip=1");
  await page.waitForFunction(() => !!(window as unknown as { __ag?: unknown }).__ag);
  await page.evaluate(async (k) => {
    await (window as unknown as { __ag: { seedDemo: (k: string) => Promise<void> } }).__ag.seedDemo(k);
  }, kind);
}

export async function dbCount(page: Page, table: string, filter = "r => !r.deletedAt") {
  return page.evaluate(
    async ([t, f]) => {
      const req = indexedDB.open("auragarden");
      const db: IDBDatabase = await new Promise((res, rej) => {
        req.onsuccess = () => res(req.result);
        req.onerror = () => rej(req.error);
      });
      const rows: unknown[] = await new Promise((res) => {
        const r = db.transaction(t, "readonly").objectStore(t).getAll();
        r.onsuccess = () => res(r.result);
      });
      db.close();
       
      return rows.filter(new Function(`return (${f})`)() as (r: unknown) => boolean).length;
    },
    [table, filter] as const,
  );
}

/** Dismiss moment cards until one with this heading shows (or none remain). */
export async function waitForCard(page: Page, heading?: string) {
  let quiet = 0;
  for (let i = 0; i < 30; i++) {
    const dialog = page.getByRole("dialog");
    if (await dialog.first().isVisible().catch(() => false)) {
      quiet = 0;
      if (heading && (await dialog.getByRole("heading", { name: heading }).count())) return;
      const btn = dialog.getByRole("button", { name: /^(Later|Lovely)$/ });
      if (await btn.first().isVisible().catch(() => false)) await btn.first().click();
    } else if (!heading && ++quiet >= 5) return;
    await page.waitForTimeout(800);
  }
}

/** The aura total, in full, from the header pill. */
export async function pillTotal(page: Page) {
  const text = (await page.locator("#aura-pill").textContent()) ?? "";
  return Number(text.match(/\(([\d,]+) in full\)/)![1].replace(/,/g, ""));
}
