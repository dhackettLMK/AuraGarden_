"use client";

import { Switch as RSwitch } from "radix-ui";

export function Switch({
  checked,
  onCheckedChange,
  label,
  id,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: string;
  id?: string;
}) {
  return (
    <RSwitch.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={label}
      className="relative inline-flex h-[30px] w-[52px] shrink-0 items-center rounded-full bg-line transition-colors data-[state=checked]:bg-primary"
    >
      <RSwitch.Thumb className="block h-6 w-6 translate-x-[3px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.18)] transition-transform duration-200 will-change-transform data-[state=checked]:translate-x-[25px]" />
    </RSwitch.Root>
  );
}
