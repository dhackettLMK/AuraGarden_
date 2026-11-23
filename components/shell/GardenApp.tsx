"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useUI } from "@/lib/ui-store";
import { useTaskPicker } from "@/features/tasks/picker-store";
import { MotionConfig } from "motion/react";
import { useSettings } from "@/lib/hooks";
import { GameProvider } from "@/lib/game/GameProvider";
import { Toaster } from "@/components/ui/Toaster";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { TabBar } from "./TabBar";
import { MoreSheet } from "./MoreSheet";
import { ThemeSync } from "./ThemeSync";
import { PageTransition } from "./PageTransition";
import { Shortcuts } from "./Shortcuts";
import { SyncRuntime } from "./SyncRuntime";
import { CelebrationLayer } from "@/components/celebrate/CelebrationLayer";
import { GameRuntime } from "@/components/celebrate/GameRuntime";

// Heavy sheets load when first opened (and are prefetched once the page is idle).
const loaders = {
  quickAdd: () => import("@/features/quickadd/QuickAdd").then((m) => m.QuickAdd),
  taskSheet: () => import("@/features/tasks/TaskSheet").then((m) => m.TaskSheet),
  picker: () => import("@/features/tasks/TaskPickerSheet").then((m) => m.TaskPickerSheet),
  aura: () => import("@/features/aura/AuraSheet").then((m) => m.AuraSheet),
  onboarding: () => import("@/features/onboarding/Onboarding").then((m) => m.Onboarding),
};
const QuickAdd = dynamic(loaders.quickAdd, { ssr: false });
const TaskSheet = dynamic(loaders.taskSheet, { ssr: false });
const TaskPickerSheet = dynamic(loaders.picker, { ssr: false });
const AuraSheet = dynamic(loaders.aura, { ssr: false });
const Onboarding = dynamic(loaders.onboarding, { ssr: false });

/** Everything a garden needs once one is open. Loaded lazily so the welcome page stays light. */
export default function GardenApp({ children }: { children: React.ReactNode }) {
  const settings = useSettings();
  // Arriving from the unwrap: the header slides down and the tab bar rises.
  const [fromUnwrap] = useState(() => typeof window !== "undefined" && window.location.search.includes("from=unwrap"));
  const quickAddOpen = useUI((s) => s.quickAdd.open);
  const editingTask = useUI((s) => !!s.editingTask);
  const auraOpen = useUI((s) => s.auraSheetOpen);
  const pickerOpen = useTaskPicker((s) => s.kind !== null);
  const [seen, setSeen] = useState({ quickAdd: false, task: false, aura: false, picker: false });
  // Keep a sheet mounted once it has opened, so its close animation plays.
  if ((quickAddOpen && !seen.quickAdd) || (editingTask && !seen.task) || (auraOpen && !seen.aura) || (pickerOpen && !seen.picker))
    setSeen({ quickAdd: seen.quickAdd || quickAddOpen, task: seen.task || editingTask, aura: seen.aura || auraOpen, picker: seen.picker || pickerOpen });
  useEffect(() => {
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1500));
    ric(() => Object.values(loaders).forEach((l) => void l()));
  }, []);
  return (
    <MotionConfig reducedMotion={settings?.reduceMotion ? "always" : "user"}>
      <GameProvider>
        <ThemeSync />
        <GameRuntime />
        <SyncRuntime />
        <div className={`paper-grain relative flex min-h-dvh ${fromUnwrap ? "from-unwrap" : ""}`}>
          <Sidebar />
          <div className="relative z-[1] flex min-w-0 flex-1 flex-col">
            <Header />
            <main id="main" className="mx-auto w-full max-w-[1180px] flex-1 px-4 pb-[calc(116px+env(safe-area-inset-bottom))] pt-2 md:px-8 md:pb-16">
              <PageTransition>{children}</PageTransition>
            </main>
          </div>
          <TabBar />
        </div>
        <MoreSheet />
        {seen.quickAdd && <QuickAdd />}
        {seen.task && <TaskSheet />}
        {seen.picker && <TaskPickerSheet />}
        <Shortcuts />
        {seen.aura && <AuraSheet />}
        <CelebrationLayer />
        {settings && !settings.onboardedAt && <Onboarding />}
        <Toaster />
      </GameProvider>
    </MotionConfig>
  );
}
