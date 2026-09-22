import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AlertCircle, CheckCircle, HelpCircle } from "lucide-react";
import { EmptyState, PageHeader, Section } from "@/components/nanti/app-shell";
import { KindBadge } from "@/components/nanti/kind-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNanti } from "@/lib/nanti-store";
import { dueLabel } from "@/lib/nanti-utils";
import { parseSmartDate } from "@/lib/nanti-dates";
import type { Item, ItemKind } from "@/lib/nanti-types";

export const Route = createFileRoute("/app/inbox")({
  head: () => ({
    meta: [
      { title: "Inbox - NANTI" },
      { name: "description", content: "Review what NANTI found in your conversations." },
    ],
  }),
  component: InboxPage,
});

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  if (value >= 0.8) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-600">
        <CheckCircle className="size-3" />
        {pct}% confident
      </span>
    );
  }
  if (value >= 0.5) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600">
        <AlertCircle className="size-3" />
        {pct}% — review
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">
      <HelpCircle className="size-3" />
      {pct}% — needs info
    </span>
  );
}

function InboxItem({
  item,
  onTrack,
  onIgnore,
  onClarify,
}: {
  item: Item;
  onTrack: () => void;
  onIgnore: () => void;
  onClarify: () => void;
}) {
  const person = item.personName || "";
  const project = item.projectName || "";

  return (
    <div className="flex items-start gap-3 px-1 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <KindBadge kind={item.kind} />
          <p className="truncate text-[14px] font-medium">{item.title}</p>
          <ConfidenceBadge value={item.confidence} />
        </div>
        {item.quote && (
          <p className="mt-1.5 text-[12.5px] italic text-muted-foreground">
            "{item.quote}"
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[11.5px] text-muted-foreground">
          {person && <span>{person}</span>}
          {project && <span>{project}</span>}
          {item.kind !== "waiting" && item.due && <span>{dueLabel(item)}</span>}
        </div>
        {item.aiNote && (
          <p className="mt-1.5 text-[12px] text-muted-foreground/70">
            Why NANTI knows: {item.aiNote}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {item.clarificationQuestion ? (
          <>
            <Button size="sm" variant="outline" onClick={onClarify}>
              Answer
            </Button>
            <Button size="sm" variant="ghost" onClick={onIgnore}>
              Skip
            </Button>
          </>
        ) : item.confidence >= 0.8 ? (
          <Button size="sm" onClick={onTrack}>
            Remember
          </Button>
        ) : item.confidence >= 0.5 ? (
          <>
            <Button size="sm" onClick={onTrack}>
              Yes
            </Button>
            <Button size="sm" variant="ghost" onClick={onIgnore}>
              No
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={onClarify}>
              Clarify
            </Button>
            <Button size="sm" variant="ghost" onClick={onIgnore}>
              Skip
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function ClarifyDialog({
  item,
  onSave,
  onIgnore,
  onCancel,
}: {
  item: Item;
  onSave: (answer: string) => void;
  onIgnore: () => void;
  onCancel: () => void;
}) {
  const [answer, setAnswer] = useState(item.personName || "");
  const type = item.clarificationType || "confirmation";
  const question =
    item.clarificationQuestion ||
    (type === "person"
      ? "Kamu sedang menunggu siapa?"
      : type === "date" || type === "time"
        ? "Kapan ini harus dilakukan?"
        : "Mau NANTI simpan ini sebagai tugas?");

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
        One thing I need
      </p>
      <p className="mt-1 text-[13px] font-medium text-amber-900">{question}</p>
      <p className="mt-1 text-[11.5px] text-amber-800/70">For: {item.title}</p>

      {type === "confirmation" ? (
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={() => onSave("yes")}>Yes, remember it</Button>
          <Button size="sm" variant="outline" onClick={onIgnore}>No, ignore it</Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>Later</Button>
        </div>
      ) : (
        <>
          <Input
            autoFocus
            className="mt-3 border-amber-200 bg-white"
            placeholder={
              type === "person"
                ? "Person name"
                : type === "time"
                  ? "e.g. tomorrow at 10am"
                  : "e.g. Friday or 28 September"
            }
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && answer.trim()) onSave(answer.trim());
            }}
          />
          <div className="mt-3 flex gap-2">
            <Button size="sm" disabled={!answer.trim()} onClick={() => onSave(answer.trim())}>
              Save answer
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
          </div>
        </>
      )}
    </div>
  );
}

function InboxPage() {
  const { items, track, ignore } = useNanti();
  const [clarifyingId, setClarifyingId] = useState<string | null>(null);
  const list = items.filter((i) => i.status === "inbox");

  const handleTrack = async (id: string) => {
    if (!await track(id)) return;
    toast.success("Remembered");
  };

  const handleIgnore = async (id: string) => {
    if (!await ignore(id)) return;
    toast("Skipped");
  };

  const handleClarifySave = async (answer: string) => {
    if (!clarifyingId) return;
    const item = items.find((candidate) => candidate.id === clarifyingId);
    if (!item) return;

    if ((item.clarificationType || "confirmation") === "confirmation") {
      if (!await track(clarifyingId)) return;
    } else if (item.clarificationType === "person") {
      if (!await track(clarifyingId, { personName: answer.trim() })) return;
    } else {
      const parsed = parseSmartDate(answer);
      if (!parsed.date && !parsed.time) {
        toast.error('I could not read that time. Try "tomorrow at 10am".');
        return;
      }
      if (!await track(clarifyingId, {
        due: parsed.date ?? undefined,
        time: parsed.time ?? undefined,
      })) return;
    }

    toast.success("Remembered with details");
    setClarifyingId(null);
  };

  return (
    <div>
      <PageHeader
        title="Inbox"
        subtitle="Review what NANTI found — confirm, skip, or clarify"
      />

      {list.length === 0 ? (
        <EmptyState
          title="Inbox is clean."
          hint="Import a conversation and NANTI will find things to remember."
        />
      ) : (
        <Section count={list.length}>
          {list.map((item) =>
            clarifyingId === item.id ? (
              <ClarifyDialog
                key={item.id}
                item={item}
                onSave={(answer) => void handleClarifySave(answer)}
                onIgnore={() => void handleIgnore(item.id)}
                onCancel={() => setClarifyingId(null)}
              />
            ) : (
              <InboxItem
                key={item.id}
                item={item}
                onTrack={() => void handleTrack(item.id)}
                onIgnore={() => void handleIgnore(item.id)}
                onClarify={() => setClarifyingId(item.id)}
              />
            ),
          )}
        </Section>
      )}
    </div>
  );
}
