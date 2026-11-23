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
