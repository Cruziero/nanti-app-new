import { cn } from "@/lib/utils";

export function Logo({ className, showWord = true }: { className?: string; showWord?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <img
        src="/icon-192.png"
        alt=""
        aria-hidden
        className="size-7 rounded-lg"
      />
      {showWord && (
        <span className="text-[15px] font-bold tracking-[0.18em] text-foreground">NANTI</span>
      )}
    </span>
  );
}
