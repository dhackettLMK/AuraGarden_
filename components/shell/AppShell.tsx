"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
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

export function AppShell({ children }: { children: React.ReactNode }) {
  const status = useGardenStatus();
  const pathname = usePathname();
  const router = useRouter();
  const settings = useSettings();

  useEffect(() => {
    if (status === "none" && pathname !== "/") router.replace("/");
  }, [status, pathname, router]);

  if (status === "loading" || (status === "ready" && !settings)) return <ShellSkeleton />;
  if (status === "none") return <Welcome />;

  return (
    <MotionConfig reducedMotion={settings?.reduceMotion ? "always" : "user"}>
      <GameProvider>
        <ThemeSync />
        <div className="paper-grain relative flex min-h-dvh">
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
        <Toaster />
      </GameProvider>
    </MotionConfig>
  );
}
