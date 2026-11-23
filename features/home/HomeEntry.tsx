"use client";

import dynamic from "next/dynamic";

/** Home loads only once a garden is open, so the welcome page stays light. */
const loadHome = () => import("./HomeView").then((m) => m.HomeView);
if (typeof window !== "undefined") void loadHome();
export const HomeEntry = dynamic(loadHome, { ssr: false });
