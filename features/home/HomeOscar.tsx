"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Oscar } from "@/components/oscar/Oscar";
import { pickLine } from "@/config/oscar-lines";
import { timeOfDay } from "@/lib/day";
import { useNow } from "@/lib/hooks";

/** A 72 px Oscar in the bottom-right of Home. Tap him for a random encouraging line. */
export function HomeOscar({ level, outfit, name }: { level: number; outfit: string | null; name: string }) {
  const [line, setLine] = useState<string | null>(null);
  const [spin, setSpin] = useState(0);
  const now = useNow(5 * 60_000);
  const late = timeOfDay(now) === "late";
  return (
    <div className="pointer-events-none fixed bottom-[calc(92px+env(safe-area-inset-bottom))] right-3 z-20 flex items-end gap-1 md:bottom-6 md:right-6">
      <AnimatePresence>
        {line && (
          <motion.p
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4 }}
            className="pointer-events-auto mb-10 max-w-[200px] rounded-[16px] rounded-br-[6px] bg-surface px-3 py-2 text-[14px] font-medium shadow-[var(--shadow-lift)] ring-1 ring-line"
            role="status"
          >
            {line}
          </motion.p>
        )}
      </AnimatePresence>
      <button
        className="pointer-events-auto"
        aria-label="Oscar. Tap for a word of encouragement"
        onClick={() => {
          setSpin((s) => s + 1);
          setLine(pickLine(late ? "late" : "tap", { name: Math.random() < 0.3 ? name : "" }));
          setTimeout(() => setLine(null), 3200);
        }}
      >
        <Oscar size={72} pose={late ? "sleepy" : "idle"} level={level} outfit={outfit} spinKey={spin} />
      </button>
    </div>
  );
}
