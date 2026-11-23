# AuraGarden — Master Build Brief for Claude Code

A gift from David Hackett to Laura Quinn. Last updated 23 Nov 2026.

---

## 0. Before you start (for David)

Everything Claude Code needs is already in this repo (`dhackettLMK/AuraGarden_`): this brief, `CLAUDE.md`, the logos in `assets/logos/`, and the live database schema in `supabase/`. Hosting and the database are already set up, so every push to `main` goes live at **https://auragarden.vercel.app** and Laura's gift will be at **https://auragarden.vercel.app/laura**. Open the repo in Claude Code (web, desktop or phone) and paste the kickoff message.

- [x] Brief, `CLAUDE.md` and logos are in the repo
- [x] Gift tag decided: "For Laura, grow something great." signed "David" with a heart
- [x] No accounts: anyone can start a garden; Laura's is private through her secret garden link
- [x] Vercel project `auragarden` linked to this repo, with its environment variables set
- [x] Supabase project `auragarden` (Ireland) with the database from `supabase/setup.sql` applied and tested
- [ ] Optional: a custom domain later. Ask Claude in chat (where Vercel is connected) to add it

**Kickoff message to paste into Claude Code:**

```
Read CLAUDE.md and AURAGARDEN_BRIEF.md end to end before writing any code. They are the full spec for AuraGarden. Build it phase by phase as section 13 describes. Verify, commit and push every phase (pushing to main deploys it to auragarden.vercel.app), and keep PROGRESS.md up to date. Never block on missing inputs: use tasteful placeholders and list them at handover.
```

Claude Code sessions can time out on a build this size. If a session ends, start a new one with: `Read CLAUDE.md, AURAGARDEN_BRIEF.md and PROGRESS.md, then carry on from the next unfinished phase.`

---

## 1. Mission

You are building **AuraGarden**: a personal life operating system, made by David Hackett as a gift for his friend Laura Quinn. Every task she completes earns "aura" from Oscar the Turtle, and aura grows a garden, then a whole world of realms, that she unlocks piece by piece. Her aura total should climb from her first +25 into the millions and, one day, billions.

**Who it's for.** Laura studies at SETU and juggles four things: college work, Swap 'N' Serve (a youth-led clothing redistribution nonprofit in Limerick), Hurley Pop's, and martial arts training. She'll mostly use AuraGarden on her phone, sometimes on a laptop.

**Open to anyone, no accounts.** `/laura` is Laura's personal gift: the unwrap, her name and her four projects. `/` lets anyone start their own blank garden. There are no sign-ups or passwords: each garden is private through its own secret garden link.

**What it does.** Projects, each with its own tasks, notes and people. A separate personal to-do list. A thoughts journal. A contacts book. A calendar that imports her existing calendars. On top sits the game layer: aura, boosts, levels, streaks, 150+ achievements, a Trophy Room, and a garden world she grows and decorates. Everything is hers to add, edit, delete, reorder, rename and recolour.

**The feeling.** Opening it should feel like getting a small gift. Finishing a task should feel so good she wants to do the next one. It is calm, warm and a little playful, with an Irish, Gen Z sense of humour.

**The quality bar.** This is a gift, not an MVP. Polish beats feature count. If a feature can't be made delightful, ship a smaller version that is.

---

## 2. Non-negotiables and definition of done

These twelve rules override anything else in this brief if they ever conflict.

1. **The unwrap lives at `/laura` only.** It plays there, then reveals the app. No other route plays it.
2. **Everything is editable.** Every project, task, to-do, thought, contact, event, tag and colour can be created, edited, deleted (with undo) and reordered. Nothing she sees is hard-coded, including the four starter projects.
3. **Every completion celebrates.** Ticking any task or to-do triggers the aura moment in section 7: Oscar, "+25 aura", any boost multiplying it up, a ding, the counter rolling up. Feedback starts within 100 ms of the tap.
4. **Aura only goes up.** Missed days never cost aura, garden items, achievements or levels. Un-ticking a task reverses only that task's aura.
5. **Huge numbers stay smooth.** Aura, levels and boosts work correctly from 0 into the trillions, with readable formatting (section 7.6).
6. **No accounts, still private.** No sign-up, no passwords. A garden opens only with its secret garden key (link or QR code). The database is reachable only through the app's own server routes.
7. **Local-first.** The app works instantly and offline from on-device storage. With `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` set (they are, on Vercel) it syncs across devices; without them it runs device-only, so it can be previewed with zero setup.
8. **Mobile-first.** Flawless at 375–430 px wide, primary actions within thumb reach, installable to the home screen as a PWA.
9. **Accessible.** Keyboard navigable, visible focus rings, WCAG AA contrast, honours `prefers-reduced-motion`. Sound and haptics each have an off switch.
10. **Fast.** Lighthouse mobile scores of 90+ for Performance, Accessibility and Best Practices.
11. **Original art only.** Oscar, the garden world, and the hurley and martial-arts icons are original SVGs you draw. The SETU and Swap 'N' Serve logos come only from `assets/logos/`, never redrawn. Oscar must not resemble Duolingo's owl or any existing mascot.
12. **No filler.** No lorem ipsum anywhere. Every empty state has Oscar and a real line of copy.

**Done means:**

- [ ] Live at https://auragarden.vercel.app (and the custom domain, if David adds one), from a passing production build
- [ ] Laura can open `/laura` on her phone, unwrap, start her garden, add it to her home screen, save her secret link, and open the same garden on a laptop by scanning its QR code
- [ ] Every acceptance check in section 13 passes
- [ ] Typecheck, lint, unit tests and Playwright tests all pass
- [ ] The handover in section 15 is delivered

---

## 3. Tech stack and architecture

Next.js on Vercel, local-first on IndexedDB, with optional sync through a Supabase Postgres database that only the server talks to.

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js, latest stable, App Router, TypeScript strict | Vercel-native |
| Styling | Tailwind CSS, latest, with CSS-variable theme tokens | Light and "night garden" dark themes |
| Components | shadcn/ui on Radix primitives, fully restyled | Accessible base; must not look like default shadcn |
| Animation | Motion (formerly Framer Motion), `motion/react` | Springs, layout transitions, gestures |
| Celebrations | canvas-confetti with custom leaf and petal shapes | |
| Drag and drop | dnd-kit | Reorder lists, kanban, drag tasks onto the calendar |
| Local database | Dexie (IndexedDB) | The UI's single source of truth |
| State | Zustand for UI state; `dexie-react-hooks` live queries for data | |
| Sync store | Supabase Postgres, already live. Server routes call its `ag_*` SQL functions over RPC with the publishable key | No table access, no Supabase Auth, no Storage buckets (section 12.3) |
| Rich text | Tiptap | Thoughts and project notes |
| Dates | date-fns plus chrono-node | Natural-language input like "fri 5pm" |
| Calendar parsing | node-ical or ical.js with RRULE expansion, server-side | Section 6.7 |
| QR codes | `qrcode` to draw; `BarcodeDetector` with a `@zxing/browser` fallback to scan | Joining a garden (section 12) |
| Signature font | A flowing script such as Great Vibes via `@fontsource` | The "David" signature on the gift tag |
| Sound | Web Audio API, synthesized in code | No audio files to license |
| PWA | Web manifest plus service worker via Serwist or the current maintained equivalent | Home-screen install, offline shell |
| Tests | Vitest with Testing Library; Playwright for e2e and screenshots | |
| Hosting | Vercel project `auragarden`, already linked to this repo; functions in `dub1` (Dublin) | Section 14 |

**Architecture rules**

