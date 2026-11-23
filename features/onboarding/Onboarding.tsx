"use client";

import { Dialog } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ArrowRight, Share, PlusSquare, MoreVertical, Download } from "lucide-react";
import { Oscar } from "@/components/oscar/Oscar";
import { AuraOrb } from "@/components/icons/AuraOrb";
import { Button } from "@/components/ui/Button";
import { ProjectIcon } from "@/components/icons/ProjectIcon";
import { GardenScene } from "@/components/garden/Scene";
import { createTask } from "@/lib/data/tasks";
import { getGardenKey } from "@/lib/data/garden";
import { updateSettings } from "@/lib/data/settings";
import { useProjects, useSettings, useTask } from "@/lib/hooks";
import { useTaskActions } from "@/features/tasks/useTaskActions";
import { LeafCheckbox } from "@/features/tasks/LeafCheckbox";
import { SaveLinkPanel } from "@/features/link/SaveLinkPanel";
import { gardenLink, isIOS, isStandalone } from "@/features/link/link-tools";
import { useSyncStatus } from "@/lib/sync/status";

type Step = "aura" | "garden" | "projects" | "task" | "link" | "install";
const STEPS: Step[] = ["aura", "garden", "projects", "task", "link", "install"];

/**
 * First ever start (brief 4, 12.4): three cards (Aura, Garden, Projects)
 * ending on her first task, then save the secret link and add to Home Screen.
 */
