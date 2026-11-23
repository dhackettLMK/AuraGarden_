"use client";

import { useEffect } from "react";
import { useReducedMotion, useSettings } from "@/lib/hooks";
import { configureHaptics, configureSound, installAudioUnlock } from "@/lib/sound";
import { configureCelebrations } from "@/lib/game/instant";

/** Applies sound, haptics and celebration settings to the non-React modules. */
export function GameRuntime() {
  const s = useSettings();
  const reduce = useReducedMotion();
  useEffect(() => installAudioUnlock(), []);
  useEffect(() => {
    if (!s) return;
    configureSound({ enabled: s.sound, volume: s.volume });
    configureHaptics(s.haptics);
    configureCelebrations({ style: s.celebration, reduceMotion: reduce });
  }, [s, reduce]);
  return null;
}
