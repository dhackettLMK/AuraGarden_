"use client";

import { useEffect } from "react";
import { useSettings } from "@/lib/hooks";

/** Mirrors theme, accent and motion settings onto <html> (and localStorage for first paint). */
export function ThemeSync() {
  const s = useSettings();
  const theme = s?.theme;
  const accent = s?.accent;
  const reduce = s?.reduceMotion;
  useEffect(() => {
    if (!theme) return;
    localStorage.setItem("ag-theme", theme);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "auto" && mq.matches);
      document.documentElement.classList.toggle("dark", dark);
      document.querySelector('meta[name="theme-color"]:not([media])')?.setAttribute("content", dark ? "#121A16" : "#FBF7F0");
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);
  useEffect(() => {
    if (accent) {
      document.documentElement.style.setProperty("--accent", accent);
      localStorage.setItem("ag-accent", accent);
    } else {
      document.documentElement.style.removeProperty("--accent");
      localStorage.removeItem("ag-accent");
    }
  }, [accent]);
  useEffect(() => {
    if (reduce === undefined) return;
    document.documentElement.classList.toggle("reduce-motion", reduce);
    localStorage.setItem("ag-reduce-motion", reduce ? "1" : "0");
  }, [reduce]);
  return null;
}
