/**
 * The garden world (brief 9). Realm entry thresholds and their unlock ladders.
 * Thresholds inside realms 2–10 are generated geometrically between entries
 * and tuned with scripts/simulate-economy.ts.
 */
export interface Unlock {
  id: string;
  name: string;
  at: number;
  realm: number;
  /** Line Oscar says when it arrives. */
  line?: string;
  /** Short description for the reveal card. */
  blurb?: string;
  /** Oscar's home upgrades are tagged so the garden swaps his house. */
  home?: boolean;
}

export interface Realm {
  n: number;
  id: string;
  name: string;
  at: number;
  boost: number;
  signature: string[];
  /** Realms 1–3 are fully drawn at launch; the rest are teaser cards. */
  drawn: boolean;
  palette: [string, string, string];
}

export const REALMS: Realm[] = [
  { n: 1, id: "home", name: "The Home Garden", at: 0, boost: 1, signature: [], drawn: true, palette: ["#BFE3B4", "#8CC084", "#F6E7C1"] },
  { n: 2, id: "meadow", name: "The Wildflower Meadow", at: 50_000, boost: 2, signature: ["Poppy field", "Beehives", "A windmill", "A picnic blanket", "Hares", "A kite", "A meadow cottage for Oscar"], drawn: true, palette: ["#E9F1C9", "#B9D486", "#F2A79A"] },
  { n: 3, id: "lake", name: "The Lake and Orchard", at: 150_000, boost: 4, signature: ["A rowing boat and jetty", "Swans", "Orchard rows", "A weeping willow", "Fireworks over the water", "A lake house for Oscar"], drawn: true, palette: ["#CFE7F0", "#7FB7C9", "#A9CF8E"] },
  { n: 4, id: "woodland", name: "The Enchanted Woodland", at: 500_000, boost: 8, signature: ["A fairy ring of mushrooms", "A fox family", "Deer", "An owl", "A rope bridge", "Glowing toadstools", "A treehouse for Oscar"], drawn: false, palette: ["#2F5240", "#5E8C68", "#E7B4D0"] },
  { n: 5, id: "cove", name: "The Seaside Cove", at: 1_500_000, boost: 16, signature: ["A lighthouse", "A beach hut", "Rock pools", "Dolphins", "A sandcastle", "A surfboard for Oscar", "A seaside villa"], drawn: false, palette: ["#BEE3EE", "#F3DFB5", "#5FA8C2"] },
  { n: 6, id: "mountains", name: "The Misty Mountains", at: 5_000_000, boost: 32, signature: ["A waterfall", "A cable car", "Hot springs", "Eagles", "An observatory", "A mountain lodge for Oscar"], drawn: false, palette: ["#C9D3DE", "#7D8FA3", "#EEF2F6"] },
  { n: 7, id: "sky", name: "The Sky Islands", at: 15_000_000, boost: 64, signature: ["Floating islands", "An airship", "Cloud bridges", "Gentle sky whales", "Rainbow falls", "A sky castle for Oscar"], drawn: false, palette: ["#DDEBFF", "#B79CF2", "#FFFFFF"] },
  { n: 8, id: "starlight", name: "The Starlight Realm", at: 50_000_000, boost: 128, signature: ["A moon garden", "Constellations shaped like her projects", "A comet", "A planet swing", "A star-lantern tree"], drawn: false, palette: ["#1B1F3B", "#3B3F73", "#FFD36E"] },
  { n: 9, id: "aurora", name: "The Aurora Kingdom", at: 150_000_000, boost: 256, signature: ["Northern lights that dance to her streak", "Ice-crystal gardens", "An aurora palace with a crystal throne for Oscar"], drawn: false, palette: ["#0F2A3A", "#5EE6C1", "#B79CF2"] },
  { n: 10, id: "infinite", name: "The Infinite Garden", at: 500_000_000, boost: 512, signature: ["Everything in gold", "A garden that blooms forever", "Oscar's crown"], drawn: false, palette: ["#2B2112", "#E7B53C", "#FFF1C7"] },
];

export const SINGULARITY_AT = 1_000_000_000;

/** Realms open by lifetime aura, never close again. */
export function realmsOpenFor(total: number) {
  return REALMS.filter((r) => total >= r.at).length;
}

export function realmBoostFor(realmsOpen: number) {
  return 2 ** Math.max(0, realmsOpen - 1);
}

/** Prestige stars: one per billion beyond the singularity. */
export function prestigeStars(total: number) {
  return Math.max(0, Math.floor(total / 1e9) - 1);
}

