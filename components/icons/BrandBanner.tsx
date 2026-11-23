import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * The full Swap 'N' Serve Cup logo. Its lettering is white, so it only ever
 * sits on a dark tile (assets/README.md). Used unmodified from public/brand.
 */
export function SwapNServeBanner({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-[20px] bg-[radial-gradient(120%_120%_at_30%_10%,#3a3226_0%,#1d1a16_60%)] p-4",
        className,
      )}
    >
      <Image
        src="/brand/swapnserve-cup-logo.png"
        alt="Swap 'N' Serve Cup"
        width={1800}
        height={1204}
        priority={priority}
        sizes="(max-width: 768px) 60vw, 320px"
        className="h-full w-auto max-w-full object-contain"
      />
    </div>
  );
}
