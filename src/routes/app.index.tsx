import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowUp,
  Loader as Loader2,
  MessageSquare,
  Calendar,
  Clock,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/nanti/app-shell";
import { Logo } from "@/components/nanti/logo";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useNanti } from "@/lib/nanti-store";
import { askAssistant, generateFollowUpMessage } from "@/lib/nanti-ai.functions";
import { dueLabel, kindLabel, openItems, waitingDays } from "@/lib/nanti-utils";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Ask NANTI · Your work memory" },
      {
        name: "description",
        content:
          "Ask anything about your work: what you're forgetting, who you're waiting for, what's overdue.",
      },
      { property: "og:title", content: "Ask NANTI · Your work memory" },
      {
        property: "og:description",
        content: "Chief of staff AI that remembers all your work conversations.",
      },
    ],
  }),
  component: AiPage,
});

const suggestions = [
  "What am I forgetting?",
  "What should I do today?",
  "Who am I waiting for?",
  "Who is waiting for me?",
  "What did I promise this week?",
  "What's overdue?",
  "What's the most urgent thing?",
  "Who should I follow up with today?",
];

function renderRich(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}

interface Msg {
  role: "user" | "assistant";
  text: string;
}

function AiPage() {
  const { items, personOf, projectOf } = useNanti();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [followUpSuggestions, setFollowUpSuggestions] = useState<
    Array<{ itemId: string; message: string; personName: string }>
  >([]);
  const ref = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, [loading]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const buildContext = () =>
    openItems(items)
      .map((i) => {
        const p = personOf(i.personId);
        return `- [${kindLabel[i.kind]}] ${i.title} | person: ${p ? `${p.name} (${p.org})` : "-"} | project: ${
          projectOf(i.projectId)?.name ?? "-"
        } | ${i.kind === "waiting" ? `waiting ${waitingDays(i)} days` : dueLabel(i)} | source: ${i.source} | quote: "${i.quote}"`;
      })
      .join("\n");

  const generateFollowUps = async () => {
    const waitingItems = openItems(items).filter(
      (i) => i.kind === "waiting" && waitingDays(i) >= 2,
    );
    const suggestions = await Promise.all(
      waitingItems.slice(0, 3).map(async (item) => {
        try {
          const person = personOf(item.personId);
          const days = waitingDays(item);
          const res = await generateFollowUpMessage({
            data: {
              itemTitle: item.title,
              personName: person?.name || "teman Anda",
              waitDays: days,
              tone: "friendly",
            },
          });
          return {
            itemId: item.id,
            message: res.message,
            personName: person?.name || "Unknown",
          };
        } catch {
          return null;
        }
      }),
    );
    setFollowUpSuggestions(suggestions.filter(Boolean) as typeof followUpSuggestions);
  };

  const send = async (question: string) => {
    if (!question.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await askAssistant({ data: { question, context: buildContext() } });
      setMessages((m) => [...m, { role: "assistant", text: res.answer }]);

      if (
        question.toLowerCase().includes("follow up") ||
        question.toLowerCase().includes("followup")
      ) {
        void generateFollowUps();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "NANTI cannot answer right now");
    } finally {
      setLoading(false);
    }
  };

  const sendFollowUp = async (message: string) => {
    setMessages((m) => [...m, { role: "user", text: message }]);
    setLoading(true);
    try {
      const res = await askAssistant({
        data: { question: `Help me send this follow-up: ${message}`, context: buildContext() },
      });
      setMessages((m) => [...m, { role: "assistant", text: res.answer }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengirim follow-up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-9rem)] flex-col">
      <PageHeader title="Ask NANTI" subtitle="Your work memory" />

      <div className="flex-1 space-y-6">
        {messages.length === 0 && (
          <div className="rise">
            <div className="card-soft p-6">
              <Logo showWord={false} />
              <p className="mt-3 text-[15px] font-medium">
                I remember all your work conversations.
              </p>
              <p className="mt-1 text-[13.5px] text-muted-foreground">
                Ask me anything — I'll answer from your commitments, deadlines and waiting items.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-[13px] transition-colors hover:border-primary/50 hover:bg-accent/40"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="rise flex justify-end">
              <p className="max-w-[85%] rounded-2xl bg-primary px-4 py-2.5 text-[14.5px] text-primary-foreground">
                {m.text}
              </p>
            </div>
          ) : (
            <div key={i} className="rise whitespace-pre-wrap text-[15px] leading-relaxed">
              {renderRich(m.text)}
            </div>
          ),
        )}

        {loading && (
          <p className="flex items-center gap-2 text-[14px] text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> NANTI is thinking...
          </p>
        )}

        {followUpSuggestions.length > 0 && !loading && (
          <div className="rise rounded-xl border border-border bg-surface p-4">
            <div className="mb-3 flex items-center gap-2">
              <MessageSquare className="size-4 text-primary" />
              <h3 className="text-[14px] font-semibold">Saran Follow-up</h3>
            </div>
            <div className="space-y-2">
              {followUpSuggestions.map((s) => (
                <div
                  key={s.itemId}
                  className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] text-muted-foreground">Untuk {s.personName}</p>
                    <p className="mt-1 text-[13px]">{s.message}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => sendFollowUp(s.message)}>
                    <ArrowRight className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="sticky bottom-20 mt-6 lg:bottom-4"
      >
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-surface p-2 shadow-soft">
          <Textarea
            ref={ref}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            rows={1}
            placeholder="Ask NANTI anything about your work..."
            className="max-h-40 min-h-10 resize-none border-0 bg-transparent text-[14.5px] shadow-none focus-visible:ring-0"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="mb-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