- **Check current docs first.** Before coding, read the docs for the versions you actually install (Next.js, Tailwind, Dexie, Motion, Supabase JS). These APIs change often; don't build from memory.
- **Local-first data.** Every read and write goes to Dexie through `lib/data/`. A separate `SyncEngine` (section 12) mirrors changes to the server when sync is configured. UI code never calls the network for its data.
- **Optimistic everywhere.** The tick, the celebration and the aura change happen instantly from local data.
- **One door for aura.** Every award goes through `awardAura(event)`, which applies boosts and writes an idempotent ledger record (sections 7 and 12).
- **Data-driven game config.** The unlock ladder, realms, levels, boosts, achievements, project ranks and Oscar's lines each live in their own file under `config/`, so David can tune numbers without touching components.
- **Gift config in one place.** `config/gifts.ts` holds the `/laura` gift: recipient name, gift-tag line, signature, optional note, starter projects. Keep it a map keyed by slug so another `/name` gift could be added later, but only build `laura`.
- **Folders.** `app/` routes, `components/ui`, `components/oscar`, `components/garden`, `features/<module>`, `lib/`, `config/`, `scripts/`, `supabase/`.
- **This repo is public.** Never commit secrets, `.env` files, keys or anyone's personal data.

---

## 4. Routes and the gift unwrap

`/laura` is the front door: the gift unwraps, Oscar says hello, and the box opens out into her garden and dashboard.

