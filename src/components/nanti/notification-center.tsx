import { useState } from "react";
import { Bell, Check, Clock, AlertTriangle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type:
    | "due_soon"
    | "due_today"
    | "overdue"
    | "waiting_too_long"
    | "followup_suggestion"
    | "daily_briefing";
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  itemId?: string;
}

const typeIcons: Record<string, typeof Bell> = {
  due_soon: Clock,
  due_today: Clock,
  overdue: AlertTriangle,
  waiting_too_long: Clock,
  followup_suggestion: MessageSquare,
  daily_briefing: Bell,
};

const typeColors: Record<string, string> = {
  due_soon: "text-amber-500",
  due_today: "text-primary",
  overdue: "text-red-500",
  waiting_too_long: "text-orange-500",
  followup_suggestion: "text-blue-500",
  daily_briefing: "text-primary",
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export function NotificationCenter({
  notifications,
  onMarkRead,
}: {
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-background shadow-lg">
            <div className="border-b border-border px-4 py-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-semibold">Notifikasi</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={() => {
                      for (const n of notifications.filter((n) => !n.read)) {
                        onMarkRead(n.id);
                      }
                    }}
                    className="text-[12px] text-primary hover:underline"
                  >
                    Tandai semua dibaca
                  </button>
                )}
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-[13px] text-muted-foreground">Tidak ada notifikasi</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = typeIcons[n.type] || Bell;
                  const color = typeColors[n.type] || "text-muted-foreground";
                  return (
                    <button
                      key={n.id}
                      onClick={() => {
                        onMarkRead(n.id);
                      }}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface",
                        !n.read && "bg-accent/30",
                      )}
                    >
                      <Icon className={cn("mt-0.5 size-4 shrink-0", color)} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium">{n.title}</p>
                        <p className="mt-0.5 text-[12px] text-muted-foreground line-clamp-2">
                          {n.body}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground/70">
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                      {!n.read && <div className="mt-1 size-2 shrink-0 rounded-full bg-primary" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
