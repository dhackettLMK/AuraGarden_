"use client";

import { useEffect, useRef, useState } from "react";
import { extractKey } from "@/lib/key";

/** Scan a garden QR with the camera: BarcodeDetector where available, @zxing/browser otherwise. */
export function QrScanner({ onKey, onClose }: { onKey: (key: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let stop = () => {};
    let cancelled = false;
    (async () => {
      try {
        const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
        if (BD) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          if (cancelled) return stream.getTracks().forEach((t) => t.stop());
          video.current!.srcObject = stream;
          await video.current!.play();
          const detector = new BD({ formats: ["qr_code"] });
          let alive = true;
          stop = () => {
            alive = false;
            stream.getTracks().forEach((t) => t.stop());
          };
          const tick = async () => {
            if (!alive) return;
            const found = await detector.detect(video.current!).catch(() => []);
            const key = found.map((f) => extractKey(f.rawValue)).find(Boolean);
            if (key) {
              stop();
              onKey(key);
            } else requestAnimationFrame(tick);
          };
          void tick();
        } else {
          const { BrowserQRCodeReader } = await import("@zxing/browser");
          const reader = new BrowserQRCodeReader();
          const controls = await reader.decodeFromVideoDevice(undefined, video.current!, (result) => {
            const key = result ? extractKey(result.getText()) : null;
            if (key) {
              controls.stop();
              onKey(key);
            }
          });
          stop = () => controls.stop();
        }
      } catch {
        setError("Couldn't open the camera. Allow camera access, or paste the link instead.");
      }
    })();
    return () => {
      cancelled = true;
      stop();
    };
  }, [onKey]);
  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-3xl bg-black">
        <video ref={video} className="aspect-square w-full object-cover" playsInline muted />
        <div className="pointer-events-none absolute inset-[18%] rounded-3xl border-4 border-white/80" aria-hidden="true" />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <button onClick={onClose} className="h-11 w-full rounded-full text-sm font-semibold text-ink-muted hover:bg-surface-sunk">
        Cancel
      </button>
    </div>
  );
}
