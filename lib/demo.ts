import { createGarden, hasGarden } from "./data/garden";

/** Seeds a garden for screenshots and tests. */
export async function seedDemo(kind: string) {
  if (await hasGarden()) return;
  if (kind === "blank") await createGarden({ name: "Sam" });
  else await createGarden({ name: "Laura", giftSlug: "laura" });
}
