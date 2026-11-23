"use client";

import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Bottom sheet on phones, centred dialog from 768 px (brief 11.4).
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
  hideTitle = false,
  className,
  initialFocus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  hideTitle?: boolean;
  className?: string;
  initialFocus?: boolean;
}) {
  const width = { sm: "md:max-w-sm", md: "md:max-w-lg", lg: "md:max-w-2xl", xl: "md:max-w-4xl" }[size];
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay fixed inset-0 z-50 bg-[#1c1712]/35 backdrop-blur-[2px] dark:bg-black/55" />
        <Dialog.Content
          onOpenAutoFocus={initialFocus === false ? (e) => e.preventDefault() : undefined}
          className={cn(
            "sheet fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-[28px] bg-surface text-ink shadow-[var(--shadow-lift)] outline-none md:w-[calc(100%-48px)] md:rounded-[24px]",
            width,
            className,
          )}
        >
          <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-line md:hidden" aria-hidden="true" />
          <div className={cn("flex items-start gap-3 px-5 pt-3 md:px-6 md:pt-5", hideTitle && "sr-only")}>
            <div className="flex-1">
              <Dialog.Title className="font-display text-[22px] font-semibold leading-tight">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-[15px] text-ink-muted">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            <Dialog.Close
              className="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-muted hover:bg-surface-sunk"
              aria-label="Close"
            >
              <X size={20} strokeWidth={1.75} />
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-3 md:px-6">{children}</div>
          {footer && (
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-line px-5 py-3 pb-[max(12px,env(safe-area-inset-bottom))] md:px-6">
              {footer}
            </div>
          )}
          {!footer && <div className="shrink-0 pb-[env(safe-area-inset-bottom)]" />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function ConfirmSheet({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  danger = true,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  onConfirm: () => void;
  danger?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <button className="h-11 rounded-full px-5 font-semibold text-ink-muted hover:bg-surface-sunk" onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <button
            className={cn(
              "h-11 rounded-full px-5 font-semibold",
              danger ? "bg-danger text-white dark:text-[#2a0f0d]" : "bg-primary text-primary-ink",
            )}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      {children}
    </Sheet>
  );
}
