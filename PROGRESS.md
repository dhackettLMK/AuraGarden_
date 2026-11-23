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
| 6 | Thoughts, People, Calendar | ⏳ Next |
| 7 | Home and the unwrap | ⬜ |
| 8 | Sync and PWA | ⬜ |
| 9 | Polish | ⬜ |
| 10 | Ship | ⬜ |

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

## Placeholders

- **Swap 'N' Serve Cup logo.** David pasted a cleaner (non-distressed) version of the Cup logo in chat on 23 Nov. Pasted images can't be saved from chat, so the app uses the existing `assets/logos/swapnserve-cup-logo.png`. To swap it in, upload the new PNG over that path (same name). The build copies it to `public/brand/` and every screen picks it up.

- **Realms 4–10** launch as teaser cards (per brief); see `REALMS_TODO.md`.

## Open questions for David

- **Cadence target "something new every 2 weeks in years 2–5".** Met when level-ups count; strictly counting only unlocks/trophies/ranks, late years have up to ~2-month gaps because the brief's ladders are geometric. If you want it strict, the next lever is more small decor unlocks per later realm (cheap to add in `config/realms.ts`).

## How to run

```bash
npm install
npm run dev            # http://localhost:3000, no env vars needed
npm run check          # typecheck + lint + unit tests + build
npx next start -p 3100 & npx tsx scripts/screenshots.ts / /projects
```
