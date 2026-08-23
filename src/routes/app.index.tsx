import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowUp, Loader as Loader2, ArrowRight } from "lucide-react";
import { Logo } from "@/components/nanti/logo";
import { Textarea } from "@/components/ui/textarea";
import { useNanti } from "@/lib/nanti-store";
import { askAssistant } from "@/lib/nanti-ai.functions";
import { dueLabel, kindLabel, openItems, waitingDays } from "@/lib/nanti-utils";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [{ title: "Ask NANTI" }, { name: "description", content: "Your memory, on demand." }],
  }),
  component: AiPage,
});

const suggestions = [
  "What am I forgetting?",
  "Who am I waiting for?",
  "What did I promise this week?",
  "Who should I follow up with?",
  "What's due today?",
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
        return `- [${kindLabel[i.kind]}] ${i.title} | person: ${p ? `${p.name} (${p.org})` : "-"} | project: ${projectOf(i.projectId)?.name ?? "-"} | ${i.kind === "waiting" ? `waiting ${waitingDays(i)} days` : dueLabel(i)} | source: ${i.source} | quote: "${i.quote}"`;
      })
      .join("\n");

  const send = async (question: string) => {
    if (!question.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await askAssistant({ data: { question, context: buildContext() } });
      setMessages((m) => [...m, { role: "assistant", text: res.answer }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "NANTI cannot answer right now");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center">
      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="mb-8 text-center">
            <Logo showWord={false} />
            <h1 className="mt-5 text-[28px] font-semibold tracking-tight sm:text-[34px]">
              Ask NANTI
            </h1>
            <p className="mt-2 text-[15px] text-muted-foreground">Your memory, on demand.</p>
          </div>

          <div className="w-full max-w-lg">
            <div className="flex items-end gap-2 rounded-xl border border-border bg-surface p-2">
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
                placeholder="Ask NANTI anything..."
                className="max-h-32 min-h-10 resize-none border-0 bg-transparent text-[15px] shadow-none focus-visible:ring-0"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                onClick={() => void send(input)}
                className="mb-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
              >
                <ArrowUp className="size-4" />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => void send(s)}
                  className="rounded-full border border-border px-3 py-1 text-[12.5px] text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-2xl">
          <div className="mb-8">
            <h1 className="text-[24px] font-semibold tracking-tight">Ask NANTI</h1>
          </div>

          <div className="space-y-6">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[80%] rounded-xl bg-primary px-4 py-2.5 text-[14px] text-primary-foreground">
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={i} className="whitespace-pre-wrap text-[14.5px] leading-relaxed">
                  {renderRich(m.text)}
                </div>
              ),
            )}

            {loading && (
              <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
                <Loader2 className="size-3 animate-spin" /> Thinking...
              </p>
            )}

            <div ref={endRef} />
          </div>

          <div className="sticky bottom-20 mt-8 lg:bottom-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
              className="flex items-end gap-2 rounded-xl border border-border bg-surface p-2"
            >
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
                placeholder="Ask NANTI anything..."
                className="max-h-32 min-h-10 resize-none border-0 bg-transparent text-[14.5px] shadow-none focus-visible:ring-0"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="mb-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
              >
                <ArrowUp className="size-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
