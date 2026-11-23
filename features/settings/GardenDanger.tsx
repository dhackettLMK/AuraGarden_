"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { toast } from "@/components/ui/toast-store";
import { deleteGardenEverywhere, rotateGardenKey } from "@/lib/sync/api";

/** "Make a new link": rotates the key; old links stop working (brief 6.8, 12.1). */
export function RotateLinkButton() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <KeyRound size={16} /> Make a new link
      </Button>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title="Make a new link?"
        description="Your old link and QR stop working. Other devices will ask you to scan the new one."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await rotateGardenKey();
                  toast("New link made. Save it somewhere safe.");
                  setOpen(false);
                } catch (e) {
                  toast(e instanceof Error ? e.message : "Couldn't make a new link right now.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Make a new link
            </Button>
          </>
        }
      >
        <p className="text-[15px] text-ink-muted">Do this if you think someone else has your link.</p>
      </Sheet>
    </>
  );
}

/** "Delete this garden": a two-step confirm; wipes it everywhere. */
export function DeleteGardenSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [typed, setTyped] = useState("");
  const router = useRouter();
  const close = (v: boolean) => {
    onOpenChange(v);
    if (!v) {
      setStep(1);
      setTyped("");
    }
  };
  return (
    <Sheet open={open} onOpenChange={close} title={step === 1 ? "Delete this garden?" : "Are you really sure?"} description={step === 1 ? "Every task, thought, person, trophy and flower goes, on every device. This can't be undone." : "Type DELETE to confirm."} size="sm">
      {step === 1 ? (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => close(false)}>
            Keep my garden
          </Button>
          <Button variant="danger" onClick={() => setStep(2)}>
            Continue
          </Button>
        </div>
      ) : (
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (typed.trim().toUpperCase() !== "DELETE") return;
            await deleteGardenEverywhere();
            close(false);
            router.replace("/");
          }}
        >
          <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="DELETE" aria-label="Type DELETE to confirm" autoFocus />
          <Button type="submit" variant="danger" className="w-full" disabled={typed.trim().toUpperCase() !== "DELETE"}>
            Delete everything
          </Button>
        </form>
      )}
    </Sheet>
  );
}
