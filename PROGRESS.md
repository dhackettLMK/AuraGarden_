# AuraGarden build progress

A new session can resume from this file alone: read `CLAUDE.md`, `AURAGARDEN_BRIEF.md` and this file, then carry on from the next unfinished phase.

## Phase status

| # | Phase | Status |
| --- | --- | --- |
| 1 | Foundations | ✅ Done |
| 2 | Core editing | ✅ Done |
| 3 | Aura and Oscar | ✅ Done |
| 4 | The garden world | ⏳ Next |
| 5 | Achievements | ⬜ |
| 6 | Thoughts, People, Calendar | ⬜ |
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

## Placeholders

- **Swap 'N' Serve Cup logo.** David pasted a cleaner (non-distressed) version of the Cup logo in chat on 23 Nov. Pasted images can't be saved from chat, so the app uses the existing `assets/logos/swapnserve-cup-logo.png`. To swap it in, upload the new PNG over that path (same name). The build copies it to `public/brand/` and every screen picks it up.

## Open questions for David

- (none yet)

## How to run

```bash
npm install
npm run dev            # http://localhost:3000, no env vars needed
npm run check          # typecheck + lint + unit tests + build
npx next start -p 3100 & npx tsx scripts/screenshots.ts / /projects
```
