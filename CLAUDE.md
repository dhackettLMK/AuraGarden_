# AuraGarden: instructions for Claude Code

This repo builds AuraGarden, a gamified life OS that David Hackett is giving to his friend Laura Quinn. The full spec is `AURAGARDEN_BRIEF.md`. Read it end to end before writing any code, and re-read the relevant sections before each phase.

## How to work

- Build in the phase order of brief section 13. Finish, verify, commit and push each phase before starting the next.
- Keep `PROGRESS.md` current: phase status, decisions you made, placeholders, and open questions for David. A new session should be able to resume from it alone.
- Check the current docs for every library version you install. These APIs change often; don't build from memory.
- After every phase: typecheck, lint, tests and `next build` must pass. Take Playwright screenshots at 390×844 and 1440×900 in light and dark, look at them critically, and fix anything that isn't beautiful.
- Game numbers (unlock ladder, realms, levels, boosts, achievements, ranks, Oscar's lines) live in `config/`, never inside components.

## Hard rules

- This repo is public. Never commit secrets, keys, `.env*` files, or private details like email addresses, phone numbers or anyone's contacts.
- Logos are in `assets/logos/` (see `assets/README.md`). Use those files; never redraw or recolour them.
- Oscar, the garden and all other art are original SVGs. Nothing may resemble Duolingo's owl or any existing character.
- No accounts. Gardens are private through their secret garden key (brief section 12). Never log keys, `Authorization` headers or request bodies.
- Don't stop to ask David for anything except what brief section 13 lists. Use tasteful placeholders and note them in `PROGRESS.md`.