export function Onboarding() {
  const settings = useSettings();
  const [step, setStep] = useState<Step>("aura");
  if (!settings || settings.onboardedAt) return null;
  const i = STEPS.indexOf(step);
  const next = () => (i < STEPS.length - 1 ? setStep(STEPS[i + 1]) : finish());
  const finish = async () => {
    try {
      await navigator.storage?.persist?.();
    } catch {
      /* best effort */
    }
    await updateSettings({ onboardedAt: Date.now() });
  };
  return (
    <Dialog.Root open>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-[#1c1712]/40 backdrop-blur-[3px]" />
        <Dialog.Content
          aria-describedby={undefined}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className="fixed inset-x-0 bottom-0 z-[81] mx-auto flex max-h-[94dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[32px] bg-surface shadow-[var(--shadow-lift)] outline-none md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:rounded-[32px]"
        >
          <div className="flex justify-center gap-1.5 pt-4" aria-hidden="true">
            {STEPS.map((s, k) => (
              <span key={s} className={`h-1.5 rounded-full transition-all ${k === i ? "w-6 bg-primary" : k < i ? "w-1.5 bg-primary/50" : "w-1.5 bg-line"}`} />
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-4">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
                {step === "aura" && <AuraCard onNext={next} name={settings.displayName} />}
                {step === "garden" && <GardenCard onNext={next} />}
                {step === "projects" && <ProjectsCard onNext={next} />}
                {step === "task" && <FirstTaskCard onNext={next} />}
                {step === "link" && <LinkCard onNext={next} />}
                {step === "install" && <InstallCard onNext={finish} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <Dialog.Title asChild>
      <h2 className="font-display text-[28px] font-semibold leading-tight">{children}</h2>
    </Dialog.Title>
  );
}

function Next({ onClick, label = "Next", disabled }: { onClick: () => void; label?: string; disabled?: boolean }) {
  return (
    <Button size="lg" className="mt-6 w-full" onClick={onClick} disabled={disabled}>
      {label} <ArrowRight size={18} />
    </Button>
  );
}

function AuraCard({ onNext, name }: { onNext: () => void; name: string }) {
  return (
    <div className="text-center">
      <div className="relative mx-auto flex h-44 items-center justify-center">
        <AuraOrb size={130} />
        <span className="aura-text-glow absolute right-[18%] top-4 font-display text-[34px] font-bold">+25</span>
      </div>
      <Title>Every task earns aura</Title>
      <p className="mt-2 text-[16px] text-ink-muted">
        Tick something off and I&apos;ll hand you +25 aura{name ? `, ${name}` : ""}. Keep going and boosts multiply it. It only ever goes up.
      </p>
      <Next onClick={onNext} />
    </div>
  );
}

function GardenCard({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center">
      <div className="-mx-6 overflow-hidden">
        <GardenScene layout="wide" unlocked={new Set(["grass", "daisy", "sun", "tulips", "path", "hut", "butterflies"])} total={900} timeOfDay="afternoon" season="spring" ambient title="A garden in bloom" />
      </div>
      <div className="mt-4">
        <Title>Aura grows your garden</Title>
        <p className="mt-2 text-[16px] text-ink-muted">It starts as a patch of grass and my cardboard box. Daisies, butterflies and whole new realms are waiting.</p>
      </div>
      <Next onClick={onNext} />
    </div>
  );
}

function ProjectsCard({ onNext }: { onNext: () => void }) {
  const projects = useProjects() ?? [];
  return (
    <div className="text-center">
      <div className="mx-auto flex h-36 items-center justify-center gap-3">
        {projects.length ? projects.slice(0, 4).map((p) => <ProjectIcon key={p.id} project={p} size={64} />) : <Oscar size={120} pose="thinking" />}
      </div>
      <Title>{projects.length ? "Your projects are ready" : "Make it yours"}</Title>
      <p className="mt-2 text-[16px] text-ink-muted">
        {projects.length ? "Each one has its own tasks, notes and people, and climbs its own ranks. Rename, recolour or add more any time." : "Add projects for the big things in your life. Each climbs its own ranks."}
      </p>
      <Next onClick={onNext} />
    </div>
  );
}

function FirstTaskCard({ onNext }: { onNext: () => void }) {
  const [text, setText] = useState("");
  const [taskId, setTaskId] = useState<string | null>(null);
  const task = useTask(taskId ?? undefined);
  const { toggle } = useTaskActions();
  const done = task?.status === "done";
  return (
    <div className="text-center">
      <Oscar size={110} pose={done ? "cheer" : "wave"} className="mx-auto" />
      <Title>{done ? "Your first aura!" : "What's one small thing for today?"}</Title>
      {!task ? (
        <form
          className="mt-4 flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!text.trim()) return;
            const t = await createTask({ title: text.trim(), sectionId: "sec_mylist_today", today: true });
            setTaskId(t.id);
          }}
        >
          <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Reply to Aoife" aria-label="Your first task" className="h-12 min-w-0 flex-1 rounded-full bg-surface-sunk px-4 outline-none focus:ring-2 focus:ring-primary/60" />
          <Button type="submit" disabled={!text.trim()}>
            Add
          </Button>
        </form>
      ) : (
        <div className="mt-4 flex items-center gap-3 rounded-[18px] bg-surface-sunk p-3 text-left">
          <LeafCheckbox checked={done} onChange={(v, o) => void toggle(task, v, o)} label={done ? "Done" : `Complete "${task.title}"`} />
          <span className="hand-strike text-[17px]" data-done={done}>
            {task.title}
          </span>
        </div>
      )}
      <p className="mt-3 text-[15px] text-ink-muted">{!task ? "Keep it tiny. You can add more later." : done ? "That's your first flower in the garden. Lovely." : "Now tick it. Go on."}</p>
      <Next onClick={onNext} disabled={!done} label={done ? "Next" : "Tick it to carry on"} />
      {!done && (
        <button onClick={onNext} className="mt-3 text-sm font-semibold text-ink-muted underline-offset-4 hover:underline">
          Later
        </button>
      )}
    </div>
  );
}

function LinkCard({ onNext }: { onNext: () => void }) {
  const sync = useSyncStatus();
  return (
    <div>
      <div className="flex items-end gap-2">
        <Oscar size={84} pose="proud" />
        <p className="mb-6 rounded-2xl rounded-bl-md bg-surface-sunk px-3 py-2 text-[15px] font-medium">Quick one: save your secret garden link somewhere safe.</p>
      </div>
      <Title>Your secret garden link</Title>
      <p className="mb-4 mt-2 text-[15px] text-ink-muted">
        There are no passwords, so this link is the only key to your garden. Save it to Photos or email it to yourself.
        {sync === "off" && " (Sync is off on this site right now, so the link works on this device only.)"}
      </p>
      <SaveLinkPanel compact />
      <Next onClick={onNext} label="I've saved it" />
    </div>
  );
}

function InstallCard({ onNext }: { onNext: () => void }) {
  const ios = typeof window !== "undefined" && isIOS();
  const installed = typeof window !== "undefined" && isStandalone();
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <Title>Add AuraGarden to your Home Screen</Title>
      <p className="mt-2 text-[15px] text-ink-muted">
        {installed ? "You're already using the app. Perfect." : "It opens like an app and keeps your garden safe. On iPhone, Safari can clear sites you haven't visited in a while, but a Home Screen app keeps its own storage."}
      </p>
      {!installed && (
        <ol className="mt-4 space-y-2">
          {ios ? (
            <>
              <Step n={1} icon={<Share size={18} />}>Tap the Share button in Safari.</Step>
              <Step n={2} icon={<PlusSquare size={18} />}>Choose “Add to Home Screen”, then Add.</Step>
              <Step n={3} icon={<Download size={18} />}>Open it from your Home Screen and tap “Paste my garden link”.</Step>
            </>
          ) : (
            <>
              <Step n={1} icon={<MoreVertical size={18} />}>Open your browser menu.</Step>
              <Step n={2} icon={<Download size={18} />}>Tap “Install app” (or “Add to Home screen”).</Step>
            </>
          )}
        </ol>
      )}
      {!installed && ios && (
        <Button
          variant="soft"
          className="mt-4 w-full"
          onClick={async () => {
            const k = await getGardenKey();
            if (k) await navigator.clipboard.writeText(gardenLink(k));
            setCopied(true);
          }}
        >
          {copied ? "Link copied. Paste it in the new app." : "Copy my garden link first"}
        </Button>
      )}
      <Next onClick={onNext} label="Go to my garden" />
    </div>
  );
}

function Step({ n, icon, children }: { n: number; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-surface-sunk p-3 text-[15px]">
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-ink">{n}</span>
      <span className="flex-1">{children}</span>
      <span className="text-ink-muted">{icon}</span>
    </li>
  );
}
