import { Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Item } from "@/lib/nanti-types";
import { useNanti } from "@/lib/nanti-store";
import { dueLabel, isOverdue } from "@/lib/nanti-utils";
import { useItemDetail } from "./item-detail";
import { toast } from "sonner";

export function ItemRow({ item, index = 0 }: { item: Item; index?: number }) {
  const { personOf, complete } = useNanti();
  const open = useItemDetail();
  const person = personOf(item.personId);
  const overdue = isOverdue(item);

  return (
    <div
      className="rise group flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 transition-colors hover:border-border hover:bg-surface"
      style={{ animationDelay: `${index * 35}ms` }}
    >
      <button
        aria-label="Tandai selesai"
        onClick={(e) => {
          e.stopPropagation();
          complete(item.id);
          toast.success(`Selesai: ${item.title}`);
        }}
        className="flex size-5 shrink-0 items-center justify-center rounded-full border border-border text-transparent transition-all hover:border-primary hover:text-primary active:scale-90"
      >
        <Check className="size-3" strokeWidth={3} />
      </button>

      <button
        onClick={() => open(item.id)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-[14.5px] font-medium",
              item.status === "done" && "text-muted-foreground line-through",
            )}
          >
            {item.title}
          </p>
          <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">
            {person ? `${person.org}` : item.source}
            {item.time ? ` · ${item.time}` : ""}
          </p>
        </div>
        <span
          className={cn(
            "flex shrink-0 items-center gap-1 text-[12px] font-medium",
            overdue ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {overdue && <Clock className="size-3.5" />}
          {dueLabel(item)}
        </span>
      </button>
    </div>
  );
}
