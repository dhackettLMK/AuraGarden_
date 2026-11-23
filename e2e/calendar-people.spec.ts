import { expect, test, type Page } from "@playwright/test";
import http from "node:http";
import { seed } from "./helpers";

function fmt(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** A fixture feed with a weekly recurring lecture starting this week. */
function fixtureICS() {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(10, 0, 0, 0);
  const end = new Date(monday.getTime() + 3_600_000);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AuraGarden//e2e//EN",
    "BEGIN:VEVENT",
    "UID:lecture@e2e",
    `DTSTART:${fmt(monday)}`,
    `DTEND:${fmt(end)}`,
    "RRULE:FREQ=DAILY;COUNT=10",
    "SUMMARY:Fixture lecture",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

let server: http.Server;
test.beforeAll(async () => {
  server = http.createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/calendar" });
    res.end(fixtureICS());
  });
  await new Promise<void>((r) => server.listen(4555, "127.0.0.1", r));
});
test.afterAll(() => new Promise<void>((r) => server.close(() => r())));

async function gardenKey(page: Page) {
  return page.evaluate(
    () =>
      new Promise<string>((resolve) => {
        const req = indexedDB.open("auragarden");
        req.onsuccess = () => {
          const g = req.result.transaction("meta").objectStore("meta").get("gardenKey");
          g.onsuccess = () => resolve(g.result.value);
        };
      }),
  );
}

test("a pasted iCal link shows its recurring events in Week view", async ({ page }) => {
  await seed(page, "laura-empty");
  await page.goto("/calendar");
  await page.getByRole("radio", { name: "Week" }).click();
  await page.getByRole("button", { name: "Calendars and imports" }).click();
  await page.getByLabel("Calendar link").fill("http://127.0.0.1:4555/feed.ics");
  await page.getByRole("button", { name: "Add calendar" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /^Fixture lecture/ }).first()).toBeVisible({ timeout: 15_000 });
  expect(await page.getByRole("button", { name: /^Fixture lecture/ }).count()).toBeGreaterThanOrEqual(5);
});

test("the feed route refuses loopback and the metadata address, and wrong keys", async ({ page }) => {
  await seed(page, "laura-empty");
  const key = await gardenKey(page);
  for (const url of ["http://127.0.0.1/cal.ics", "http://169.254.169.254/latest/meta-data"]) {
    const res = await page.request.post("/api/calendar/feed", { headers: { Authorization: `Garden ${key}` }, data: { url } });
    expect(res.status(), url).toBe(422);
  }
  const bad = await page.request.post("/api/calendar/feed", { headers: { Authorization: "Garden nope" }, data: { url: "https://example.com/a.ics" } });
  expect(bad.status()).toBe(401);
});

test("an .ics upload imports events and a .vcf upload imports contacts", async ({ page }) => {
  await seed(page, "laura-empty");
  await page.goto("/calendar");
  await page.getByRole("radio", { name: "Agenda" }).click();
  await page.getByRole("button", { name: "Calendars and imports" }).click();
  await page.locator('input[type=file][accept*=".ics"]').setInputFiles({ name: "timetable.ics", mimeType: "text/calendar", buffer: Buffer.from(fixtureICS().replace("Fixture lecture", "Timetable class")) });
  await expect(page.getByText(/Imported 10 events/)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Timetable class" }).first()).toBeVisible();

  await page.goto("/people");
  const vcf = "BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Aoife Byrne\r\nTEL:0871234567\r\nEND:VCARD\r\nBEGIN:VCARD\r\nVERSION:3.0\r\nFN:Ciara Walsh\r\nEND:VCARD\r\n";
  await page.locator('input[type=file][accept*=".vcf"]').setInputFiles({ name: "contacts.vcf", mimeType: "text/vcard", buffer: Buffer.from(vcf) });
  await expect(page.getByText("Imported 2 people")).toBeVisible();
  await expect(page.getByRole("link", { name: /Aoife Byrne/ })).toBeVisible();
});

test("thoughts, contacts and events can be created, edited and deleted", async ({ page }) => {
  await seed(page, "laura-empty");
  // Thought
  await page.goto("/thoughts");
  await page.getByRole("button", { name: /New thought/ }).first().click();
  await page.getByLabel("Title").fill("Swap ideas");
  await page.getByRole("textbox", { name: "Thought" }).click();
  await page.keyboard.type("A kids corner at the next swap");
  await page.getByLabel("Title").focus();
  await page.waitForTimeout(700);
  await page.getByRole("link", { name: "Thoughts" }).click();
  await expect(page.getByRole("link", { name: /Swap ideas/ })).toBeVisible();
  await page.getByRole("link", { name: /Swap ideas/ }).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("link", { name: /Swap ideas/ })).toHaveCount(0);

  // Contact
  await page.goto("/people");
  await page.getByRole("button", { name: /Add person/ }).first().click();
  await page.getByLabel("Name").fill("Niamh Kelly");
  await page.getByRole("button", { name: "Add person" }).last().click();
  await page.getByRole("link", { name: /Niamh Kelly/ }).click();
  await page.getByLabel("Organisation").fill("SETU");
  await page.getByLabel("Organisation").blur();
  await page.getByRole("button", { name: "Log a catch-up" }).click();
  await page.getByLabel("What you talked about").fill("Coffee after the lecture");
  await page.getByRole("button", { name: "Save catch-up" }).click();
  await expect(page.getByText("Coffee after the lecture")).toBeVisible();
  await page.getByRole("button", { name: /Delete Niamh/ }).click();
  await expect(page).toHaveURL(/\/people$/);
  await expect(page.getByRole("link", { name: /Niamh Kelly/ })).toHaveCount(0);

  // Event
  await page.goto("/calendar");
  await page.getByRole("radio", { name: "Agenda" }).click();
  await page.getByRole("button", { name: /New event/ }).click();
  await page.getByLabel("Title").fill("Grading");
  await page.getByRole("button", { name: "Add event" }).click();
  await page.getByRole("button", { name: "Grading" }).first().click();
  await page.getByLabel("Title").fill("Yellow belt grading");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("button", { name: "Yellow belt grading" }).first()).toBeVisible();
  await page.getByRole("button", { name: "Yellow belt grading" }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("button", { name: "Yellow belt grading" })).toHaveCount(0);
});