// Realm 1 ladder (brief 9.2). Front-loaded: seven unlocks within 1,000 aura.
const HOME: Omit<Unlock, "realm">[] = [
  { id: "grass", name: "A patch of grass, a sprout and Oscar's box", at: 0, home: true, blurb: "Where it all begins." },
  { id: "daisy", name: "Your first daisy", at: 25, line: "Your very first flower. I'm emotional.", blurb: "From your very first task." },
  { id: "sun", name: "The sun breaks through", at: 100, line: "Would you look at that. Sunshine!", blurb: "The clouds part over the garden." },
  { id: "tulips", name: "A tulip bed", at: 250, line: "Tulips! Pick their colour.", blurb: "In a colour you pick." },
  { id: "path", name: "A stepping-stone path", at: 400, line: "A path. Now we're going places.", blurb: "Stepping stones across the lawn." },
  { id: "hut", name: "Oscar's wooden hut", at: 600, home: true, line: "I've a ROUND DOOR now. Come in!", blurb: "A cosy hut with a round door." },
  { id: "butterflies", name: "Butterflies", at: 800, line: "Ooh, new neighbours! The butterflies have moved in.", blurb: "They drift about the flowers." },
  { id: "apple-tree", name: "An apple tree sapling", at: 1_000, line: "A tiny apple tree. It grows with your aura.", blurb: "It keeps growing as your aura does." },
  { id: "pond", name: "A lily pond", at: 1_500, line: "A pond! I'm a turtle. This is huge.", blurb: "Lily pads and a soft shimmer." },
  { id: "bench", name: "A bench and a bird feeder", at: 2_000, line: "A robin's visiting the feeder. Fair play.", blurb: "Visited by a robin." },
  { id: "sunflowers", name: "Sunflowers", at: 2_500, line: "Sunflowers taller than me. Easily.", blurb: "Big, bright and cheerful." },
  { id: "hammock", name: "A second tree and a hammock", at: 3_000, line: "A hammock. I'll be in it if you need me.", blurb: "Strung between the two trees." },
  { id: "cottage", name: "Oscar's pond-side cottage", at: 4_000, home: true, line: "A porch AND a window box? Spoiled.", blurb: "With a porch and a window box." },
  { id: "lights", name: "Fairy lights and lanterns", at: 5_000, line: "Fairy lights! Wait till it gets dark.", blurb: "They glow at night." },
  { id: "pool", name: "A swimming pool", at: 6_500, line: "A pool, with a float for me. Cannonball!", blurb: "With a float for Oscar." },
  { id: "cherry", name: "A cherry blossom tree", at: 8_000, line: "Cherry blossom. The garden's showing off now.", blurb: "Soft pink petals." },
  { id: "villa", name: "Oscar's shell-shaped villa", at: 10_000, home: true, line: "A villa with a hot tub. I've made it.", blurb: "With a hot tub." },
  { id: "fountain", name: "A fountain", at: 12_500, line: "A fountain. Very fancy. Very us.", blurb: "Gentle splashes all day." },
  { id: "greenhouse", name: "A greenhouse", at: 15_000, line: "A greenhouse! Tomatoes incoming.", blurb: "Glass, light and seedlings." },
  { id: "rainbow", name: "A rainbow and a hot-air balloon", at: 20_000, line: "A rainbow after the rain. Classic Ireland.", blurb: "After the drizzle, every time." },
  { id: "well", name: "A wishing well", at: 30_000, line: "A wishing well. I wished for more of you.", blurb: "Toss a coin in." },
  { id: "gazebo", name: "A gazebo with climbing roses", at: 40_000, line: "A rose gazebo. We're basically royalty.", blurb: "Wrapped in climbing roses." },
  { id: "gate", name: "The garden gate opens", at: 50_000, line: "The gate's open. There's a whole meadow out here!", blurb: "A path leads to the Wildflower Meadow." },
];

