/**
 * Designed slots for the Home Garden (brief 9.1). Two stages: "wide" 16:10
 * (1600×1000) for desktop and "tall" 4:5 (800×1000) for phones. Every unlock
 * has a slot in both, so any mix of unlocks looks composed.
 */
export type Layout = "wide" | "tall";
export type Slot = [x: number, y: number, scale: number];

export const STAGE: Record<Layout, { w: number; h: number; horizon: number }> = {
  wide: { w: 1600, h: 1000, horizon: 548 },
  tall: { w: 800, h: 1000, horizon: 430 },
};

export const SLOTS: Record<Layout, Record<string, Slot>> = {
  wide: {
    home: [800, 712, 1],
    sprout: [680, 728, 1.3],
    daisy: [612, 812, 1.3],
    tulips: [1004, 834, 1],
    butterflies: [640, 650, 1.1],
    "apple-tree": [200, 760, 1.2],
    pond: [1140, 770, 1],
    bench: [400, 872, 1],
    sunflowers: [1444, 716, 1],
    hammock: [462, 664, 0.95],
    lights: [800, 556, 1],
    "lantern-a": [690, 968, 1],
    "lantern-b": [930, 968, 1],
    pool: [1320, 930, 1],
    cherry: [1540, 664, 0.92],
    fountain: [566, 952, 1],
    greenhouse: [1256, 622, 0.82],
    well: [1010, 950, 0.95],
    gazebo: [636, 606, 0.78],
    gate: [1010, 582, 0.82],
    balloon: [1250, 190, 0.9],
    "corner-college": [104, 948, 1.1],
    "corner-swapnserve": [1540, 880, 0.95],
    "corner-hurley": [318, 592, 1],
    "corner-martial": [64, 636, 0.95],
    "corner-0": [1170, 970, 0.9],
    "corner-1": [870, 624, 0.8],
    "corner-2": [300, 970, 0.9],
    "corner-3": [1380, 612, 0.8],
  },
  tall: {
    home: [400, 632, 0.85],
    sprout: [318, 646, 1.18],
    daisy: [252, 730, 1.18],
    tulips: [572, 744, 0.89],
    butterflies: [290, 566, 1.06],
    "apple-tree": [96, 666, 0.97],
    pond: [592, 846, 0.73],
    bench: [168, 836, 0.89],
    sunflowers: [742, 638, 0.83],
    hammock: [250, 546, 0.73],
    lights: [400, 440, 0.62],
    "lantern-a": [326, 970, 0.94],
    "lantern-b": [474, 970, 0.94],
    pool: [640, 958, 0.59],
    cherry: [730, 534, 0.66],
    fountain: [212, 950, 0.85],
    greenhouse: [586, 506, 0.59],
    well: [536, 900, 0.71],
    gazebo: [300, 506, 0.59],
    gate: [478, 482, 0.66],
    balloon: [620, 170, 0.7],
    "corner-college": [52, 900, 1.0],
    "corner-swapnserve": [742, 800, 0.85],
    "corner-hurley": [160, 492, 0.94],
    "corner-martial": [40, 552, 0.83],
    "corner-0": [640, 586, 0.71],
    "corner-1": [400, 526, 0.65],
    "corner-2": [92, 980, 0.71],
    "corner-3": [700, 900, 0.65],
  },
};

/** Stepping stones from the front edge up to Oscar's door. */
export const PATH_STONES: Record<Layout, [number, number, number][]> = {
  wide: [
    [800, 990, 1.25],
    [782, 936, 1.12],
    [806, 888, 1.0],
    [790, 846, 0.9],
    [806, 810, 0.8],
    [796, 780, 0.7],
    [804, 754, 0.6],
    [800, 732, 0.52],
  ],
  tall: [
    [400, 994, 1.05],
    [384, 940, 0.95],
    [408, 890, 0.84],
    [392, 846, 0.74],
    [406, 808, 0.64],
    [396, 776, 0.56],
    [402, 750, 0.48],
    [400, 728, 0.42],
    [400, 706, 0.38],
    [400, 688, 0.34],
    [400, 672, 0.3],
  ],
};

/** Spare spots for decor mode. */
export const DECOR_SPOTS: Record<Layout, Slot[]> = {
  wide: [
    [880, 900, 0.9],
    [300, 780, 0.9],
    [1460, 972, 0.9],
    [740, 620, 0.8],
    [1130, 640, 0.8],
  ],
  tall: [
    [620, 860, 0.7],
    [118, 760, 0.7],
    [700, 988, 0.6],
    [400, 560, 0.55],
    [560, 600, 0.55],
  ],
};

export const DECOR_ITEMS = new Set(["daisy", "tulips", "bench", "sunflowers", "fountain", "well", "cherry", "gazebo"]);

/** Places Oscar strolls between. */
export const WAYPOINTS: Record<Layout, [number, number][]> = {
  wide: [
    [700, 780],
    [900, 800],
    [560, 860],
    [1060, 900],
    [760, 900],
  ],
  tall: [
    [330, 790],
    [470, 800],
    [270, 880],
    [440, 900],
  ],
};
