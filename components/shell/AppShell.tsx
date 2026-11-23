"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MotionConfig } from "motion/react";
import { useGardenStatus, useSettings } from "@/lib/hooks";
import { GameProvider } from "@/lib/game/GameProvider";
import { Toaster } from "@/components/ui/Toaster";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { TabBar } from "./TabBar";
import { MoreSheet } from "./MoreSheet";
import { ThemeSync } from "./ThemeSync";
import { Welcome } from "@/features/welcome/Welcome";
import { ShellSkeleton } from "./ShellSkeleton";
import { PageTransition } from "./PageTransition";
import { Shortcuts } from "./Shortcuts";
import { Onboarding } from "@/features/onboarding/Onboarding";
import { QuickAdd } from "@/features/quickadd/QuickAdd";
import { CelebrationLayer } from "@/components/celebrate/CelebrationLayer";
import { GameRuntime } from "@/components/celebrate/GameRuntime";
import { AuraSheet } from "@/features/aura/AuraSheet";
import { TaskSheet } from "@/features/tasks/TaskSheet";
import { TaskPickerSheet } from "@/features/tasks/TaskPickerSheet";

export function AppShell({ children }: { children: React.ReactNode }) {
  const status = useGardenStatus();
  const pathname = usePathname();
  const router = useRouter();
  const settings = useSettings();

  useEffect(() => {
    if (status === "none" && pathname !== "/") router.replace("/");
  }, [status, pathname, router]);
  // Arriving from the unwrap: the header slides down and the tab bar rises.
  const [fromUnwrap] = useState(() => typeof window !== "undefined" && window.location.search.includes("from=unwrap"));

  if (status === "loading" || (status === "ready" && !settings)) return <ShellSkeleton />;
  if (status === "none") return <Welcome />;

  return (
    <MotionConfig reducedMotion={settings?.reduceMotion ? "always" : "user"}>
      <GameProvider>
        <ThemeSync />
        <GameRuntime />
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
        <QuickAdd />
        <TaskSheet />
        <TaskPickerSheet />
        <Shortcuts />
        <AuraSheet />
        <CelebrationLayer />
        <Onboarding />
        <Toaster />
      </GameProvider>
    </MotionConfig>
  );
}