| Route | Shows |
| --- | --- |
| `/laura` | Gift unwrap. Then, on a device with no garden: "Start my garden" (creates Laura's garden: her name, her four projects) or "I already have a garden" (scan or paste her secret link). Onboarding on first ever start, then Home |
| `/` | Home if this device has a garden; otherwise a welcome page: "Start a garden" (asks for a name, no starter projects) or "Open my garden" (scan or paste a link). Never plays the unwrap |
| `/join` | Joins a garden from a secret link (`/join#k=<key>`), confirms "Open Laura's garden on this device?", then Home |
| `/projects`, `/projects/[id]` | Project list and project detail |
| `/tasks` | All tasks across projects |
| `/my-list` | Personal to-do list |
| `/thoughts`, `/thoughts/[id]` | Journal and single thought |
| `/people`, `/people/[id]` | Contacts and contact detail |
| `/calendar` | Calendar |
| `/garden` | The garden world |
| `/trophies` | Trophy Room (section 10) |
| `/settings` | Settings |
| `/api/garden` | Server: create a garden |
| `/api/sync` | Server: push and pull changes |
| `/api/calendar/feed` | Server: fetch, parse and cache a calendar feed |
| `/api/keepalive` | Server: daily cron ping (section 14) |

**The unwrap, beat by beat**

1. **Arrival (0–1.5 s).** A soft cream-to-blush gradient with drifting specks of light. In the display font, "Hey Laura," fades in, then "someone made you something." A gift box springs up into the centre: sage-green paper with a faint leaf pattern, a blush satin ribbon and a big bow. It breathes gently and wiggles now and then, as if something inside is moving. A paper tag swings from the bow. On it, "For Laura, grow something great." is set in Caveat; below it, "David" writes itself in a flowing script signature (a left-to-right mask reveal over about 900 ms), then a small hand-drawn heart draws itself beside the name and gives one soft beat. Below the box, "Tap to unwrap" pulses softly.
2. **The untie (about 0.6 s, on tap).** The bow loops loosen and slide off both sides, and the ribbon slips away with a satin whoosh. One light haptic tick. She can also drag the ribbon end down to pull it loose.
3. **Lid off (about 0.5 s).** The lid pops up with spring overshoot, tilts and flies off the top of the screen. Warm light rays spill out, and glowing aura particles float upward.
4. **Oscar (about 1.2 s).** Oscar pokes his head out, blinks, climbs onto the rim and waves. Speech bubble: "Hiya Laura! I'm Oscar. Welcome to your AuraGarden." The chime plays, the same sound family as the aura ding, so she learns it. If a note is set in `config/gifts.ts`, a small card rises out of the box with it and an "Open my garden" button; the reveal waits for that tap. (No note is set right now.)
5. **The reveal (about 1.2 s).** The four box walls fold outward flat like opened paper, and the paper becomes grass. The view pulls back as the garden ground spreads and the app assembles around it: header slides down, cards stagger in 40 ms apart, the bottom nav rises. Oscar hops to the corner where he lives from now on. Use shared-layout transitions: no hard cut.
6. **Then.** On a device with no garden: "Start my garden" or "I already have a garden". On first ever start: three onboarding cards (Aura, Garden, Projects) ending on her first task, then the two safety steps in section 12.4: save her secret link and add AuraGarden to her home screen.

**Unwrap rules**

- After the first tap, the full sequence runs 4–6 s. A "Skip" link appears top-right after 1 s.
- Return visits to `/laura` on a device that already has her garden get a 1.5 s version: a small box unties itself beside "Welcome back, Laura" and a time-of-day greeting, then Home. Settings has "Replay the unwrap" for the full version.
- Reduced motion: crossfades and still frames, same words, same signature, already written.
- Sound plays only after the first tap, which also unlocks the AudioContext for the session.
- Build the box from SVG and CSS 3D transforms, not video. Hold 60 fps on a mid-range phone; test under 4x CPU throttling.
- The unwrap reveals nothing private, so it plays before any garden is opened.

---

## 5. Navigation and layout

Phones get a bottom tab bar with a centre quick-add button; desktops get a sidebar with her projects listed by icon. A header with her aura total sits on every screen.

- **Header (every screen).** Page title or time-of-day greeting on the left. On the right, the aura pill: a small glowing orb plus her total (formatted as in section 7.6) and her level, with her streak beside it as a little sun with a number. A tiny cloud icon shows sync status. Tapping the pill opens the Aura sheet: full total, level and progress to the next, active boosts with a breakdown, progress to the next unlock, today's aura, and her aura history.
- **Phone, under 768 px.** Bottom tab bar: Home, Projects, a raised centre **+** for quick add, Calendar, Garden. Everything else (My List, Tasks, Thoughts, People, Trophies, Settings) sits in a "More" sheet and as shortcuts on Home. In Settings she can choose which four tabs appear.
- **Desktop, 1024 px and up.** Left sidebar: Home, My List, Tasks, Calendar, Thoughts, People, Garden, Trophies. Below that, a Projects group listing each project with its logo or icon and rank badge, plus "New project". Settings at the bottom, Oscar peeking over the sidebar's bottom edge. The sidebar collapses to an icon rail. On Home at 1280 px and up, a right rail shows the agenda and a garden preview.
- **Tablet.** Icon rail plus content.
- **Safe areas.** Respect `env(safe-area-inset-*)` so nothing hides under the notch or the home indicator.
- **Gestures (phone).** Swipe a task right to complete it, left for Schedule / Move / Delete. Long-press to reorder or open the context menu. Pull to refresh on Calendar.
- **Keyboard (desktop).** Cmd/Ctrl+K opens quick add and search. `N` adds a task. `G` then `H`, `P`, `C` or `G` jumps to Home, Projects, Calendar or Garden. `?` lists shortcuts.
- **Transitions and loading.** 200 ms fade-and-slide between pages. Skeletons shaped like the content they replace; no spinner for anything under 300 ms.

---

## 6. Feature specs

Nine modules make up the app; every one follows the editing rules at the end of this section.

### 6.1 Home (Today)

- Time-of-day greeting ("Good morning, Laura"), the date, and Oscar with his line of the day.
- **Daily aura ring:** completions today against her daily goal (default 6 tasks; the ring counts tasks, not aura, so boosts don't make it trivial). Filling it triggers the daily-goal celebration.
- **Today:** one merged agenda of calendar events as a timeline, tasks due today, and My List items marked for today. Overdue items sit in a soft "Still waiting for you" group: never red, never alarming.
- **Projects strip:** horizontal cards with icon, rank badge, name, open-task count, a small progress ring and aura earned this week.
- **Garden window:** a small live view of her garden plus the next unlock ("2,400 aura to butterflies").
- **Trophy shelf:** her three latest achievements and the one she's closest to ("8 more tasks for Gold").
- **Quick capture:** "What's on your mind?" saves as a task, to-do or thought.
- **People this week:** upcoming birthdays and catch-ups due.
- **Edit Home** mode lets her hide, show and reorder every widget.

### 6.2 Projects

Gardens started from `/laura` are seeded with these four. Gardens started from `/` start empty. All projects are fully editable and deletable.

| Project | Icon | Default colour |
| --- | --- | --- |
| College Work | `assets/logos/setu-logo.png` in a white tile; `assets/logos/setu-mark.png` (the emblem alone) anywhere under 48 px | Slate #445463, from the logo |
| Swap 'N' Serve | `assets/logos/swapnserve-smiley.png`. The full `swapnserve-cup-logo.png` has white lettering, so show it only on a dark tile in the project header | Sunshine yellow #F6C828, from the smiley |
| Hurley Pop's | Original SVG: a hurley crossed with a sliotar | Warm amber #E3A04A |
| Martial Arts Training | Original SVG: a tied martial-arts belt knot, coloured by her current belt rank (section 10.3) | Crimson #C23B3B |

- **Logos** sit in a soft rounded tile (white in light mode, raised surface in dark) so any logo looks right. Copy them into `public/brand/` at build time and serve them through `next/image`.
- **Projects page:** card grid, drag to reorder, archive, and a picker for colour and icon (emoji, icon library, uploaded image, or the built-in custom icons). Uploaded images are resized on the device to 256 px WebP (50 KB max) and stored in the record.
- **Project detail tabs:** Overview (description, rank and progress to the next rank, next up, aura earned, pinned notes), Tasks (list or board), Notes (linked thoughts), People (linked contacts), Calendar (this project's events and due dates).
- **Sections inside a project**, like "Assignments" and "Exams", which she creates, renames and reorders.
- **Empty projects** show Oscar with suggestion chips she can tap or ignore, e.g. College Work: "Add an assignment"; Martial Arts Training: "Log a training session". Suggestions are chips, never pre-filled data.

### 6.3 Tasks

- **Fields:** title, rich notes, project (none means My List), section, status (To do, Doing, Done), priority (none to high), due date with optional time, time block (start and end), recurrence (daily, weekdays, chosen weekdays, monthly, custom RRULE), tags, a "Big task" toggle, and subtasks.
- **Views:** list grouped by Overdue, Today, Tomorrow, This week, Later, No date; kanban board; calendar. Filter by project, tag, priority and status, and save filters.
- **Done** tasks collapse into a "Done" group with their completion date. Completing a recurring task creates the next one.
- **Natural-language add:** "essay draft fri 5pm #college !high" becomes chips for date, project and priority that she confirms before saving.
- **Bulk select** to move, reschedule, tag or delete.

### 6.4 My List

Her personal to-do list, separate from projects, and as fast as a paper list. Starts with two sections, "Today" and "Someday"; she can add, rename and reorder sections and drag items between them. Any item can be promoted into a project task. Same aura rules as tasks.

### 6.5 Thoughts

A journal and brain dump. Cards in a list or masonry grid, a Tiptap editor (headings, lists, checkboxes, links, highlight), tags, project links, pinning and full-text search. An optional mood picker uses five weather icons from cloudy to sunny. Oscar offers an optional daily prompt, e.g. "What made you smile today?"

### 6.6 People

- **Fields:** name, photo (resized on the device to 256 px WebP, or a coloured initials avatar), phone, email, Instagram, LinkedIn, organisation, role, how they met, birthday, tags, notes, linked projects, an optional "keep in touch every N days", and last contacted.
- **One-tap actions:** call, text, WhatsApp (`wa.me` link), email, open Instagram.
- **Log a catch-up:** records the date and a note, and updates last contacted.
- **Lists:** All, by tag, by project, Due a catch-up, Upcoming birthdays. Search across all fields.
- **Import and export** `.vcf` files so she can bring contacts over from her phone.

### 6.7 Calendar

- **Views:** Month, Week, Day and Agenda. Defaults: Week on desktop, 3-day on phone. Colour-coded by calendar or project, with a "now" line.
- **Import by link (the main path).** She pastes an iCal link (`webcal://` or `https://`). In-app help shows three short how-tos: Google Calendar (calendar settings, "Secret address in iCal format"), Apple iCloud (share as a public calendar, copy link), Outlook (publish calendar, copy the ICS link). Verify those steps against each provider's help pages before writing the copy.
- **How the feed works:** `/api/calendar/feed` converts `webcal://` to `https://`, fetches, parses, expands recurrences across a window of six months either side, and caches for 15 minutes, with the safety rules in section 12.5. Imported events are read-only and wear the subscription's colour. She can rename, recolour, hide or remove any subscription.
- **Import by file:** upload an `.ics` once (a timetable export, say); those events become hers and editable. Parse it on the device.
- **Her own events:** create, edit, delete, drag to move or resize, repeat, link to a project.
- **Tasks on the calendar:** due tasks show as all-day chips. A side tray of unscheduled tasks lets her drag one onto a time slot to block out time. Completing a task from the calendar celebrates too.
- **Stretch goal only:** two-way Google Calendar sync. It needs a Google OAuth app, so build it only after everything else passes.

### 6.8 Settings

- **Profile:** display name ("Laura" for her gift garden) and avatar; her birthday (optional, used for a secret achievement and a birthday surprise in the garden).
- **My garden link:** the secret link as a QR code and text, with "Copy link", "Save QR to Photos", "Email it to myself" (a `mailto:` link, no server email), "Open on another device" (shows the QR full-screen), "Make a new link" (rotates the key; old links stop working), and sync status ("Synced 2 min ago").
- **Aura:** daily goal, sound on or off with volume, haptics on or off, celebration style (Full, Calm, Minimal), number style (Short like 1.2M, or Full).
- **Appearance:** Light, Night garden or Auto; accent colour; reduce-motion override.
- **Make it hers:** choose the phone tabs, reorder the sidebar, rename modules ("Thoughts" to "Brain dump", say), manage tags.
- **Calendars:** manage subscriptions.
- **Data:** export everything as JSON, import JSON, export contacts as `.vcf`, open Trash, replay the unwrap, "Delete this garden" (two-step confirm; wipes it everywhere).
- **About:** "Made for Laura by David" with the gift tag and the signature.

### 6.9 Quick add and search

The **+** button or Cmd/Ctrl+K opens one sheet: a single input with natural-language parsing, a type toggle (Task, To-do, Thought, Event, Person), and project and date chips. Enter saves and keeps the sheet open for rapid entry. The same sheet searches everything, with keyboard navigation and recent items.

### Editing rules for every module

- Tap any text to edit it in place. Every list can be reordered by drag.
- Delete is a soft delete with a 6-second Undo toast; Trash keeps items for 30 days.
- Ask for confirmation only on destructive bulk actions. Deleting a project asks whether to move its tasks to My List or delete them too.

---

## 7. The aura system

Every completed task earns +25 base aura, and boosts that grow as she keeps going multiply it, so her total climbs from hundreds into the millions and, over years, billions. Aura is a lifetime total: never spent, never lost.

### 7.1 Base aura

| Action | Base aura | Limit |
| --- | --- | --- |
| Complete a task or My List item | +25 | Every completion |
| Complete a "Big task" | +50 | Replaces the +25 |
| Complete a subtask | +10 | Every completion |
| First completion of the day | +10 bonus | Once a day |
| Combo: 3 different tasks within 10 minutes | +15 bonus | Each combo |
| Hit the daily goal | +50 bonus | Once a day |
| Clear the deck: every task due today and every Today item done (at least 3) | +100 bonus | Once a day |
| Write a thought | +5 | First 3 a day |
| Log a catch-up with someone | +10 | Once per person per day |
| Add a contact | +5 | First 5 a day |

Achievements pay their own one-time bonuses (section 10.1); those are not multiplied.

### 7.2 Boosts

Every base award is multiplied by her total boost: **streak boost × realm boost × trophy boost**, rounded to a whole number.

| Boost | How it grows | Range |
| --- | --- | --- |
| Streak boost | 3 days ×1.1 · 7 ×1.25 · 14 ×1.5 · 30 ×2 · 60 ×2.5 · 100 ×3 · 200 ×4 · 365 ×5 · 730 ×7 · 1,000 ×10 | ×1 to ×10 |
| Realm boost | ×2 for every garden realm she opens beyond the first (section 9.3), permanently | ×1 to ×512 |
| Trophy boost | +1% for every achievement earned, permanently | ×1 to about ×2.5 |

- When a streak ends, the streak boost steps down one tier per missed day instead of resetting, so a bad week never wipes her glow. Her boost is the higher of the tier her current streak has earned and that decaying tier. Oscar: "I kept some of your glow for you."
- At full strength the boosts multiply a single task's +25 into hundreds of thousands. That is the point: the numbers should get gloriously silly.

### 7.3 Levels

- Level `n` needs a lifetime total of `50 × (n − 1)^2.5` aura: level 2 at 50, level 10 at about 12,000, level 50 at about 840,000, level 100 at about 4.9 million, level 500 at about 278 million, and **level 1,000 at about 1.6 billion**. Levels never cap.
- Titles change at milestones: 1 Seedling · 5 Sprout · 10 Budding · 20 Blooming · 30 Glowing · 40 Radiant · 50 Main Character · 75 Aura Farmer · 100 Garden Legend · 150 Celestial · 200 Aurora · 300 Mythic · 500 Cosmic · 750 Infinite · 1,000 Aura Deity.
- Several levels gained at once celebrate as one ("+3 levels!").

### 7.4 Rules

- **Ledger.** Every award is a record: base, multiplier, amount, reason, source, day. The total is the sum of non-voided records. Each record's id is deterministic (for example `task:<id>:complete:<day>`), so double taps, retries and two devices awarding the same thing never double-award.
- **Undo.** Un-ticking a task voids that task's base award only. Re-ticking it the same day restores the same record; it never stacks. Bonuses already earned that day stay.
- **Deleting** a completed task keeps its aura. She earned it.
- **Streaks.** A day counts if she completes at least one task or to-do. Days end at 3 a.m. in her time zone (default Europe/Dublin), so late-night work counts for the day it belongs to. One rest day a week protects the streak automatically, shown as a little moon. Her best streak stays on record.
- **No guilt, ever.** No shaming copy, no streak-loss drama, no aura decay. After midnight, Oscar nudges her towards sleep instead of more tasks.

### 7.5 The +25 moment

This is the most important interaction in the app. Make it feel like popping bubble wrap.

1. **0 ms.** The checkbox fills sage and a checkmark draws itself (180 ms stroke animation). Six to eight tiny leaves burst from it. The ding plays. Phones that support it give a 15 ms haptic tap.
2. **50–650 ms.** "+25" in the aura gradient rises from the checkbox. If her boost is above ×1, a "×3.4" badge clicks in beside it and the number rolls up to the boosted amount ("+85") like a slot machine. Then it arcs into the header aura pill, shrinking as it flies. The pill glows and the total rolls up like an odometer (400 ms).
3. **150 ms.** Oscar springs up from the bottom-right corner, above the tab bar, holding a glowing aura orb. His speech bubble shows the amount plus a line that fits the moment (section 8). He stays 2.2 s, then slides away. Tapping him makes him spin. He never blocks the rest of the screen.
4. **300 ms.** The task text gets a soft hand-drawn strikethrough. After 600 ms more, the row glides into the Done group.

**Stacking.** Completions within 1.5 s of each other merge into one Oscar whose number climbs. Each ding in the run pitches up a semitone, up to five steps. A combo adds a "Combo! +15" badge.

**Bigger moments escalate:**

- **Daily goal:** leaves and petals fall from the top of the screen, Oscar does a little shell shimmy, and a fuller chime plays.
- **Unlock:** the screen dims softly and a reveal card appears: "New in your garden: Butterflies", with "See it" (opens the garden with the item spotlit) and "Later".
- **Achievement:** a badge card flips in, in its tier colour, with its bonus aura.
- **Level up:** a card with the new level, title and badge, plus the arpeggio.
- **New realm:** the biggest moment in the app. A full-screen sequence: the garden zooms out to the world map, mist rolls back from the new realm, its name writes itself across the sky, the boost doubles on screen ("Realm boost ×4 → ×8"), and Oscar arrives wearing something new.
- The **celebration style** setting scales all of this: Full, Calm (no confetti, smaller Oscar) or Minimal (counter and ding only).

### 7.6 Big numbers

- Store aura as a JavaScript number (safe to 9 quadrillion); round every award to a whole number.
- Below 1,000,000, show the full number with commas ("812,450"). From there, show short form with up to two decimals: 1.23M, 45.6M, 1.20B, 3.4T. Tap any short number to see it in full. Settings can switch to always-full.
- Odometer animations must stay smooth when a single award adds hundreds of thousands.

### 7.7 Sound design

Synthesize every sound with the Web Audio API: gentle and warm, never shrill.

- **Ding:** two sine partials (C6 at 1,046.5 Hz and G6 at 1,568 Hz) over a soft triangle an octave below. 5 ms attack, 600 ms exponential decay, a light shimmer on top.
- **Unlock:** a rising four-note arpeggio (C, E, G, C) 90 ms apart, with a sparkle tail.
- **Level up:** the arpeggio, then a major chord that swells over 1.5 s.
- **New realm:** a slow, layered pad that swells under the reveal, with the arpeggio on top.
- **Unwrap:** paper rustle (band-passed noise bursts), a ribbon whoosh (noise sweep), then the ding.
- Create the AudioContext on the first user gesture and keep it warm so the ding lands within 30 ms of the tap. Never play sound on page load. Master volume and mute live in Settings.

---

## 8. Oscar the Turtle

Oscar is a small, round, sage-green turtle with big kind eyes who cheers Laura on and hands out every aura point. He is an original character: draw him from this spec, not from any existing mascot.

### 8.1 Look

- **Shape:** big head (about 45% of his height), stubby legs, a tiny tail. A domed shell in deep sage with softly rounded lighter patches, a cream belly, blush cheeks, large glossy dark eyes with two highlights each, a small smile.
- **Signature detail:** a leaf sprout on top of his shell that grows with her level: sprout (levels 1–9), bud (10–19), daisy (20–49), two flowers (50–99), a flower crown (100–299), a glowing aurora bloom (300–999), and a tiny golden crown at level 1,000.
- **Wardrobe:** accessories earned through achievements (section 10.4). She chooses what he wears.
- **Build:** one SVG React component with separately animated parts (head, eyes, eyelids, mouth, front legs, sprout, accessory slot), so expressions are poses, not separate images.
- **Idle:** slow breathing (shell scales 1 to 1.015 over 3 s), random blinks every 3–6 s, an occasional glance towards the last tap.

### 8.2 States

| State | When | Pose |
| --- | --- | --- |
| Idle | Default | Breathing, blinking |
| Cheer | Every aura award | Front legs up holding a glowing orb, eyes as happy arcs |
| Proud | Daily goal, achievement | Chest out, sprout sparkles |
| Dance | Level up, streak milestone | Shell shimmy and bounce |
| Awe | New realm | Wide eyes, mouth open, then a happy hop |
| Wave | Greetings | One front leg waving |
| Thinking | Empty states, Thoughts | Head tilt, leg on chin |
| Sleepy | After midnight, night theme | Droopy lids, a tiny "z" |
| Peek | Unwrap, loading | Head poking out of the box or his shell |
| Swim | Once the pool is unlocked | Floating on a ring in the garden |

### 8.3 Where he lives

A 72 px Oscar sits in the bottom-right corner of Home; Settings can hide him. He appears in every celebration on every screen. In the garden he wanders the scene, naps, and swims once there's a pool. Tap him anywhere for a random encouraging line; tap him in the garden to pet him and he gives off little hearts.

### 8.4 Voice

Warm, cheeky, Irish, Gen Z. At most 12 words a bubble and at most one emoji. He uses her name sometimes, never every line. No guilt, no sarcasm at her expense. Write at least 80 lines in this voice across the categories below, in `config/oscar-lines.ts`, picked by context and never repeated back to back. Seed lines:

- **Task done:** "+25 aura. Look at you go!" · "That's savage, Laura." · "You're flyin' it." · "Slow and steady? Not you. Speedy." · "Main character behaviour." · "Aura levels: rising."
- **Big boosted numbers:** "+12,800 aura. The numbers are getting silly." · "That's not a number, that's a phone number."
- **College Work:** "Study done. Your brain's getting buff."
- **Swap 'N' Serve:** "Serving the community AND aura? Iconic."
- **Hurley Pop's:** "Hurley Pop's: handled."
- **Martial Arts Training:** "Hi-yah! Black-belt finish." · "Discipline looks good on you."
- **Combo:** "Combo! Stop, I can't keep up. (Don't stop.)"
- **Daily goal:** "Daily goal smashed. Doing a shell shimmy."
- **Clear the deck:** "Everything done?! Go touch grass. I'll mind the garden."
- **Achievement:** "New trophy! I'm polishing the shelf."
- **Rank up:** "New belt! I'd bow but I'm a turtle."
- **New realm:** "Laura. LAURA. There's a whole meadow out here."
- **Morning:** "Morning, Laura! What would make today great?"
- **Evening:** "Look what you got done today. Proud of you."
- **After midnight:** "It's late. The garden will still be here tomorrow."
- **Overdue, gently:** "This one's been waiting. Do it, move it, or let it go?"
- **Streak:** "Seven days in a row. That's a whole week of you."
- **Streak ended:** "Fresh start. I kept some of your glow for you."
- **Unlock:** "Ooh, new neighbours! The butterflies have moved in."
- **Empty state:** "Nothing here yet. Want to plant something?"

---

## 9. The garden world

The garden starts as a bare patch of grass beside Oscar's cardboard box. As her aura climbs it becomes a sunny backyard paradise, then opens out into nine more realms on a world map, each doubling her aura. It is the emotional payoff of the whole app, so give its art the most time.

### 9.1 The scene

- **Layers:** sky, soft distant Irish hills, a hedge and fence, the lawn, a foreground flower border. A fixed-ratio stage (16:10 on desktop, 4:5 on phone) with designed slots, so any mix of unlocked items still looks composed.
- **Art style:** flat shapes with soft gradients, rounded forms, two- to three-tone shading, no outlines, a faint paper grain. Write a short art style guide (`docs/ART_STYLE.md`) before drawing anything, draw each item as its own SVG component, then screenshot and refine. Every realm uses the same style.
- **Alive:** grass sways, flowers nod, butterflies drift, the pond shimmers, clouds pass, Oscar wanders between waypoints and naps.
- **Real time:** the sky follows her clock through dawn, day, golden hour and night (stars, fireflies, lantern glow). Seasons follow the calendar: frost and a door wreath on Oscar's home in December, blossom in spring, full sun in summer, falling leaves in autumn. Now and then a soft Irish drizzle passes, followed by a rainbow once she's unlocked it.
- **Touch:** tap any item for its name, unlock date and the aura it took. Decor mode lets her move decor between slots and hide anything she doesn't want.
- **Anticipation:** a panel shows "Next up: Butterflies, 2,400 aura to go" with a progress bar, silhouettes of the next two unlocks, and "?" for the rest.
- **Share:** "Save a picture of my garden" exports a PNG.

### 9.2 Realm 1: The Home Garden (0 to 50,000 aura)

Front-load the early rewards: seven unlocks land within her first 1,000 aura.

| Lifetime aura | Unlock |
| --- | --- |
| 0 | A patch of grass, one sprout, Oscar's cardboard-box home |
| 25 | Her first daisy (her very first task) |
| 100 | The sun breaks through the clouds |
| 250 | A tulip bed, in a colour she picks |
| 400 | A stepping-stone path |
| 600 | Oscar's home: a cosy wooden hut with a round door |
| 800 | Butterflies |
| 1,000 | An apple tree sapling that keeps growing with her aura |
| 1,500 | A lily pond |
| 2,000 | A bench and a bird feeder visited by a robin |
| 2,500 | Sunflowers |
| 3,000 | A second tree, with a hammock strung between the two |
| 4,000 | Oscar's home: a pond-side cottage with a porch and window box |
| 5,000 | Fairy lights and lanterns that glow at night |
| 6,500 | A swimming pool with a float for Oscar |
| 8,000 | A cherry blossom tree |
| 10,000 | Oscar's home: a shell-shaped villa with a hot tub |
| 12,500 | A fountain |
| 15,000 | A greenhouse |
| 20,000 | A rainbow after rain and a hot-air balloon drifting by |
| 30,000 | A wishing well |
| 40,000 | A gazebo wrapped in climbing roses |
| 50,000 | A garden gate swings open onto a path: Realm 2 begins |

### 9.3 The realms

Each realm is its own scene on a world map she can pan around. Locked realms show as misty silhouettes with their name and the aura needed. Each realm has about eight unlocks, spaced roughly geometrically between its entry and the next realm's entry; generate those thresholds in `config/realms.ts` and tune them with the simulation in section 10.5.

| # | Realm | Opens at | Realm boost | Signature unlocks |
| --- | --- | --- | --- | --- |
| 1 | The Home Garden | 0 | ×1 | Section 9.2 |
| 2 | The Wildflower Meadow | 50,000 | ×2 | Poppy field, beehives, a windmill, a picnic blanket, hares, a kite, a meadow cottage for Oscar |
| 3 | The Lake and Orchard | 150,000 | ×4 | A rowing boat and jetty, swans, orchard rows, a weeping willow, fireworks over the water, a lake house for Oscar |
| 4 | The Enchanted Woodland | 500,000 | ×8 | A fairy ring of mushrooms, a fox family, deer, an owl, a rope bridge, glowing toadstools, a treehouse for Oscar |
| 5 | The Seaside Cove | 1,500,000 | ×16 | A lighthouse, a beach hut, rock pools, dolphins, a sandcastle, a surfboard for Oscar, a seaside villa |
| 6 | The Misty Mountains | 5,000,000 | ×32 | A waterfall, a cable car, hot springs, eagles, an observatory, a mountain lodge for Oscar |
| 7 | The Sky Islands | 15,000,000 | ×64 | Floating islands, an airship, cloud bridges, gentle sky whales, rainbow falls, a sky castle for Oscar |
| 8 | The Starlight Realm | 50,000,000 | ×128 | A moon garden, constellations shaped like her projects, a comet, a planet swing, a star-lantern tree |
| 9 | The Aurora Kingdom | 150,000,000 | ×256 | Northern lights that dance to her streak, ice-crystal gardens, an aurora palace with a crystal throne for Oscar |
| 10 | The Infinite Garden | 500,000,000 | ×512 | Everything in gold, a garden that blooms forever, Oscar's crown |

- **Beyond the map:** at **1,000,000,000 aura** comes the Aura Singularity, a one-time supernova-bloom finale across every realm. After that, every further billion adds a prestige star beside her name and turns one realm to a gold variant.
- **Art scope.** Launch with realms 1–3 fully drawn. Realms 4–10 launch as beautiful locked teaser cards. At six tasks a day she won't reach realm 4 for about six months, so track the remaining art in `REALMS_TODO.md` as one future session per realm.

### 9.4 Project corners

Each project grows its own corner of the Home Garden, from aura earned in that project alone.

| Project | At 500 project aura | At 5,000 project aura | At 50,000 project aura |
| --- | --- | --- | --- |
| College Work | A stack of books with a tiny graduation cap on Oscar's porch | A reading nook with a study lamp | A little library with a SETU-slate roof |
| Swap 'N' Serve | A washing line of little clothes swaying in the breeze | A clothes-swap rail with hangers | A sunny yellow swap stall with a smiley sign |
| Hurley Pop's | A hurley and sliotar leaning on the fence | Two crossed hurleys mounted on the shed wall | A mini pitch with goalposts |
| Martial Arts Training | A wooden training dummy | A practice mat with a belt display | A small dojo with paper lanterns |
| Any project she creates | A pennant flag in the project's colour | A banner with the project's icon | A little pavilion in the project's colour |

---

## 10. Achievements and the Trophy Room

More than 150 achievements give her something to chase at every stage, from her first task to a billion aura. Each pays a one-time aura bonus and adds +1% to her permanent trophy boost.

### 10.1 Tiers

| Tier | Bonus aura |
| --- | --- |
| Bronze | 250 |
| Silver | 1,000 |
| Gold | 5,000 |
| Platinum | 25,000 |
| Diamond | 100,000 |
| Mythic | 1,000,000 |
| Celestial | 10,000,000 |

Within each family, earlier thresholds get lower tiers. The top two thresholds of a long family are Mythic and Celestial.

### 10.2 Achievement families

| Family | Thresholds |
| --- | --- |
| Lifetime aura | 1K · 10K · 100K · 1M · 10M · 100M · 1B |
| Tasks completed | 1 · 10 · 50 · 100 · 500 · 1,000 · 2,500 · 5,000 · 10,000 · 25,000 · 50,000 · 100,000 |
| Streak (days) | 3 · 7 · 14 · 30 · 60 · 100 · 200 · 365 · 500 · 730 · 1,000 |
| Daily goals hit | 1 · 7 · 30 · 100 · 250 · 500 · 1,000 |
| Clear the deck | 1 · 10 · 50 · 100 · 365 |
| Combos | 1 · 25 · 100 · 500 · 1,000; longest chain 5 · 10 · 20 |
| Thoughts written | 1 · 10 · 50 · 100 · 365 · 1,000 |
| People | Contacts 10 · 50 · 100 · 250; catch-ups logged 10 · 50 · 100 · 500 |
| Calendar | Events planned 10 · 100 · 1,000; time blocks completed 10 · 100 · 1,000 |
| Garden | Items unlocked 10 · 25 · 50 · 100; each realm opened, 2 to 10 |
| Levels | 10 · 25 · 50 · 100 · 250 · 500 · 1,000 |
| Early bird | Tasks done before 9 a.m.: 10 · 100 · 1,000. (No night-owl achievement, by design.) |
| Weekend warrior | Weekends with 5+ tasks: 1 · 10 · 52 |
| Project ranks | Every rank in section 10.3 |
| Secret (shown as "???" with a hint until earned) | A task on St Patrick's Day, Halloween, Christmas Day and New Year's Day; a task on her birthday; pet Oscar 100 times; open AuraGarden on 100 different days; one year since her unwrap; finish every task in a project; a 10-task day |

Keep definitions in `config/achievements.ts`. New projects she creates automatically get their own rank family (section 10.3).

### 10.3 Project ranks

Each project has its own aura total and climbs ranks. The current rank shows as a badge next to the project everywhere, and every rank-up celebrates and counts as an achievement.

| Project | Ranks (project aura needed) |
| --- | --- |
| Martial Arts Training | White belt (0), Yellow (1K), Orange (3K), Green (7.5K), Blue (15K), Purple (30K), Brown (60K), Black (125K), then 2nd to 10th Dan at 250K, 500K, 1M, 2.5M, 5M, 10M, 25M, 50M, 100M. The belt icon next to the project changes colour with her rank, and Dan stripes appear on the black belt |
| College Work | Fresher (0), Second Year (2.5K), Third Year (7.5K), Final Year (20K), Graduate (50K), Honours (125K), Masters (300K), PhD (1M), Professor (5M), President of SETU (25M) |
| Swap 'N' Serve | Volunteer (0), Helper (2.5K), Organiser (10K), Team Lead (30K), Champion (100K), Community Hero (500K), Limerick Legend (2.5M), National Treasure (25M) |
| Hurley Pop's | Sub (0), Starter (2.5K), Free-taker (10K), Captain (50K), County Star (250K), All-Star (2.5M), Hall of Fame (25M) |
| Any project she creates | Bronze, Silver, Gold, Platinum, Diamond and Mythic stars at 1K, 10K, 100K, 1M, 10M and 100M |

Rank names are editable in the project's settings.

### 10.4 Oscar's wardrobe

Some achievements unlock accessories for Oscar, which she can put on him in the garden:

| Accessory | Earned by |
| --- | --- |
| Sun hat | A 7-day streak |
| Knitted scarf | Her first winter (any task in December) |
| Headband and black belt | Black belt in Martial Arts Training |
| Graduation cap | Graduate in College Work |
| Smiley tee | Champion in Swap 'N' Serve |
| Tiny hurley | Captain in Hurley Pop's |
| Sunglasses | 100 daily goals |
| Explorer's backpack | Opening realm 3 |
| Golden crown | Level 1,000 |

### 10.5 The Trophy Room and the economy simulation

- **`/trophies`:** shelves by family. Earned badges are glossy in their tier colour; locked ones are greyed with progress bars ("612 / 1,000 tasks"); secret ones show "???" with a hint. Filters: Earned, Almost there (75%+), All.
- **Stats panel:** lifetime aura in full, level and title, current boosts with a breakdown, tasks done, best streak, achievements earned out of the total.
- **Simulation:** build `scripts/simulate-economy.ts`, which runs 5 years of use at 3, 6 and 10 tasks a day (with occasional missed days) against the real config files and prints when each realm, level title and achievement lands. `docs/economy-sim-reference.py` is a rough starting model. Tune thresholds until, at 6 tasks a day:
    - Month 1 has something new (unlock, achievement or rank) at least every 2 days
    - Months 2–12 have something new at least weekly, and years 2–5 at least every 2 weeks
    - Realm 2 opens around month 2, realm 4 around month 6, 1M aura around month 8, 10M around month 19, 100M around year 3.5
    - 1B aura and level 1,000 stay mythic, multi-year goals
- Commit the simulation's output table to `docs/ECONOMY.md`.

---

## 11. Visual design system

Soft, warm and botanical: cream paper, sage greens and blush pinks, with a lavender-to-gold aura glow kept for rewards only. Read the frontend-design guidance available to you before styling, and make choices that feel intentional rather than templated.

### 11.1 Colour tokens

| Token | Light | Night garden | Use |
| --- | --- | --- | --- |
| `background` | #FBF7F0 | #121A16 | Page |
| `surface` | #FFFFFF | #1B2520 | Cards, sheets |
| `surface-sunk` | #F3EDE3 | #0E1511 | Inputs, wells |
| `ink` | #2E2A26 | #F1ECE3 | Main text |
| `ink-muted` | #6F665D | #A9B3AC | Secondary text |
| `primary` | #4F7A5A | #8FC29A | Buttons, checks, links |
| `primary-soft` | #DCEBDD | #23382A | Tints, selected rows |
| `blush` | #F2C4C0 | #5A3A3D | Highlights, the gift ribbon |
| `aura` | #B79CF2 to #F59FC6 to #FFD36E | Same, with more glow | Rewards only |
| `gentle` | #F6E3B8 | #4A3F25 | Overdue, "still waiting" |
| `danger` | #C8524B | #F08A82 | Delete actions only |

Achievement tier colours: Bronze #C08552, Silver #A8B2BD, Gold #E7B53C, Platinum #8FD3D1, Diamond #9CC9FF, Mythic #C59BF5, Celestial (the aura gradient, animated). The aura gradient appears only on reward elements (aura pill, "+25", level badges, unlock cards, Celestial badges) so it keeps its meaning. Check every text pairing for WCAG AA contrast.

### 11.2 Type

- **Display and headings:** Fraunces, using its soft optical axis.
- **UI and body:** Plus Jakarta Sans. Tabular figures for every number that counts up.
- **Handwritten accent:** Caveat, only for the gift tag and notes.
- **Signature:** a flowing script (Great Vibes or similar), only for "David" on the gift tag and in About.
- Load through `next/font` or `@fontsource` with Latin subsets. Scale: 12, 14, 16, 18, 22, 28, 36, 48 px. Body and inputs at 16 px minimum on phones so iOS never zooms into a field.

### 11.3 Shape, space and motion

- Radius 20 px for cards, 14 px for inputs, full pills for chips and buttons. Soft tinted shadows, e.g. `0 8px 24px rgba(79,122,90,0.12)`. A 4 px spacing grid. Touch targets at least 44 px.
- Springs for UI motion (stiffness about 320, damping about 26). Routine transitions 150–250 ms; celebrations up to 1.5 s, a new realm up to 6 s; list stagger 40 ms. Only the garden ambience and Oscar's idle loop continuously. Reduced motion means fades only.

### 11.4 Components and icons

- Restyle every primitive: a round checkbox whose tick sprouts a leaf, buttons, inputs, bottom sheets on phone and dialogs on desktop, toasts with Undo, tabs, chips, avatars, progress rings, kanban cards, calendar events, badges and empty states.
- Lucide for UI icons at 1.75 px stroke. Custom original SVGs for the hurley and sliotar, the martial-arts belt, the aura orb, achievement badges and Oscar.

### 11.5 Copy

Plain, warm, short, sentence case. Labels stay literal ("Add task", not "Plant a seed"); the playfulness lives in Oscar's lines, empty states and celebrations. Use "Laura" sparingly so it still lands.

### 11.6 Avoid

The default grey shadcn look, purple gradients everywhere, heavy glassmorphism, tiny grey text, and red count badges.

---

## 12. Data, sync and privacy

There are no accounts. Each garden lives on the device in IndexedDB and, when sync is configured, is mirrored to Supabase under a secret garden key that only its owner holds. Whoever has the key can open the garden; nobody else can. The database is already live; your job is the client and the thin server routes.

### 12.1 How a garden works

- **Creating.** The device generates a garden key: 32 random bytes from `crypto.getRandomValues`, base64url-encoded without padding (exactly 43 characters). It calls `POST /api/garden` with the key in an `Authorization: Garden <key>` header. The route calls `ag_create_garden(p_key, p_client)`, where `p_client` is a SHA-256 of the caller's IP salted with `CRON_SECRET` (never the raw IP). The database stores only the SHA-256 hash of the key; the raw key is never stored or logged.
- **The secret link.** `https://<host>/join#k=<key>`. The key sits after the `#`, so it never reaches the server, Vercel logs or analytics. The QR code shows this link.
- **Joining.** Scanning the QR or opening the link on another device saves the key locally, pulls everything, and opens Home.
- **Rotating.** "Make a new link" generates a new key and calls `ag_rotate_garden(old, new)`. Old links stop working at once, and other devices see "This garden has a new link. Scan it to keep syncing."
- **Deleting.** "Delete this garden" calls `ag_delete_garden(key)`, then clears the device.

### 12.2 Sync

- Dexie is the source of truth on each device. Every change also goes into an outbox.
- The `SyncEngine` calls `POST /api/sync` with `{ cursor, changes }` 2 s after edits settle, when the app regains focus, and when the network comes back. The route calls `ag_sync(p_key, p_cursor, p_changes)`, which applies the changes and returns `{ cursor, more, changes }`: everything newer than the cursor, up to 2,000 rows a page. Keep calling while `more` is true.
- **Record shape** both ways: `{ collection, id, data, updated_at, deleted_at }`. `collection` is lowercase snake_case (`tasks`, `aura_ledger` …); `id` is up to 200 characters; `updated_at` is an ISO timestamp.
- **Conflicts:** last write wins per record by `updated_at`; the database clamps timestamps more than 5 minutes in the future, and on a tie it keeps its own copy. Deletes travel as tombstones (`deleted_at` set) and are purged after 30 days. If a device hasn't synced for 25 days or more, push its outbox, then replace its local data with a full pull from cursor 0. As a safety net, every device also does one full pull a day.
- Aura ledger records use deterministic ids (section 7.4), so two devices can never double-award.
- Fully usable offline; a cloud icon in the header shows Synced, Syncing, Offline or Needs attention.
- With no Supabase env vars, `SyncEngine` is off, the link section in Settings says "Sync is off on this site", and everything else works.

### 12.3 The database (already live)

Supabase project `auragarden` (ref `weebglxqeozejvwpazwt`, West EU, Ireland). `supabase/setup.sql` is the source of truth and is already applied, along with the two files in `supabase/migrations/`. Tables are locked: row-level security is on with no policies and no table grants, so the publishable key can only call these functions:

| Function | Returns | Errors |
| --- | --- | --- |
| `ag_create_garden(p_key text, p_client text)` | `{ "created": bool }` (`false` if the key already exists) | `invalid_key`, `rate_limited` (20 per client and 500 in total a day) |
| `ag_check_garden(p_key text)` | `bool`: does the garden exist | `invalid_key`, `rate_limited` (120 a minute) |
| `ag_sync(p_key text, p_cursor bigint, p_changes jsonb)` | `{ "cursor", "more", "changes" }` | `invalid_key`, `garden_not_found`, `bad_request`, `payload_too_large` (2 MB), `too_many_changes` (1,000), `rate_limited` (120 a minute), `garden_full` (50 MB) |
| `ag_rotate_garden(p_old_key text, p_new_key text)` | `true` | `invalid_key`, `garden_not_found` |
| `ag_delete_garden(p_key text)` | `bool` | `invalid_key` |
| `ag_heartbeat()` | `{ "ok", "purged" }`; keeps the project awake and purges old tombstones | |

- Call them from server routes only, with `@supabase/supabase-js` (`createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY).rpc(...)`). Both env vars are server-only: never prefix them with `NEXT_PUBLIC_`.
- Map errors to HTTP: `invalid_key` and `garden_not_found` → 401; `bad_request` and `too_many_changes` → 400; `payload_too_large` → 413; `rate_limited` → 429; `garden_full` → 507.
- **Don't change the schema or these functions.** You have no database access from here. If something truly needs a change, write a new file in `supabase/migrations/` and flag it in `PROGRESS.md`; David will ask Claude in chat to apply it.
- **Tests:** write an in-memory fake of these six functions that follows `setup.sql` exactly, and use it for unit and Playwright tests. Test against the real thing on https://auragarden.vercel.app after a push, if your environment can reach it.
- Images are resized on the device (256 px WebP, 50 KB max) and stored inside records; there are no storage buckets.

### 12.4 Keeping her garden safe

There is no account recovery by design, so the app makes losing the link hard:

- **Save the link.** Right after her first task, Oscar asks her to save her secret link: "Save QR to Photos" (downloads a pretty PNG card with the QR), "Email it to myself" (`mailto:` with the link), "Copy link". Settings always shows it. If she's never saved it, Oscar reminds her gently once a month.
- **Add to Home Screen early.** On iPhone, a home-screen app keeps its own storage, separate from Safari, and Safari can clear a site's data after 7 days of browsing without a visit. So onboarding walks her through Add to Home Screen with a short illustrated guide (iPhone: Share, Add to Home Screen; Android: Install app). Before she installs on iPhone, copy her secret link to the clipboard; when the installed app first opens with no garden, show "Paste my garden link" so she carries straight on.
- Call `navigator.storage.persist()` on first start.
- **Export everything** as JSON remains a second safety net.

### 12.5 Privacy and abuse protection

- The database keeps only key hashes. Never log `Authorization` headers, keys or request bodies.
- No analytics, trackers or third-party scripts.
- `/api/calendar/feed` first calls `ag_check_garden` with the caller's key; allows only `http` and `https`; resolves DNS and refuses private, loopback and link-local addresses; times out at 10 s; caps responses at 5 MB; must parse as iCalendar; caches for 15 minutes.
- The repo is public: env values live only in Vercel.

---

## 13. Build phases and quality bar

Build in ten phases, each finished, verified and committed before the next begins. Track status, decisions and open questions in `PROGRESS.md`.

1. **Foundations.** Scaffold Next.js, Tailwind tokens, fonts and the app shell (header, tab bar, sidebar). Dexie schema and `lib/data/`, `config/gifts.ts`, copy logos to `public/brand/`, and seed the four projects for `/laura` gardens. Runs locally with no env vars.
2. **Core editing.** Projects, Tasks (list and board), My List, quick add with natural-language parsing, and every editing rule from section 6: inline edit, drag reorder, soft delete with Undo, Trash.
3. **Aura and Oscar.** The ledger, `awardAura`, boosts, levels, big-number formatting, every rule in section 7, the +25 moment with the multiplier flourish, stacking, sounds, streaks and the Aura sheet. Oscar with all states and 80+ lines.
4. **The garden world.** Art style guide first, then Realm 1 with every ladder item, Oscar's home upgrades, project corners, unlock reveal cards, time of day, seasons and decor mode. Then the world map, realms 2 and 3 fully drawn, the new-realm sequence, and teaser cards for realms 4–10.
5. **Achievements.** All families, project ranks, the belt icon, Oscar's wardrobe, the Trophy Room, and the economy simulation with `docs/ECONOMY.md`.
6. **Thoughts, People, Calendar.** Sections 6.5 to 6.7, including the feed route and `.ics` and `.vcf` import.
7. **Home and the unwrap.** Home widgets, the `/laura` unwrap with the signature, the welcome page at `/`, onboarding, and the return-visit version.
8. **Sync and PWA.** The server routes (`/api/garden`, `/api/sync`, `/api/calendar/feed` key check, `/api/keepalive`) over the live `ag_*` functions, the in-memory fake for tests, `SyncEngine`, joining by QR or link, rotation, deleting, and the safety steps in 12.4. Web manifest, Oscar app icons, offline shell.
9. **Polish.** Accessibility, performance, reduced motion, dark mode, every empty state, a copy read-through, and cross-device checks.
10. **Ship.** Final push and checks (section 14), then hand over (section 15).

**After every phase**

- Run typecheck, lint, tests and `next build`. Fix everything before moving on.
- Take Playwright screenshots at 390×844 and 1440×900, in light and dark. Look at them and critique like a senior product designer: spacing, alignment, hierarchy, contrast, delight. Fix and re-shoot until each screen is genuinely beautiful.
- Commit with a clear message and push. Update `PROGRESS.md`.

**When to stop and ask David:** anything that costs money; any domain or DNS change; anything that needs the Vercel or Supabase dashboards (section 14). Never stop for anything else: use placeholders and note them.

**Acceptance checks** (automate with Playwright where possible; use a local fixture feed with recurring events for calendar tests)

- [ ] `/laura` plays the full unwrap on a first visit and the short one on return; Skip works; the signature writes itself and the heart beats
- [ ] `/` never plays the unwrap and starts a blank garden
- [ ] Ticking a task shows Oscar and "+25", plays the ding, and raises the total by exactly 25 at ×1
- [ ] With a 30-day streak in realm 2 and no achievements, a task shows "+25 ×4 → +100"
- [ ] A double tap awards once; un-ticking removes exactly that award; re-ticking the same day restores it
- [ ] Crossing 25, 100 and 250 aura unlocks the daisy, the sun and the tulips, each with a reveal card
- [ ] Crossing 50,000 plays the new-realm sequence and doubles the realm boost
- [ ] 1,234,567 shows as "1.23M" in the pill and in full in the Aura sheet; a 999-billion total renders without breaking layout
- [ ] Project rank-ups celebrate; the Martial Arts belt icon changes colour at 1K project aura
- [ ] Each starter project can be renamed, recoloured, re-iconed and deleted, with Undo
- [ ] My List items, thoughts, contacts and events can all be created, edited, reordered and deleted
- [ ] A pasted iCal link shows its events, recurring ones included, in Week view; the feed route refuses `http://127.0.0.1` and `http://169.254.169.254`
- [ ] An `.ics` upload imports events and a `.vcf` upload imports contacts
- [ ] Two browser contexts joined to the same garden see each other's edits within 10 s; completing the same task on both awards it once
- [ ] A wrong key gets 401, and no request ever returns another garden's records (against the fake, and on the live site if reachable)
- [ ] Ticking a task offline works and syncs when the connection returns
- [ ] The app installs to an iPhone home screen and "Paste my garden link" restores the garden there
- [ ] The economy simulation meets the pacing targets in section 10.5
- [ ] Lighthouse mobile scores 90+ for Performance, Accessibility and Best Practices
- [ ] With reduced motion on, nothing slides or bounces; with sound off, nothing plays

---

## 14. Deploy

Hosting and the database are already set up, so deploying is just pushing to `main`.

**What's already live**

| Piece | Details |
| --- | --- |
| Vercel project | `auragarden` in the Nexeire team, linked to `dhackettLMK/AuraGarden_`. Framework preset Next.js, functions in `dub1` (Dublin). Every push to `main` deploys to production; other branches get preview deployments |
| Production URL | https://auragarden.vercel.app (Laura's gift: https://auragarden.vercel.app/laura) |
| Environment variables | `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` (production, preview, development) and `CRON_SECRET` (production, preview). All server-only |
| Supabase project | `auragarden`, West EU (Ireland), with `supabase/setup.sql` and both migrations applied and tested |
| Ignored build step | Builds are skipped while the repo has no `package.json`, so this build pack doesn't trigger failed deploys. Leave it as it is |

**What you do**

- Add `vercel.json` with the function region and the keep-alive cron: `{"regions":["dub1"],"crons":[{"path":"/api/keepalive","schedule":"17 6 * * *"}]}`. The route checks `Authorization: Bearer $CRON_SECRET` (Vercel sends it automatically) and calls `ag_heartbeat()`. Supabase pauses free projects after about a week of too little database activity; this daily call prevents it. Hobby crons run once a day, which is enough.
- Add `.env.example` listing the three variable names with empty values, and nothing else.
- Push each finished phase to `main`; the site redeploys itself. If you can reach the live site from your environment, smoke-test it after each phase.
- Write `DEPLOY.md` explaining the setup above for future sessions.

**If something needs the dashboards** (a failed build to inspect, protection settings, a custom domain, a schema change), note it in `PROGRESS.md`. David will ask Claude in chat, where Vercel and Supabase are connected, to sort it. If `https://auragarden.vercel.app/laura` ever asks for a Vercel login, the project's Deployment Protection needs to be Standard Protection.

The gift text (tag, signature, optional note) lives in `config/gifts.ts`, which is public in this repo and visible to anyone who opens `/laura`. Keep it to what you'd write on a card.

---

## 15. Handover

Finish with a short report to David and a printable card he can hand Laura with the gift.

**The report (in `HANDOVER.md`, and summarised in chat)**

- The live link: https://auragarden.vercel.app/laura, and the custom domain if one was added.
- How David should test without spoiling it: in a private tab on his own phone, open `/laura`, unwrap, start a garden, tick a task, open it on a laptop by QR. Laura's phone will still get a fresh unwrap and a fresh garden.
- How Laura starts: open `/laura` on her phone, unwrap, "Start my garden", save her secret link, add to home screen. David never needs her link.
- How to open her garden on a laptop: Settings, Open on another device, scan the QR.
- How she links her Google, Apple or Outlook calendar.
- What's still a placeholder, and anything David still has to do.
- Where to tweak things: `config/gifts.ts`, `config/realms.ts`, `config/achievements.ts`, `config/oscar-lines.ts`, and `docs/ECONOMY.md`.
- Next sessions, most valuable first: realm art packs 4–10 (`REALMS_TODO.md`); push reminders for the installed app; two-way Google Calendar sync; a rewards shelf where she sets her own real-life treats at aura milestones.
- A `README.md` covering local dev, env vars, the database and deploys.

**The gift card.** Generate `gift/auragarden-card.pdf` and a matching PNG: an A6 card at 300 dpi with 3 mm bleed. Front: Oscar peeking out of the gift box, the AuraGarden wordmark, "For Laura". Back: a QR code to https://auragarden.vercel.app/laura, "For Laura, grow something great." in Caveat, "David" in the signature script with a small heart, and "Scan to unwrap".
