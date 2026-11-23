# AuraGarden art style guide

Every illustration in AuraGarden (the garden, the realms, Oscar, his wardrobe, badges) follows these rules, so a garden of any mix of unlocks looks composed and every future realm pack fits.

## The feel

Soft, warm, botanical, a little storybook. A sunny Irish back garden on its best day. Calm enough to look at every day, with small moments of delight hiding in it.

## Shapes

- **Flat shapes, rounded everything.** Circles, ellipses and soft cubic curves. No sharp corners except where something is genuinely sharp (a roof ridge, a star point), and even then a small radius.
- **No outlines.** Shapes are separated by value and hue, never by strokes. The only strokes allowed are thin details that read as lines in real life: stems, strings, hammock ropes, fishing line, window muntins, rain.
- **Two- to three-tone shading.** Each object has a base tone, one shadow tone (same hue, darker and slightly cooler) on the side away from the sun (bottom-right), and optionally one highlight (lighter and warmer) on the top-left.
- **Soft gradients** only for big surfaces: sky, water, hills, lawn. Gradients run top-light to bottom-darker and never use more than three stops.
- **Light comes from the top-left.** Cast shadows are soft ellipses under objects at 10–16% ink opacity, offset slightly right.

## Palette

Base palette (light, daytime):

| Role | Colours |
| --- | --- |
| Sky | `#CFE8F3` → `#F7EEDC` |
| Distant hills | `#B9D7B0`, `#A3C99A` (cooler, lighter the further away) |
| Hedge | `#6E9E6B`, `#5C8C5B` |
| Lawn | `#A9D18E` → `#8EBF77`, mowing stripes `#9BC983` |
| Wood | `#C99A6B`, `#A87B52`, `#8A6242` |
| Stone | `#D9D2C5`, `#BDB4A5` |
| Water | `#9ED3E0` → `#6FB5C8`, shimmer `#FFFFFF` at 50% |
| Flowers | blush `#F2A3B5`, cream `#FFFDF7`, butter `#F4C443`, coral `#EE8A6B`, lavender `#B79CF2` |
| Oscar | skin `#A6CFA1`, shell `#6E9E76`→`#4B7755`, belly `#F6EBD2`, cheeks `#F3A7A2` |

The aura gradient (`#B79CF2` → `#F59FC6` → `#FFD36E`) appears in art only for magic: glowing orbs, the aurora bloom, sparkles on new unlocks.

## Time of day and seasons

- The whole scene is tinted by a sky layer, not by recolouring each object. Dawn adds a peach wash, golden hour a warm amber overlay at 18%, night a deep blue multiply overlay at 55% with lanterns and windows punched back out as glows.
- Seasons change accents, not the whole garden: winter adds frost highlights and a wreath, spring blossom and petals, summer full sun and saturated flowers, autumn warm leaf colours and falling leaves.

## Composition

- The stage has a fixed ratio: 16:10 on desktop, 4:5 on phones. Every unlock has a **designed slot** in both layouts, so any combination looks intentional.
- Depth is ordered by the slot's baseline (y): things lower on screen are in front.
- Leave breathing room around Oscar's home: it is the focal point of the Home Garden.
- Big items (trees, the greenhouse, the gazebo) sit at the edges and back; small ones (daisy, bench) sit in the middle ground.

## Motion

- Ambient motion is slow and small: grass sways 2–3°, flowers nod 4°, clouds drift over 60–90 s, butterflies follow lazy figure-of-eight paths, water shimmers with moving highlights.
- Nothing ever flashes. Reduced motion freezes every ambient loop in a pleasant pose.

## Texture

A faint paper grain (an SVG noise filter at 3–5% opacity) sits over the whole scene, so the flat colours feel printed rather than digital.

## Originality

Everything is drawn from scratch for AuraGarden. Oscar is a round sage-green turtle with a leaf sprout; he must never resemble any existing mascot. No traced or derivative art.

## Building items

- Each unlock is its own React SVG component in `components/garden/art/`, drawn around a local origin where `(0, 0)` is the centre of its base on the ground.
- Item components take `t` (a 0–1 growth value, used by the apple tree) and `night` where they glow.
- Draw, screenshot at 390×844 and 1440×900 in light and dark, then refine.
