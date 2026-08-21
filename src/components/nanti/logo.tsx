import { cn } from "@/lib/utils";

export function Logo({ className, showWord = true }: { className?: string; showWord?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-[13px] font-bold text-primary-foreground">
        N
      </span>
      {showWord && (
        <span className="text-[15px] font-bold tracking-[0.18em] text-foreground">NANTI</span>
      )}
    </span>
  );
}
