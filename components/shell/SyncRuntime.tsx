"use client";

import { useEffect } from "react";
import { startSync } from "@/lib/sync/engine";

/** Starts the SyncEngine once a garden is open on this device. */
export function SyncRuntime() {
  useEffect(() => {
    void startSync();
  }, []);
  return null;
}
