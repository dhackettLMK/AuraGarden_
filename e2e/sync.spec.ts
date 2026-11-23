import { expect, test, type Page } from "@playwright/test";
import { seed } from "./helpers";

async function gardenKey(page: Page) {
  return page.evaluate(
    () =>
      new Promise<string>((resolve) => {
        const req = indexedDB.open("auragarden");
        req.onsuccess = () => {
          const g = req.result.transaction("meta").objectStore("meta").get("gardenKey");
          g.onsuccess = () => resolve(g.result?.value);
        };
      }),
  );
}

async function ledgerFor(page: Page, title: string) {
  return page.evaluate(
    (t) =>
      new Promise<{ id: string; voided: boolean }[]>((resolve) => {
        const req = indexedDB.open("auragarden");
        req.onsuccess = () => {
          const tx = req.result.transaction(["tasks", "aura_ledger"]);
          const tr = tx.objectStore("tasks").getAll();
          tr.onsuccess = () => {
            const ids = new Set((tr.result as { id: string; title: string }[]).filter((x) => x.title === t).map((x) => x.id));
            const lr = tx.objectStore("aura_ledger").getAll();
            lr.onsuccess = () => resolve((lr.result as { id: string; source: string; refId: string; voided: boolean }[]).filter((r) => r.source === "task" && ids.has(r.refId)).map(({ id, voided }) => ({ id, voided })));
          };
        };
      }),
    title,
  );
}

test.describe("sync", () => {
  test.skip(!process.env.SYNC_E2E, "Needs the dev Postgres store (set SYNC_E2E=1 and DATABASE_URL on the server).");

  test("two devices joined to one garden see each other's edits within 10 s and award a task once", async ({ browser }) => {
    const a = await (await browser.newContext()).newPage();
    const b = await (await browser.newContext()).newPage();
    await seed(a, "laura-empty");
    await a.goto("/my-list");
    await expect(a.getByRole("img", { name: /Sync: Synced/ })).toBeVisible({ timeout: 15_000 });
    const key = await gardenKey(a);

    await b.goto(`/join#k=${key}`);
    await expect(b.getByRole("heading", { name: "Open this garden on this device?" })).toBeVisible();
    await b.getByRole("button", { name: "Open garden" }).click();
    await expect(b).toHaveURL(/\/$/);
    expect(b.url()).not.toContain(key);

    const add = a.getByLabel("Add to Today");
    await add.fill("Shared task");
    await add.press("Enter");
    await b.goto("/my-list");
    await expect(b.locator("[data-task-id]").filter({ hasText: "Shared task" })).toBeVisible({ timeout: 10_000 });

    // Both devices complete it at nearly the same moment.
    await Promise.all([a.getByRole("checkbox", { name: /Complete "Shared task"/ }).click(), b.getByRole("checkbox", { name: /Complete "Shared task"/ }).click()]);
    await a.waitForTimeout(7000);
    const la = await ledgerFor(a, "Shared task");
    const lb = await ledgerFor(b, "Shared task");
    expect(la.filter((r) => !r.voided)).toHaveLength(1);
    expect(lb.filter((r) => !r.voided)).toHaveLength(1);
    expect(la[0].id).toBe(lb[0].id);
  });

  test("a wrong key gets 401 and no request returns another garden's records", async ({ browser }) => {
    const a = await (await browser.newContext()).newPage();
    const c = await (await browser.newContext()).newPage();
    await seed(a, "laura-empty");
    await seed(c, "blank");
    await c.goto("/my-list");
    await c.getByLabel("Add to Today").fill("Private to C");
    await c.getByLabel("Add to Today").press("Enter");
    await expect(c.getByRole("img", { name: /Sync: Synced/ })).toBeVisible({ timeout: 15_000 });
    await a.goto("/my-list");
    await expect(a.getByRole("img", { name: /Sync: Synced/ })).toBeVisible({ timeout: 15_000 });

    const wrong = "A".repeat(43);
    const bad = await a.request.post("/api/sync", { headers: { Authorization: `Garden ${wrong}` }, data: { cursor: 0, changes: [] } });
    expect(bad.status()).toBe(401);
    const none = await a.request.post("/api/sync", { data: { cursor: 0, changes: [] } });
    expect(none.status()).toBe(401);

    const res = await a.request.post("/api/sync", { headers: { Authorization: `Garden ${await gardenKey(a)}` }, data: { cursor: 0, changes: [] } });
    const body = JSON.stringify(await res.json());
    expect(body).not.toContain("Private to C");
    expect(body).toContain("Today");
  });

  test("ticking a task offline works and syncs when the connection returns", async ({ browser }) => {
    const ctxA = await browser.newContext();
    const a = await ctxA.newPage();
    const b = await (await browser.newContext()).newPage();
    await seed(a, "laura-empty");
    await a.goto("/my-list");
    await a.getByLabel("Add to Today").fill("Offline tick");
    await a.getByLabel("Add to Today").press("Enter");
    await expect(a.getByRole("img", { name: /Sync: Synced/ })).toBeVisible({ timeout: 15_000 });
    await b.goto(`/join#k=${await gardenKey(a)}`);
    await b.getByRole("button", { name: "Open garden" }).click();
    await expect(b).toHaveURL(/\/$/, { timeout: 15_000 });
    await b.goto("/my-list");
    await expect(b.locator("[data-task-id]").filter({ hasText: "Offline tick" })).toBeVisible({ timeout: 10_000 });

    await ctxA.setOffline(true);
    await a.getByRole("checkbox", { name: /Complete "Offline tick"/ }).click();
    await expect(a.getByRole("img", { name: /Sync: Offline/ })).toBeVisible({ timeout: 10_000 });
    await expect.poll(async () => (await ledgerFor(a, "Offline tick")).length).toBe(1);
    await ctxA.setOffline(false);
    await expect.poll(async () => (await ledgerFor(b, "Offline tick")).length, { timeout: 15_000 }).toBe(1);
  });

  test("making a new link stops the old one and other devices are asked to rescan", async ({ browser }) => {
    const a = await (await browser.newContext()).newPage();
    const b = await (await browser.newContext()).newPage();
    await seed(a, "laura-empty");
    await a.goto("/settings");
    await expect(a.getByRole("img", { name: /Sync: Synced/ })).toBeVisible({ timeout: 15_000 });
    const oldKey = await gardenKey(a);
    await b.goto(`/join#k=${oldKey}`);
    await b.getByRole("button", { name: "Open garden" }).click();
    await expect(b).toHaveURL(/\/$/, { timeout: 15_000 });

    await a.getByRole("button", { name: "Make a new link" }).first().click();
    await a.getByRole("dialog").getByRole("button", { name: "Make a new link" }).click();
    await expect(a.getByText("New link made")).toBeVisible();
    expect(await gardenKey(a)).not.toBe(oldKey);

    const old = await a.request.post("/api/sync", { headers: { Authorization: `Garden ${oldKey}` }, data: { cursor: 0, changes: [] } });
    expect(old.status()).toBe(401);
    await b.goto("/settings");
    await expect(b.getByText("This garden has a new link. Scan it to keep syncing.")).toBeVisible({ timeout: 15_000 });
  });

  test("the keep-alive cron needs its secret", async ({ request }) => {
    expect((await request.get("/api/keepalive")).status()).toBe(401);
  });
});
