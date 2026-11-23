"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardPaste } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { extractKey } from "@/lib/key";

/** Paste a secret link (scanning arrives with sync in phase 8). */
export function JoinSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function go(value: string) {
    const key = extractKey(value);
    if (!key) {
      setError("That doesn't look like a garden link. It should end in #k= and a long code.");
      return;
    }
    onOpenChange(false);
    router.push(`/join#k=${key}`);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Open my garden" description="Paste your secret garden link to open it on this device.">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(text);
        }}
        className="space-y-3"
      >
        <Input value={text} onChange={(e) => { setText(e.target.value); setError(null); }} placeholder="https://…/join#k=…" aria-label="Secret garden link" autoComplete="off" spellCheck={false} />
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              try {
                const t = await navigator.clipboard.readText();
                setText(t);
                go(t);
              } catch {
                setError("Couldn't read the clipboard. Paste the link into the box instead.");
              }
            }}
          >
            <ClipboardPaste size={18} /> Paste my garden link
          </Button>
          <Button type="submit" className="flex-1" disabled={!text.trim()}>
            Open garden
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
