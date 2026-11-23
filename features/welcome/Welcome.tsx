"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Sprout } from "lucide-react";
import { Oscar } from "@/components/oscar/Oscar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { createGarden } from "@/lib/data/garden";
import { LogoMark } from "@/components/shell/Sidebar";
import { JoinSheet } from "./JoinSheet";
import { extractKey } from "@/lib/key";
import { useMounted } from "@/lib/hooks";
import { isStandalone } from "@/features/link/link-tools";
import { ClipboardPaste } from "lucide-react";

/** "/" on a device with no garden (brief 4). Never plays the unwrap. */
export function Welcome() {
  const [step, setStep] = useState<"choose" | "name">("choose");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const router = useRouter();
  const mounted = useMounted();
  // In the installed app on iPhone storage is separate from Safari: lead with pasting the link.
  const standalone = mounted && isStandalone();
  const [pasteError, setPasteError] = useState<string | null>(null);
  async function pasteLink() {
    try {
      const key = extractKey(await navigator.clipboard.readText());
      if (key) router.push(`/join#k=${key}`);
      else setJoinOpen(true);
    } catch {
      setPasteError("Couldn't read the clipboard. Paste the link in the box instead.");
      setJoinOpen(true);
    }
  }

  async function start(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    await createGarden({ name });
    router.replace("/");
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[radial-gradient(120%_80%_at_50%_0%,#FFF7EC_0%,var(--background)_60%)] px-6 py-12 pt-safe dark:bg-[radial-gradient(120%_80%_at_50%_0%,#1d2a23_0%,var(--background)_60%)]">
      <WelcomeHills />
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
        <div className="mb-2 flex items-center gap-2">
          <LogoMark size={28} />
          <span className="font-display text-lg font-semibold">AuraGarden</span>
        </div>
        <Oscar size={150} pose="wave" />
        <h1 className="mt-5 font-display text-[36px] font-semibold leading-[1.05]">
          Grow a garden,
          <br />
          one task at a time.
        </h1>
        <p className="mt-3 text-[16px] text-ink-muted">
          Every task you finish earns aura from Oscar, and aura grows your own little world.
        </p>

        {step === "choose" ? (
          <div className="mt-8 flex w-full flex-col gap-3">
            {standalone && (
              <Button size="lg" onClick={pasteLink}>
                <ClipboardPaste size={20} /> Paste my garden link
              </Button>
            )}
            {pasteError && <p className="text-sm text-danger">{pasteError}</p>}
            <Button size="lg" variant={standalone ? "outline" : "primary"} onClick={() => setStep("name")}>
              <Sprout size={20} /> Start a garden
            </Button>
            <Button size="lg" variant="outline" onClick={() => setJoinOpen(true)}>
              <KeyRound size={18} /> Open my garden
            </Button>
            <p className="mt-2 text-sm text-ink-muted">No sign-up. Your garden stays private behind its own secret link.</p>
          </div>
        ) : (
          <form onSubmit={start} className="mt-8 flex w-full flex-col gap-3 text-left">
            <label htmlFor="garden-name" className="text-sm font-semibold text-ink-muted">
              What should Oscar call you?
            </label>
            <Input id="garden-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Your first name" maxLength={40} autoComplete="given-name" />
            <Button size="lg" type="submit" disabled={!name.trim() || busy}>
              Plant my garden
            </Button>
            <Button variant="ghost" onClick={() => setStep("choose")}>
              Back
            </Button>
          </form>
        )}
      </div>
      <JoinSheet open={joinOpen} onOpenChange={setJoinOpen} />
    </main>
  );
}

function WelcomeHills() {
  return (
    <svg className="pointer-events-none absolute inset-x-0 bottom-0 h-[34vh] w-full" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 120C60 90 120 100 180 115s140 10 220-25V200H0z" fill="var(--primary-soft)" opacity=".7" />
      <path d="M0 150c80-30 150-25 220-10s120 10 180-10V200H0z" fill="var(--primary-soft)" />
      <path d="M0 175c90-18 190-18 400 0V200H0z" fill="var(--primary)" opacity=".18" />
    </svg>
  );
}
