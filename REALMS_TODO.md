# Realm art packs still to paint

Realms 1–3 are fully drawn. Realms 4–10 launch as teaser cards on the world map (misty silhouettes with their name, the aura needed, and a palette sketch). At six tasks a day Laura reaches realm 4 around month six, so there is time. Plan one future Claude Code session per realm, in order.

Each pack:

1. Read `docs/ART_STYLE.md` and look at `components/garden/art/realms.tsx` (Meadow and Lake are the reference).
2. Add a `<Name>Scene` component that takes `unlocked: Set<string>` and draws the realm's base landscape plus each of its eight unlocks (ids in `config/realms.ts` → `REALM_ITEMS`).
3. Wire it into `RealmArt` in `features/garden/WorldMap.tsx` and the neighbours strip in `components/celebrate/RealmSequence.tsx`, set `drawn: true` in `config/realms.ts`.
4. Screenshot at 390×844 and 1440×900, light and dark, morning and night; refine.

| # | Realm | Opens at | Unlocks to draw |
| --- | --- | --- | --- |
| 4 | The Enchanted Woodland | 500,000 | Fairy ring of mushrooms, fox family, deer, owl, rope bridge, glowing toadstools, Oscar's treehouse, firefly glade |
| 5 | The Seaside Cove | 1,500,000 | Lighthouse, beach hut, rock pools, dolphins, sandcastle, surfboard for Oscar, seaside villa, shell garden |
| 6 | The Misty Mountains | 5,000,000 | Waterfall, cable car, hot springs, eagles, observatory, mountain lodge, edelweiss meadows, summit flag |
| 7 | The Sky Islands | 15,000,000 | Floating islands, airship, cloud bridges, sky whales, rainbow falls, sky castle, cloud garden, sky kites |
| 8 | The Starlight Realm | 50,000,000 | Moon garden, constellations shaped like her projects, comet, planet swing, star-lantern tree, moon cottage, nebula pond, shooting stars |
| 9 | The Aurora Kingdom | 150,000,000 | Northern lights that dance to her streak, ice-crystal gardens, snowy owls, ice bridge, crystal trees, aurora palace, crystal throne, polar lanterns |
| 10 | The Infinite Garden | 500,000,000 | Everything in gold, a garden that blooms forever, golden fountain, golden trees, halo, golden palace, Oscar's crown, the endless path |

Also still to build when she gets close: the **Aura Singularity** finale at 1,000,000,000 aura (a supernova bloom across every realm) and the gold realm variants with a prestige star beside her name for every further billion (`prestigeStars()` in `config/realms.ts` already computes the count).
