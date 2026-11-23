"use client";

import { useEffect, useState } from "react";
import { Copy, Download, Mail, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getGardenKey } from "@/lib/data/garden";
import { updateSettings } from "@/lib/data/settings";
import { useSettings } from "@/lib/hooks";
import { toast } from "@/components/ui/toast-store";
import { downloadQrCard, gardenLink, mailtoLink, qrDataUrl } from "./link-tools";

/** The secret link as a QR and text, with Copy, Save QR and Email (brief 6.8, 12.4). */
export function SaveLinkPanel({ compact = false, onSaved }: { compact?: boolean; onSaved?: () => void }) {
  const settings = useSettings();
  const [link, setLink] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    let live = true;
    void getGardenKey().then(async (k) => {
      if (!k || !live) return;
      const l = gardenLink(k);
      setLink(l);
      setQr(await qrDataUrl(l, 360));
    });
    return () => {
      live = false;
    };
  }, []);
  const name = settings?.displayName || "My";
  const saved = async () => {
    await updateSettings({ linkSavedAt: Date.now() });
    onSaved?.();
  };
  if (!link) return <div className="h-48" />;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {qr && <img src={qr} alt="QR code for your secret garden link" width={compact ? 120 : 150} height={compact ? 120 : 150} className="rounded-2xl bg-white p-2 shadow-[var(--shadow-soft)]" />}
        <p className="min-w-0 flex-1 break-all rounded-2xl bg-surface-sunk p-3 font-mono text-[12px] text-ink-muted" aria-label="Secret garden link">
          {link}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="soft"
          size="sm"
          onClick={async () => {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            toast("Link copied");
            void saved();
          }}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />} Copy link
        </Button>
        <Button
          variant="soft"
          size="sm"
          onClick={async () => {
            await downloadQrCard(link, name);
            void saved();
          }}
        >
          <Download size={16} /> Save QR to Photos
        </Button>
        <a href={mailtoLink(link, name)} onClick={() => void saved()} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary-soft px-3.5 text-sm font-semibold text-primary-strong dark:text-primary">
          <Mail size={16} /> Email it to myself
        </a>
      </div>
    </div>
  );
}
