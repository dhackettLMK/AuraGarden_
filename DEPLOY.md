# Deploying AuraGarden

About 10 minutes, and you can do all of it on your phone. Everything else is already in the code.

You'll need free accounts at **github.com** (you have one), **supabase.com** and **vercel.com**. Sign in to both with GitHub to keep it simple.

---

## 0. Put the code on `main`

The build lives on the branch `claude/wizardly-gates-wo8a0v`.

1. Open **github.com/dhackettLMK/AuraGarden_**.
2. Tap **Pull requests** → **New pull request**.
3. Set **compare** to `claude/wizardly-gates-wo8a0v` (base stays `main`) → **Create pull request** → **Merge pull request** → **Confirm merge**.

## 1. Supabase (the sync database)

1. Go to **supabase.com** → **New project**.
2. Name: `auragarden`. Region: **West EU (Ireland)**. Pick any database password (you won't need it again; you can let Supabase generate one). Plan: **Free**. Tap **Create new project** and wait a minute.
3. In the left menu open **SQL Editor** → **New query**.
4. Open `supabase/setup.sql` from the repo on GitHub, tap the **Raw** button, select all and copy it. Paste it into the SQL Editor and tap **Run**. You should see "Success. No rows returned".
5. Open **Project Settings** → **API Keys** (or **Data API**):
   - Copy the **Project URL** (looks like `https://abcdefgh.supabase.co`).
   - Copy the **secret key** (starts with `sb_secret_`). If your project only shows the older keys, use the `service_role` key instead.

   Keep these two for step 2. Never paste the secret key anywhere public.

## 2. Vercel (the website)

1. Go to **vercel.com** → **Add New…** → **Project**.
2. Find **AuraGarden_** in the list and tap **Import**. (If it isn't listed, tap **Adjust GitHub App Permissions** and allow the repo.)
3. Leave the framework as **Next.js** and the build settings as they are.
4. Open **Environment Variables** and add these three:

   | Name | Value |
   | --- | --- |
   | `SUPABASE_URL` | the Project URL from step 1 |
   | `SUPABASE_SECRET_KEY` | the secret key from step 1 |
   | `CRON_SECRET` | any long random string, 32+ characters (mash the keyboard, or use a password generator) |

5. Tap **Deploy**. In a couple of minutes you get a link like `https://aura-garden.vercel.app`. From now on every push to `main` redeploys automatically.

The daily keep-alive is already set up in `vercel.json` (`/api/keepalive` at 06:17 UTC). It writes one row so Supabase never pauses the free project for inactivity. If a project ever does pause, its data is kept: open it in Supabase and tap **Restore**.

The functions are pinned to Dublin (`dub1`). If Vercel complains about the region on your plan, delete the `"regions"` line from `vercel.json` and redeploy; everything still works.

## 3. Test it yourself first (on your phone)

Use a **private/incognito tab** so Laura's garden starts completely fresh on her own phone later.

1. Open `<your-vercel-url>/laura`. Tap the box, watch it unwrap, tap **Start my garden**.
2. Go through the welcome cards and tick the first task. You should hear the ding and see **+25**.
3. On Settings → **My garden link**, the cloud icon at the top should say **Synced**.
4. On a laptop, open Settings → **Open on another device** on the phone and scan the QR code with the laptop's browser (or copy the link across). Tick something on one device and watch it appear on the other within a few seconds.
5. When you're happy, **Settings → Data → Delete this garden** clears your test garden everywhere.

If anything breaks, Vercel → your project → **Deployments** → pick the previous one → **Instant Rollback**.

## 4. Optional: your own domain

Vercel → your project → **Settings** → **Domains** → **Add**. Vercel shows one or two DNS records; add them at your domain registrar. HTTPS is automatic. (A domain costs money, so it's entirely your call.)

## 5. Print the gift card with the real link

The card's QR code currently points at `https://aura-garden.vercel.app/laura`. Once you know your real URL, ask Claude Code (or run it yourself):

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
| `SUPABASE_SECRET_KEY` | Supabase secret key | No |
| `CRON_SECRET` | Any random string, 32+ characters | No |

With none of them set the site still works, device-only: Settings says "Sync is off on this site".