const REALM_ITEMS: Record<string, [string, string, string?][]> = {
  meadow: [
    ["poppies", "A poppy field"], ["beehives", "Beehives"], ["picnic", "A picnic blanket"], ["hares", "Hares"],
    ["windmill", "A windmill"], ["kite", "A kite"], ["meadow-cottage", "Oscar's meadow cottage", "home"], ["wildflowers", "Wildflowers everywhere"],
    ["clover", "A clover patch"],
    ["daisy-chain", "A daisy chain"],
    ["bunting", "Meadow bunting"],
    ["skylark", "A skylark"],
  ],
  lake: [
    ["jetty", "A rowing boat and jetty"], ["swans", "Swans"], ["orchard", "Orchard rows"], ["willow", "A weeping willow"],
    ["lilies", "Water lilies"], ["fireworks", "Fireworks over the water"], ["lake-house", "Oscar's lake house", "home"], ["sunset-dock", "A sunset dock"],
    ["ducks", "A family of ducks"],
    ["stepping-logs", "Stepping logs"],
    ["pear-tree", "A pear tree"],
    ["lanterns-lake", "Floating lanterns"],
  ],
  woodland: [
    ["fairy-ring", "A fairy ring of mushrooms"], ["foxes", "A fox family"], ["deer", "Deer"], ["owl", "An owl"],
    ["rope-bridge", "A rope bridge"], ["toadstools", "Glowing toadstools"], ["treehouse", "Oscar's treehouse", "home"], ["fireflies", "A firefly glade"],
    ["ferns", "A fern hollow"],
    ["hedgehog", "A hedgehog"],
    ["acorn-swing", "An acorn swing"],
    ["mossy-log", "A mossy log"],
  ],
  cove: [
    ["lighthouse", "A lighthouse"], ["beach-hut", "A beach hut"], ["rock-pools", "Rock pools"], ["dolphins", "Dolphins"],
    ["sandcastle", "A sandcastle"], ["surfboard", "A surfboard for Oscar"], ["seaside-villa", "Oscar's seaside villa", "home"], ["shells", "A shell garden"],
    ["crabs", "Two crabs"],
    ["kite-beach", "A beach kite"],
    ["tide-pool", "A tide pool"],
    ["seals", "Seals"],
  ],
  mountains: [
    ["waterfall", "A waterfall"], ["cable-car", "A cable car"], ["hot-springs", "Hot springs"], ["eagles", "Eagles"],
    ["observatory", "An observatory"], ["lodge", "Oscar's mountain lodge", "home"], ["edelweiss", "Edelweiss meadows"], ["summit", "A summit flag"],
    ["goats", "Mountain goats"],
    ["prayer-flags", "Bright flags"],
    ["pine-grove", "A pine grove"],
    ["telescope", "A telescope"],
  ],
  sky: [
    ["islands", "Floating islands"], ["airship", "An airship"], ["cloud-bridges", "Cloud bridges"], ["sky-whales", "Gentle sky whales"],
    ["rainbow-falls", "Rainbow falls"], ["sky-castle", "Oscar's sky castle", "home"], ["cloud-garden", "A cloud garden"], ["kites", "Sky kites"],
    ["cloud-sheep", "Cloud sheep"],
    ["sky-lanterns", "Sky lanterns"],
    ["bubble-garden", "A bubble garden"],
    ["sky-ferry", "A sky ferry"],
  ],
  starlight: [
    ["moon-garden", "A moon garden"], ["constellations", "Constellations of your projects"], ["comet", "A comet"], ["planet-swing", "A planet swing"],
    ["star-tree", "A star-lantern tree"], ["moon-house", "Oscar's moon cottage", "home"], ["nebula", "A nebula pond"], ["shooting-stars", "Shooting stars"],
    ["star-pond", "A star pond"],
    ["moon-moths", "Moon moths"],
    ["galaxy-path", "A galaxy path"],
    ["orbit-swing", "An orbit swing"],
  ],
  aurora: [
    ["northern-lights", "Northern lights that dance to your streak"], ["ice-garden", "Ice-crystal gardens"], ["snow-owls", "Snowy owls"], ["ice-bridge", "An ice bridge"],
    ["crystal-trees", "Crystal trees"], ["aurora-palace", "The aurora palace", "home"], ["crystal-throne", "A crystal throne for Oscar"], ["polar-lights", "Polar lanterns"],
    ["snow-hares", "Snow hares"],
    ["ice-lanterns", "Ice lanterns"],
    ["frost-roses", "Frost roses"],
    ["aurora-bridge", "An aurora bridge"],
  ],
  infinite: [
    ["gold-garden", "Everything in gold"], ["eternal-bloom", "A garden that blooms forever"], ["gold-fountain", "A golden fountain"], ["gold-trees", "Golden trees"],
    ["halo", "A halo of light"], ["golden-palace", "Oscar's golden palace", "home"], ["oscar-crown", "Oscar's crown"], ["infinite-path", "A path that never ends"],
    ["gold-butterflies", "Golden butterflies"],
    ["gold-pond", "A golden pond"],
    ["gold-bench", "A golden bench"],
    ["gold-lights", "Golden lights"],
  ],
};

/**
 * Geometric spacing between a realm's entry and the next realm's entry.
 * Each realm has its signature unlocks plus a few small decor pieces, tuned
 * so something new still arrives every couple of weeks in later years.
 */
function realmLadder(realm: Realm, nextAt: number): Unlock[] {
  const items = REALM_ITEMS[realm.id] ?? [];
  const n = items.length;
  return items.map(([id, name, tag], i) => {
    const t = (i + 1) / (n + 1);
    const at = Math.round((realm.at * (nextAt / realm.at) ** t) / 500) * 500;
    return { id, name, at, realm: realm.n, home: tag === "home" };
  });
}

export const UNLOCKS: Unlock[] = [
  ...HOME.map((u) => ({ ...u, realm: 1 })),
  ...REALMS.slice(1).flatMap((r, i) => [
    { id: `realm-${r.id}`, name: r.name, at: r.at, realm: r.n, blurb: "A new realm opens." } as Unlock,
    ...realmLadder(r, REALMS[i + 2]?.at ?? SINGULARITY_AT),
  ]),
].sort((a, b) => a.at - b.at);

export function unlocksUpTo(total: number) {
  return UNLOCKS.filter((u) => u.at <= total);
}

export function nextUnlock(total: number) {
  return UNLOCKS.find((u) => u.at > total) ?? null;
}

export function unlockById(id: string) {
  return UNLOCKS.find((u) => u.id === id);
}

export function realmByN(n: number) {
  return REALMS[n - 1];
}
