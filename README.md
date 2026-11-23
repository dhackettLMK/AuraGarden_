# AuraGarden

A gift for Laura: a life OS where every finished task earns aura from Oscar the Turtle and grows her garden.

This repo is the build pack. Claude Code builds the app from it, and every push to `main` deploys to https://auragarden.vercel.app (Laura's gift: https://auragarden.vercel.app/laura).

## Start the build

Open this repo in Claude Code and paste:

```
Read CLAUDE.md and AURAGARDEN_BRIEF.md end to end before writing any code. They are the full spec for AuraGarden. Build it phase by phase as section 13 describes. Verify, commit and push every phase (pushing to main deploys it to auragarden.vercel.app), and keep PROGRESS.md up to date. Never block on missing inputs: use tasteful placeholders and list them at handover.
```

If a session ends partway, start a new one with:

```
Read CLAUDE.md, AURAGARDEN_BRIEF.md and PROGRESS.md, then carry on from the next unfinished phase.
```

## What's here

| Path | What it is |
| --- | --- |
| `AURAGARDEN_BRIEF.md` | The full spec |
| `CLAUDE.md` | Working rules Claude Code loads automatically |
| `assets/logos/` | SETU and Swap 'N' Serve logos, ready to use |
| `supabase/` | The live database schema (already applied) |
| `docs/economy-sim-reference.py` | Rough model of the aura economy, for tuning |

Claude Code replaces this README with developer docs once the app exists.
