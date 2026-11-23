# AuraGarden build progress

A new session can resume from this file alone: read `CLAUDE.md`, `AURAGARDEN_BRIEF.md` and this file, then carry on from the next unfinished phase.

## Phase status

| # | Phase | Status |
| --- | --- | --- |
| 1 | Foundations | ✅ Done |
| 2 | Core editing | ✅ Done |
| 3 | Aura and Oscar | ✅ Done |
| 4 | The garden world | ✅ Done |
| 5 | Achievements | ✅ Done |
| 6 | Thoughts, People, Calendar | ✅ Done |
| 7 | Home and the unwrap | ✅ Done |
| 8 | Sync and PWA | ✅ Done |
| 9 | Polish | ✅ Done |
| 10 | Ship | ⏳ Next |

## Stack (versions installed and checked)

- Next.js 16.4.6 (App Router, Turbopack, React 19.3), TypeScript strict
- Tailwind CSS 4.3 (CSS-first `@theme` tokens in `app/globals.css`, `.dark` class variant)
- Radix primitives via the `radix-ui` package, restyled by hand (no default shadcn look)
- Motion 14 (`motion/react`), Dexie 4.4 + `dexie-react-hooks`, Zustand 5
- dnd-kit (core 6 / sortable 10), Tiptap 3, date-fns 4, chrono-node 2, ical.js 2, qrcode, @zxing/browser
- Fonts through `next/font/google`: Fraunces (SOFT + opsz axes), Plus Jakarta Sans, Caveat, Great Vibes
- Vitest 5 + Testing Library + fake-indexeddb; Playwright 1.63 (matches the preinstalled Chromium)

## Decisions

