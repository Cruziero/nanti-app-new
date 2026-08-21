import { cn } from "@/lib/utils";
import { kindLabel } from "@/lib/nanti-utils";
import type { ItemKind } from "@/lib/nanti-types";

const styles: Record<ItemKind, string> = {
  task: "bg-secondary text-secondary-foreground",
  commitment: "bg-accent text-accent-foreground",
  deadline: "bg-warning/15 text-warning-foreground",
  waiting: "bg-primary/10 text-primary",
  followup: "bg-secondary text-muted-foreground",
};

export function KindBadge({ kind, className }: { kind: ItemKind; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide",
        styles[kind],
        className,
      )}
    >
      {kindLabel[kind]}
    </span>
  );
}
