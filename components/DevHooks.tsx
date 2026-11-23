"use client";

import { useEffect } from "react";

/**
 * Exposes a tiny hook for Playwright screenshots and tests to seed a local
 * garden. It only ever touches this device's IndexedDB.
 */
export function DevHooks() {
  useEffect(() => {
    (window as unknown as { __ag: unknown }).__ag = {
      seedDemo: async (kind: string) => {
        const { seedDemo } = await import("@/lib/demo");
        await seedDemo(kind);
      },
      grant: async (n: number, projectId?: string) => {
        const { grant } = await import("@/lib/demo");
        await grant(n, projectId ?? null);
      },
      moment: async (kind: string) => {
        const { previewMoment } = await import("@/lib/demo");
        await previewMoment(kind);
      },
    };
  }, []);
  return null;
}