- **Cache Components off.** The scaffold enables `cacheComponents`; AuraGarden is a local-first client app whose pages are static shells reading IndexedDB, so it is turned off to keep date-dependent client rendering simple.
- **Service worker: hand-written, not Serwist.** The Serwist docs site was unreachable from the build environment, so rather than build from memory, phase 8 ships a small, readable `public/sw.js` (app-shell precache, network-first navigations, cache-first static assets). Swap for Serwist later if wanted.
- **Days end at 3 a.m.** in the garden's time zone everywhere, including what "today" means for due dates, so 1 a.m. still belongs to yesterday.
- **Brand logo tiles stay white in dark mode** (the brief says "raised surface in dark"), because the SETU slate mark disappears on a dark tile. Custom icons use the raised dark tile.
- **Phone header** shows the time-of-day greeting without her name (it doesn't fit beside the aura pill at 390 px); the name shows from `sm` up and in the Home hero.
- **"More" on phones** lives as a grid button at the right of the header (the tab bar's five slots are taken by the brief's tabs).
- **Logos** are copied byte-for-byte from `assets/logos/` to `public/brand/` by `scripts/copy-brand.mjs` on `predev`/`prebuild`; `public/brand/` is git-ignored.
- **All writes go through `lib/data/`** (`put`, `patch`, `softDelete`, `purge`), which stamps `updatedAt` and queues an outbox row for the SyncEngine in the same Dexie transaction.
- **Purge (delete forever)** sends a tombstone with `purged: true` so other devices delete it too.
- **Screenshots:** `scripts/screenshots.ts` (server on :3100) seeds a garden through `window.__ag.seedDemo` (a local-only helper) and shoots 390×844 and 1440×900 in light and dark into `screenshots/` (git-ignored).

- **Phase 2 editing model.** Tap a title to edit it in place; the chevron (or tapping the meta line) opens the full task sheet. Long-press (touch) or right-click opens the context menu (Radix ContextMenu supports long-press natively). Reordering uses a small grip handle (dnd-kit; touch drag after 180 ms hold, keyboard with Space + arrows), so it never fights the swipe-to-complete gesture.
- **Swipe** (touch only): right past 90 px completes; left reveals Schedule / Move / Delete.
- **Just-completed rows** are held in place for 1 s (`features/tasks/hold-store.ts`) before gliding into Done.
- **Empty-project suggestion chips** open quick add for that project rather than creating pre-filled tasks (brief: "never pre-filled data").
- **Bulk select** lives on /tasks (move, reschedule, tag, delete).
- **Trash** is a sheet (`features/settings/TrashSheet.tsx`) opened from Settings (wired in phase 7/9 Settings build).

- **Aura engine.** Pure rules in `lib/game/engine.ts` (streaks, boosts) are shared with the economy simulation. `lib/game/aura.ts#awardAura` is the one door; ids are deterministic (`task:<id>:complete:<day>`, `bonus:first:<day>`, `bonus:goal:<day>`, `bonus:deck:<day>`, `bonus:combo:<taskId>:<day>`, `subtask:<task>:<sub>:<day>`, `thought:<id>`, `contact:<id>`, `catchup:<contact>:<day>`). Re-ticking restores the voided record with its original multiplier.
- **Streak rules as built:** a day counts with ≥1 task/to-do; one missed day per Mon–Sun week is protected (moon); on a break the boost tier steps down one per missed day and her boost is max(current tier, decayed tier); today never breaks anything until it ends.
- **Combo:** 3 task completions inside a trailing 10 minutes, counted since the previous combo.
- **Clear the deck** counts tasks due today plus every My List item in the Today section (minimum 3).
- **Instant feedback** (ding, 15 ms haptic, leaf burst) fires synchronously in the tap handler; the flying number and Oscar follow when the award lands (~tens of ms). Moment cards (unlock, level, achievement, rank) wait until completions have been quiet for 1.6 s, so a run of ticks is never interrupted.
- **Accessible aura text:** the lavender→gold gradient is deepened for text on light backgrounds (`--aura-ink-*`) to pass AA; the bright gradient stays on fills.

- **Garden art** follows `docs/ART_STYLE.md`. Realm 1 items live in `components/garden/art/home.tsx`, project corners in `art/corners.tsx`, realms 2–3 in `art/realms.tsx`. Slots for both stages are in `components/garden/slots.ts` (wide 1600×1000, tall 800×1000).
- **Weather:** every 45 s there's a 30% chance of a 22 s drizzle followed by a 30 s rainbow (only once the rainbow is unlocked). `?time=` and `?season=` on /garden preview any sky or season.
- **Decor mode** lets her hide any unlock and move eight decor items (daisy, tulips, bench, sunflowers, fountain, well, cherry, gazebo) through five spare spots per layout.
- **Realm entries** (`realm-meadow` etc.) are ledger unlocks that trigger the full-screen sequence instead of a card; the 50,000 "gate" item is the last Realm 1 unlock.
- **Oscar in the garden** wanders between waypoints every 7 s, naps (sleepy pose), swims in the pool once it exists, sleeps at night; tapping pets him (hearts, `petCount` in settings).

- **Achievements: 195 built in** (`config/achievements.ts`) plus 6 per project she creates. Beyond the brief's families I added three with time-even thresholds so later years keep paying out: *Days in the garden* (active days), *Best day* (aura in one day) and *Project milestones* (tasks per starter project). Trophy boost with all of them is about ×3 rather than "about ×2.5".
- **Extra realm decor:** realms 2–10 each have their signature unlocks plus four small decor pieces (12 per realm instead of "about eight") to keep the later cadence up. Realms 2 and 3 have all twelve drawn.
- **Economy:** `docs/ECONOMY.md`. Every aura target (realm 2 ~month 1.3, realm 4 ~5.8, 1M ~7.9, 10M ~17, 100M ~40) is met and 1B / level 1,000 stay multi-year. Cadence passes on the default seed when level-ups count as "something new"; on other seeds month 1 and year 1 land a day or two over target, and with level-ups excluded later years have gaps of ~2 months. See open questions.
- **Rank achievements** celebrate with a rank card (belt icon for Martial Arts). Only the latest three trophies from one jump get a card; all are recorded and paid.
- **`scripts/verify.sh`** runs typecheck, lint, unit tests and build and fails fast; use it before every commit.

- **Calendar feed route** (`app/api/calendar/feed`): POST with the URL in the body (never a query string), `Authorization: Garden <key>`, http/https only, `webcal://` → `https://`, DNS checked on every connection (private/loopback/link-local/CGNAT refused, so DNS rebinding can't slip past), 10 s timeout, 5 MB cap, must parse as iCalendar, ±6 months of recurrences expanded with ical.js, 15-minute in-memory cache, rate limits per garden and per IP. `FEED_TEST_ALLOW` is a test-only exact-origin allowance for the e2e fixture feed; never set it on Vercel.
- **Calendar views:** Month, Week (desktop default), 3 days (phone default), Day, Agenda. Drag own events and time blocks to move (snaps to 15 min, across days) or resize from the bottom edge; feed events are read-only; due tasks are all-day chips you can tick; unscheduled tasks tray (drag onto a time on desktop, tap-then-tap on phones). Pull down to refresh feeds on phones.
- **Thought aura** is awarded once a new thought has at least a few characters of text (first 3 a day).
- **People one-tap actions:** call, text, WhatsApp (`wa.me`, Irish 08x numbers become 353…), email, Instagram, LinkedIn. Lucide no longer ships brand icons, so these use neutral icons.

- **Unwrap** (`features/unwrap/`): built from SVG and CSS 3D (Motion). `/laura?replay=1` replays the full version (Settings → Replay the unwrap); `/laura?skip=1` renders nothing (used by tests to load the dev hook). The tag line is Caveat, "David" writes itself with a clip-path reveal over 900 ms, then the heart draws and beats once. Reduced motion shows still frames with the signature already written.
- **Onboarding** runs once per garden created on this device (blank gardens too): Aura → Garden → Projects → first task (tick it) → save secret link → add to Home Screen; then `navigator.storage.persist()`. Joined gardens inherit `onboardedAt` from sync.
- **Home**: widgets can be hidden, shown and reordered (Edit Home). At ≥1280 px the agenda and garden window move to a right rail. Oscar (72 px) sits bottom-right; tap for a line.
- **Settings** is complete apart from server-side link rotation and delete, which arrive with sync in phase 8.

- **Sync store selection** (`lib/server/store.ts`): Supabase when `SUPABASE_URL` + `SUPABASE_SECRET_KEY` are set (production); a direct Postgres connection when `DATABASE_URL` is set (local dev and the sync e2e tests, same SQL functions); otherwise sync is off and Settings says so.
- **All server logic is SQL functions** in `supabase/migrations/0001_init.sql` (`supabase/setup.sql` is the same, ready to paste). RLS on, no policies, functions executable by `service_role` only.
- **Conflicts:** last write wins per record by `updated_at` (server clamps to now + 1 min), ties by device id; a local record still waiting in the outbox and newer than the server's copy is kept.
- **Sync cadence:** 2 s after edits settle, on focus, on `online`, and a 5 s poll while the page is visible (this is what makes two devices see each other's edits within 10 s).
- **Join:** `/join#k=…` reads the key from the hash and immediately strips it from the address bar and history; asks "Open Laura's garden on this device?" (name read from the synced settings record). If this device was told its garden has a new link, joining with the new key keeps local data and re-syncs instead of wiping.
- **Rotation:** `PATCH /api/garden` with the old key in the header and the new key in the body; the server stores only the new hash. Other devices get 401 → "This garden has a new link. Scan it to keep syncing." with a Scan button in Settings.
- **Calendar feeds with sync on** require the garden to be registered; the feed client registers first.
- **`GARDENS_PER_IP_PER_DAY`** (default 20, per brief) exists only so automated test servers can create many gardens; don't set it on Vercel.
- **PWA:** `app/manifest.ts`, Oscar icons from `scripts/make-icons.tsx` (rendered from the real Oscar component), hand-written `public/sw.js` (network-first pages with cached fallback, cache-first static assets, APIs never cached), registered in production only. iPhone: onboarding copies the link before install; the installed app with no garden leads with "Paste my garden link".
- **Running the sync tests locally:** start Postgres, apply `supabase/setup.sql`, run the server with `DATABASE_URL=… GARDENS_PER_IP_PER_DAY=100000`, then `SYNC_E2E=1 npx playwright test`.

- **Lighthouse (mobile, lab, local `next start`).** Entry pages with a fresh profile: `/` 97 / 100 / 100, `/laura` 97 / 100 / 100, `/join` 100 / 100 / 100 (Performance / Accessibility / Best Practices). App pages with a seeded garden (`scripts/seed-profile.ts`): Home 90, Calendar 100, People 100, Thoughts 99, Projects 99, My List 98, Garden 97, Tasks 97, Trophies 96 for Performance; Accessibility 100 and Best Practices 100 on all of them.
- **What got them there:** the garden app shell and Home load lazily and are prefetched in parallel with the IndexedDB read; heavy sheets (quick add with chrono, the Tiptap task editor, the Aura sheet, the task picker, onboarding, moment cards) mount on first open and are prefetched when idle; Home defers the garden window and trophy shelf until idle; `/laura` paints its arrival without waiting for JS (CSS fade-in); CSS is inlined; modern browserslist targets.
- **Accessibility details:** `ink-faint` and the gold aura text stop darkened to pass AA; text on calendar colours picks dark or light ink by contrast (`lib/color.ts`); accessible names include visible text; sortable lists keep `li` semantics (drag attributes live on an inner wrapper); headings in order; 24 px minimum targets.
- **Reduced motion / sound off** are covered by `e2e/motion-sound.spec.ts` (no flying number, no confetti canvas, every CSS animation and transition effectively instant; no oscillators or noise sources start with sound off).

## Placeholders

- **Swap 'N' Serve Cup logo.** David pasted a cleaner (non-distressed) version of the Cup logo in chat on 23 Nov. Pasted images can't be saved from chat, so the app uses the existing `assets/logos/swapnserve-cup-logo.png`. To swap it in, upload the new PNG over that path (same name). The build copies it to `public/brand/` and every screen picks it up.

- **Realms 4–10** launch as teaser cards (per brief); see `REALMS_TODO.md`.

## Open questions for David

- **Calendar how-tos are unverified.** The brief asks to check the Google / Apple / Outlook steps against their help pages before writing the copy, but support.google.com, support.apple.com and support.microsoft.com are not reachable from the build environment. The steps in `features/calendar/CalendarsSheet.tsx` are written conservatively from knowledge; please check them once on a real account (or a later session with those hosts allowed can verify).

- **Cadence target "something new every 2 weeks in years 2–5".** Met when level-ups count; strictly counting only unlocks/trophies/ranks, late years have up to ~2-month gaps because the brief's ladders are geometric. If you want it strict, the next lever is more small decor unlocks per later realm (cheap to add in `config/realms.ts`).

## How to run

```bash
npm install
npm run dev            # http://localhost:3000, no env vars needed
npm run check          # typecheck + lint + unit tests + build
npx next start -p 3100 & npx tsx scripts/screenshots.ts / /projects
```
