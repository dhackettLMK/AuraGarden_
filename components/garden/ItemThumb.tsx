import { Sprout } from "lucide-react";

/** Thumbnail art for a garden unlock. Phase 4 swaps in each item's own SVG. */
export function ItemThumb({ id, size = 64 }: { id: string; size?: number }) {
  void id;
  return <Sprout size={size * 0.6} className="text-primary" strokeWidth={1.5} />;
}
