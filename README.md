# AuraGarden

A gamified life OS, made by David Hackett as a gift for Laura Quinn. Every finished task earns aura from Oscar the Turtle, and aura grows a garden, then a whole world of realms.

- `/laura` is the gift: the unwrap, her name and her four projects.
- `/` lets anyone start their own blank garden.
- No accounts: each garden is private behind its own secret link (`/join#k=…`).

The full spec is `AURAGARDEN_BRIEF.md`; build notes and decisions are in `PROGRESS.md`; deploy steps are in `DEPLOY.md`; the handover is `HANDOVER.md`.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000. No environment variables are needed: without them the app runs device-only (sync off), which is enough to try everything.

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server (copies the logos into `public/brand/` first) |
| `npm run build` / `npm start` | Production build and server |
| `npm run typecheck` / `npm run lint` / `npm test` | TypeScript, ESLint, Vitest unit tests |
| `./scripts/verify.sh` | All of the above plus `next build`; fails fast |
| `npm run e2e` | Playwright end-to-end tests (run `next start -p 3100` first) |
| `npm run simulate` | The 5-year economy simulation (`--write` updates `docs/ECONOMY.md`) |
| `npx tsx scripts/screenshots.ts / /garden` | Design screenshots at 390×844 and 1440×900, light and dark |
| `npx tsx scripts/make-icons.tsx` | Re-renders the Oscar app icons |
| `SITE_URL=… npx tsx scripts/make-gift-card.tsx` | The printable gift card (PDF and PNG) in `gift/` |

## Environment variables

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Supabase Project URL. With the publishable key, turns sync on. |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key. Server only (no `NEXT_PUBLIC_`); it can only call the `ag_*` functions. |
| `CRON_SECRET` | Protects `/api/keepalive`; Vercel sends it to the daily cron automatically. |
| `DATABASE_URL` | Dev and tests only: a Postgres connection that runs the same SQL functions instead of Supabase. |
| `GARDENS_PER_IP_PER_DAY` | Tests only: raises the 20-a-day new-garden limit. |
| `FEED_TEST_ALLOW` | Tests only: lets the calendar feed route reach the e2e fixture server. |

Never commit `.env*` files; the repo is public.

## Supabase

The live database (project `auragarden`, Ireland) is already set up from `supabase/setup.sql` plus `supabase/migrations/`; don't change it from the app. Tables (`gardens`, `records`, `rate_limits`, `heartbeat`) have row-level security on, no policies and no grants. The server routes call six functions over RPC with the publishable key: `ag_create_garden`, `ag_check_garden`, `ag_sync`, `ag_rotate_garden`, `ag_delete_garden` and `ag_heartbeat` (brief 12.3). They take the raw garden key and keep only its SHA-256; creation and sync are rate-limited inside them. The browser never talks to Supabase: everything goes through `/api/garden` and `/api/sync`. Sync timestamps are epoch milliseconds in the app and `timestamptz` in the database; `/api/sync` converts between them.

To run the sync end-to-end tests locally, start any Postgres, create the roles `anon` and `authenticated`, apply `supabase/setup.sql` and the migrations, start the app with `DATABASE_URL=postgres://… GARDENS_PER_IP_PER_DAY=100000 npx next start -p 3100`, then `SYNC_E2E=1 npx playwright test`.

## Deploys

Vercel project `auragarden` builds from `main` on every push (production: https://auragarden.vercel.app). Functions run in Dublin (`dub1`), and `vercel.json` schedules the daily keep-alive. See `DEPLOY.md` for the click-by-click setup.

## How it's built

- **Next.js 16** (App Router, TypeScript strict), **Tailwind CSS 4** with CSS-variable theme tokens (`app/globals.css`), Radix primitives restyled by hand, **Motion** for animation, **canvas-confetti** for leaves and petals.
- **Local-first:** every read and write goes to IndexedDB through `lib/data/` (Dexie). Writes also land in an outbox that the `SyncEngine` (`lib/sync/engine.ts`) pushes to `/api/sync`; last write wins per record.
- **One door for aura:** `lib/game/aura.ts#awardAura` applies boosts and writes an idempotent ledger record with a deterministic id. The pure rules (streaks, boosts) are in `lib/game/engine.ts` and shared with the simulation.
- **Game numbers live in `config/`:** `realms.ts` (unlock ladder and realms), `levels.ts`, `aura.ts` (base aura and boosts), `achievements.ts`, `ranks.ts`, `tiers.ts`, `wardrobe.ts`, `oscar-lines.ts`, and `gifts.ts` for the `/laura` gift.
- **Art:** Oscar (`components/oscar/`) and the garden (`components/garden/`) are original SVG components; see `docs/ART_STYLE.md`. Logos come only from `assets/logos/`.
- **Sound:** synthesized with the Web Audio API (`lib/sound.ts`); no audio files.
- **PWA:** `app/manifest.ts` and a small hand-written service worker (`public/sw.js`).
