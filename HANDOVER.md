# AuraGarden handover

Hi David. AuraGarden is built, tested and ready to deploy. Here's everything you need.

## The live URL

Live. Every push to `main` deploys automatically. Laura's link is:

**`https://auragarden-nexeire.vercel.app/laura`**

and the custom domain too, if you add one. The code is on the branch `claude/wizardly-gates-wo8a0v`; `DEPLOY.md` step 0 merges it into `main`.

## How Laura starts

1. She opens `/laura` on her phone. The gift box unwraps, Oscar says hello, and she taps **Start my garden**.
2. Three short cards (Aura, Garden, Projects) end with her first task. She ticks it and gets her first +25 and her first daisy.
3. Oscar asks her to **save her secret garden link** (Save QR to Photos, Email it to myself, or Copy link). It's the only key to her garden: there are no passwords.
4. A short guide shows her how to **add AuraGarden to her Home Screen** (on iPhone it copies her link first; the installed app then offers "Paste my garden link").

You never need her link. Her garden is private to her.

## Opening her garden on a laptop

On her phone: **Settings → My garden link → Open on another device**. The QR code goes full screen; she scans it with the laptop's camera, or opens the link there, and taps **Open garden**. Both stay in sync within a few seconds.

## Linking her Google, Apple or Outlook calendar

**Calendar → the settings icon (Calendars and imports) → Add by link.** The sheet has a short how-to for each:

- **Google:** on a computer, Google Calendar → Settings → her calendar → *Integrate calendar* → copy the *Secret address in iCal format*.
- **Apple iCloud:** iPhone Calendar → Calendars → the info button → turn on *Public Calendar* → *Share Link* → Copy.
- **Outlook:** outlook.com → Settings → Calendar → Shared calendars → *Publish a calendar* → copy the ICS link.

She pastes the link and her events appear (repeating ones included), refreshed every 15 minutes. She can also upload an `.ics` file (a timetable export, say), and those events become hers to edit.

## What's still a placeholder, and what you still have to do

**You:**

- **Test it yourself first** in a private tab (`DEPLOY.md` step 1), then delete your test garden from Settings.
- **Print the gift card.** `gift/auragarden-card.pdf` and `.png` (A6, 3 mm bleed) have the QR pointing at `https://auragarden-nexeire.vercel.app/laura`. If you add a custom domain, re-run `SITE_URL=<url> npx tsx scripts/make-gift-card.tsx` (or ask Claude Code to).
- **Swap in the cleaner Swap 'N' Serve Cup logo** you pasted in chat: upload it over `assets/logos/swapnserve-cup-logo.png` (same name). Pasted images can't be saved from chat, so the app currently uses the distressed version already in the repo.
- **Check the calendar how-tos once** on a real account. The brief asked me to verify them against Google, Apple and Microsoft's help pages, but those sites aren't reachable from the build environment, so they're written carefully from knowledge.

**Placeholders by design:**

- **Realms 4–10** launch as teaser cards on the world map (misty, with their names and the aura needed). At six tasks a day she reaches realm 4 around month six. `REALMS_TODO.md` lists one future session per realm.
- **No gift note** is set (`config/gifts.ts` → `note`). Add one there and a little card rises out of the box with it.
- The **SETU logo files are small**. If an official SVG turns up, drop it in at the same paths.

**Things I couldn't test here:** a real iPhone Home Screen install (the manifest, icons and "Paste my garden link" flow are in place and tested in Chromium), and Lighthouse on the production URL (lab scores locally: 90+ Performance, 100 Accessibility and 100 Best Practices on every page measured).

## Where to tweak things

| File | What's in it |
| --- | --- |
| `config/gifts.ts` | Her name, the tag line, your signature, the optional note, the four starter projects |
| `config/realms.ts` | The garden unlock ladder and the ten realms |
| `config/achievements.ts` | All 195 trophies (plus 6 more for every project she creates) |
| `config/oscar-lines.ts` | Oscar's 112 lines |
| `config/aura.ts`, `config/levels.ts`, `config/ranks.ts` | Base aura, boosts, levels and titles, project ranks |
| `docs/ECONOMY.md` | The 5-year simulation of when everything lands (`npm run simulate -- --write` after changes) |

## Next sessions, most valuable first

1. **Realm art packs 4–10** (`REALMS_TODO.md`), one session per realm, well before she gets there.
2. **Push reminders** for the installed app (gentle nudges, a birthday surprise).
3. **Two-way Google Calendar sync** (needs a Google OAuth app).
4. **A rewards shelf** where she sets her own real-life treats at aura milestones.

## The numbers, briefly

At six tasks a day the simulation has realm 2 open in about 6 weeks, realm 4 around month 6, 1 million aura around month 8, 10 million around month 17 and 100 million around year 3.5. A billion aura and level 1,000 stay multi-year dreams. Aura never goes down: missed days only gently step her streak boost down, and Oscar keeps some of her glow for her.
