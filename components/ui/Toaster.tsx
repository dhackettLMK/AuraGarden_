"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { Undo2, X } from "lucide-react";
import { useToasts, type Toast } from "./toast-store";

export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[calc(96px+env(safe-area-inset-bottom))] z-[70] flex flex-col items-center gap-2 px-4 lg:bottom-6"
      aria-live="polite"
      role="status"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToasts((s) => s.dismiss);
  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), toast.duration ?? 3200);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, dismiss]);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      className="pointer-events-auto flex min-h-12 w-full max-w-md items-center gap-3 rounded-2xl bg-ink py-2 pl-4 pr-2 text-[15px] text-background shadow-[var(--shadow-lift)]"
    >
      <span className="flex-1">{toast.message}</span>
      {toast.undo && (
        <button
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/12 px-3 text-sm font-semibold text-background hover:bg-white/20 dark:bg-black/10"
          onClick={async () => {
            await toast.undo?.();
            dismiss(toast.id);
          }}
        >
          <Undo2 size={16} strokeWidth={2} /> Undo
        </button>
      )}
      <button
        aria-label="Dismiss"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-background/70 hover:bg-white/10"
        onClick={() => dismiss(toast.id)}
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}
