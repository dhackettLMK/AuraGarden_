# AuraGarden build progress

A new session can resume from this file alone: read `CLAUDE.md`, `AURAGARDEN_BRIEF.md` and this file, then carry on from the next unfinished phase.

## Phase status

| # | Phase | Status |
| --- | --- | --- |
| 1 | Foundations | ✅ Done |
| 2 | Core editing | ⏳ Next |
| 3 | Aura and Oscar | ⬜ |
| 4 | The garden world | ⬜ |
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

## Placeholders

- (none yet)

## Open questions for David

- (none yet)

## How to run

```bash
npm install
npm run dev            # http://localhost:3000, no env vars needed
npm run check          # typecheck + lint + unit tests + build
npx next start -p 3100 & npx tsx scripts/screenshots.ts / /projects
```
