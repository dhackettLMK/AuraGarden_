"use client";

import { EmptyState } from "@/components/ui/EmptyState";

export function ComingSoon({ name }: { name: string }) {
  return <EmptyState title={name} line="Oscar is still planting this bit. Check back soon." pose="thinking" />;
}
