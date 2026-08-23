import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Hourglass, Clock, AlertTriangle, Copy, Check } from "lucide-react";
import { PageHeader, EmptyState, Section } from "@/components/nanti/app-shell";
import { useNanti } from "@/lib/nanti-store";
import {
  detectFollowUps,
  generateFollowUpMessage,
} from "@/lib/nanti-followup";
import { formatDate } from "@/lib/nanti-utils";
import type { FollowUpSuggestion } from "@/lib/nanti-followup";

export const Route = createFileRoute("/app/follow-ups")({
  head: () => ({
    meta: [
      { title: "Follow-ups - NANTI" },
      { name: "description", content: "Draft follow-up messages for items that need attention." },
    ],
  }),
  component: FollowUpsPage,
});

const typeIcons: Record<string, typeof AlertTriangle> = {
  overdue_commitment: AlertTriangle,
  stale_waiting: Hourglass,
  waiting_no_response: Clock,
  potentially_forgotten: Clock,
};

const typeLabels: Record<string, string> = {
  overdue_commitment: "Overdue",
  stale_waiting: "Stale",
  waiting_no_response: "Waiting",
  potentially_forgotten: "Forgotten",
};

function FollowUpsPage() {
  const { items, people, settings } = useNanti();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const suggestions = useMemo(() => detectFollowUps(items, people), [items, people]);

  const copyMessage = (suggestion: FollowUpSuggestion) => {
    const msg = generateFollowUpMessage(suggestion, settings.tone);
    navigator.clipboard.writeText(msg).then(() => {
      setCopiedId(suggestion.itemId);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div>
      <PageHeader title="Follow-ups" subtitle="Draft follow-up messages for items that need attention" />

      {suggestions.length === 0 ? (
        <EmptyState
          title="Nothing to follow up on."
          hint="NANTI will remind you when someone owes you a response."
        />
      ) : (
        <Section count={suggestions.length}>
          {suggestions.map((s) => {
            const Icon = typeIcons[s.type] || Clock;
            const isCopied = copiedId === s.itemId;
            return (
              <div key={s.itemId} className="flex items-start gap-3 px-1 py-3">
                <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/60" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {typeLabels[s.type]}
                    </span>
                    <p className="text-[14px] font-medium">{s.title}</p>
                  </div>
                  <p className="mt-1 text-[12.5px] text-muted-foreground">
                    {s.personName && `${s.personName} - `}
                    {s.suggestedAction}
                  </p>
                </div>
                <button
                  onClick={() => copyMessage(s)}
                  className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-[11.5px] font-medium text-muted-foreground transition-colors hover:bg-secondary"
                >
                  {isCopied ? (
                    <><Check className="size-3 text-primary" /> Copied</>
                  ) : (
                    <><Copy className="size-3" /> Draft</>
                  )}
                </button>
              </div>
            );
          })}
        </Section>
      )}
    </div>
  );
}
