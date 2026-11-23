"use client";

import { useEffect } from "react";
import { useNow, useReducedMotion, useSettings } from "@/lib/hooks";
import { configureHaptics, configureSound, installAudioUnlock } from "@/lib/sound";
import { configureCelebrations } from "@/lib/game/instant";
import { gardenDay } from "@/lib/day";
import { updateSettings } from "@/lib/data/settings";
import { checkAchievements } from "@/lib/game/achievements-check";

/** Applies sound, haptics and celebration settings to the non-React modules. */
export function GameRuntime() {
  const s = useSettings();
  const reduce = useReducedMotion();
  useEffect(() => installAudioUnlock(), []);
  // Record each day she opens the garden (a secret trophy), then catch up on
  // anything earned with time alone, like one year since her unwrap.
  const now = useNow(10 * 60_000);
  const today = s ? gardenDay(now, s.timezone) : null;
  const opened = s && today ? s.openDays.includes(today) : true;
  useEffect(() => {
    if (!s || !today || opened) return;
    void updateSettings({ openDays: [...s.openDays, today].slice(-400) }).then(() => checkAchievements());
  }, [s, today, opened]);
  useEffect(() => {
    if (!s) return;
    configureSound({ enabled: s.sound, volume: s.volume });
    configureHaptics(s.haptics);
    configureCelebrations({ style: s.celebration, reduceMotion: reduce });
  }, [s, reduce]);
  return null;
}
