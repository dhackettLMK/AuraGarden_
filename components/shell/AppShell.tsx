"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useGardenStatus, useSettings } from "@/lib/hooks";
import { Welcome } from "@/features/welcome/Welcome";
import { ShellSkeleton } from "./ShellSkeleton";

const loadGardenApp = () => import("./GardenApp");
// Start fetching the app while IndexedDB answers, rather than after.
if (typeof window !== "undefined") void loadGardenApp();
const GardenApp = dynamic(loadGardenApp, { ssr: false, loading: () => <ShellSkeleton /> });

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
  return <GardenApp>{children}</GardenApp>;
}
