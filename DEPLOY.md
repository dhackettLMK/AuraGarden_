# Deploying AuraGarden

It's already set up and live. This page says what's where and how to look after it.

## What's live

- **Code:** `main` on github.com/dhackettLMK/AuraGarden_. Every push to `main` deploys automatically.
- **Website:** Vercel project `auragarden` (team Nexeire), at **https://auragarden.vercel.app**. Laura's gift is `/laura`.
- **Database:** Supabase project `auragarden` (West EU, Ireland), set up from `supabase/setup.sql` and `supabase/migrations/`. Don't change it by hand: the app only calls its `ag_*` functions.
- **Environment variables** (Vercel → Settings → Environment Variables): `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and `CRON_SECRET`.

The daily keep-alive is in `vercel.json` (`/api/keepalive` at 06:17 UTC). It writes one row so Supabase never pauses the free project for inactivity, and clears out old deleted records. If the project ever does pause, its data is kept: open it in Supabase and tap **Restore**.

The functions are pinned to Dublin (`dub1`). If Vercel ever complains about the region on your plan, delete the `"regions"` line from `vercel.json` and push; everything still works.

## 1. Test it yourself first (on your phone)

Use a **private/incognito tab** so Laura's garden starts completely fresh on her own phone later.

1. Open `https://auragarden.vercel.app/laura`. Tap the box, watch it unwrap, tap **Start my garden**.
2. Go through the welcome cards and tick the first task. You should hear the ding and see **+25**.
3. On Settings → **My garden link**, the cloud icon at the top should say **Synced**.
4. On a laptop, open Settings → **Open on another device** on the phone and scan the QR code with the laptop's browser (or copy the link across). Tick something on one device and watch it appear on the other within a few seconds.
5. When you're happy, **Settings → Data → Delete this garden** clears your test garden everywhere.

If anything breaks, Vercel → your project → **Deployments** → pick the previous one → **Instant Rollback**.

## 2. Optional: your own domain

Vercel → your project → **Settings** → **Domains** → **Add**. Vercel shows one or two DNS records; add them at your domain registrar. HTTPS is automatic. (A domain costs money, so it's entirely your call.)

## 3. Print the gift card with the real link

The card's QR code points at `https://auragarden.vercel.app/laura`. If you add a custom domain, ask Claude Code (or run it yourself):

```
npm run build && npx next start -p 3100 &
SITE_URL=https://<your-real-url> npx tsx scripts/make-gift-card.tsx
```

That rewrites `gift/auragarden-card.pdf` (A6 with 3 mm bleed, front and back) and `gift/auragarden-card.png`.

---

**Environment variables at a glance**

| Variable | Value | Exposed to the browser |
| --- | --- | --- |
| `SUPABASE_URL` | Supabase Project URL | No |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (it can only call the `ag_*` functions) | No |
| `CRON_SECRET` | Any random string, 32+ characters | No |

With none of them set the site still works, device-only: Settings says "Sync is off on this site".
