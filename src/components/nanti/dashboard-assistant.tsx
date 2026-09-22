import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useNanti } from "@/lib/nanti-store";
import { askAssistant, analyzeConversation } from "@/lib/nanti-ai.functions";
import { draftToItem } from "@/lib/nanti-import";
import type { Item } from "@/lib/nanti-types";
import { todayISO } from "@/lib/nanti-utils";

type Message = { role: "user" | "assistant"; text: string };
export function DashboardAssistant() {
  const { items, people, projects, addItems } = useNanti();
  const [mode, setMode] = useState<"ask" | "paste">("ask");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [drafts, setDrafts] = useState<Item[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [source, setSource] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const field = useRef<HTMLTextAreaElement>(null);
  const submit = async () => {
    if (!input.trim() || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    const question = input.trim();
    try {
      if (mode === "paste") {
        const result = await analyzeConversation({ data: { text: question } });
        const next = result.items.map((draft) =>
          draftToItem(draft, { people, projects, sourceType: "paste" }),
        );
        setDrafts(next);
        setSelected(next.map((i) => i.id));
        setSource(question);
        if (!next.length)
          setError("No tasks found. Add more context to the conversation and try again.");
      } else {
        const taskContext = items
          .filter((i) => i.status === "open" || i.status === "inbox")
          .map((i) =>
            JSON.stringify({
              title: i.title,
              status: i.status,
              due: i.due,
              kind: i.kind,
              person: people.find((p) => p.id === i.personId)?.name || i.personName,
            }),
          )
          .join("\n")
          .slice(0, 12000);
        const history = messages
          .slice(-6)
          .map((m) => `${m.role}: ${m.text.slice(0, 800)}`)
          .join("\n");
        const context = `Today (Asia/Jakarta): ${todayISO()}\nSaved tasks (may be truncated):\n${taskContext}\nRecent conversation:\n${history}`;
        const result = await askAssistant({ data: { question, context } });
        setMessages((m) => [
          ...m,
          { role: "user", text: question },
          { role: "assistant", text: result.answer },
        ]);
        setInput("");
      }
    } catch {
      setError(
        mode === "ask"
          ? "NANTI couldn’t answer. Your message is still here; please try again."
          : "The conversation couldn’t be analyzed. Your text is still here; please try again.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const save = async () => {
    if (lock.current || !selected.length) return;
    lock.current = true;
    setBusy(true);
    setError("");
    const chosen = drafts.filter((i) => selected.includes(i.id));
    try {
      const saved = await addItems(chosen, source);
      const ids = new Set(saved.flatMap((index) => (chosen[index] ? [chosen[index].id] : [])));
      setDrafts((list) => list.filter((i) => !ids.has(i.id)));
      setSelected((list) => list.filter((id) => !ids.has(id)));
      if (saved.length) toast.success(`${saved.length} item${saved.length === 1 ? "" : "s"} saved`);
      if (saved.length !== chosen.length)
        setError("Some items weren’t saved. They remain here for you to retry.");
      if (ids.size === drafts.length) {
        setInput("");
        setSource("");
      }
    } catch {
      setError("Items couldn’t be saved. Your drafts are still here. Please try again.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <section
      id="ask-nanti"
      className="rounded-xl border border-emerald-900/10 bg-[#eef4ef] p-4 sm:p-6 dark:border-border dark:bg-secondary"
      aria-labelledby="assistant-heading"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="assistant-heading" className="font-serif text-2xl text-foreground">
            Ask NANTI
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask what you’re forgetting, or turn a conversation into tasks.
          </p>
        </div>
        <div
          className="flex gap-1 rounded-lg border border-border bg-background p-1"
          aria-label="Assistant mode"
        >
          {(["ask", "paste"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              disabled={busy || drafts.length > 0}
              onClick={() => {
                setMode(value);
                setError("");
                field.current?.focus();
              }}
              className={`min-h-11 rounded-md px-3 text-sm font-medium disabled:opacity-50 ${mode === value ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
            >
              {value === "ask" ? "Chat" : "Paste conversation"}
            </button>
          ))}
        </div>
      </div>
      {mode === "ask" && messages.length > 0 && (
        <div
          role="log"
          aria-label="Conversation with NANTI"
          className="mb-4 max-h-80 space-y-4 overflow-y-auto rounded-lg border border-border bg-background p-4"
        >
          {messages.map((message, index) => (
            <div
              key={index}
              className={message.role === "user" ? "ml-4 border-b border-border pb-3" : "pr-2"}
            >
              <p className="mb-1 text-xs font-semibold text-muted-foreground">
                {message.role === "user" ? "You" : "NANTI"}
              </p>
              <p className="whitespace-pre-wrap break-words text-sm leading-7">{message.text}</p>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            AI suggestions can be mistaken. Check dates and details before acting.
          </p>
        </div>
      )}
      {drafts.length === 0 ? (
        <>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
            className="rounded-lg border border-border bg-background p-3"
          >
            <label htmlFor="dashboard-question" className="sr-only">
              {mode === "ask" ? "Message NANTI" : "Conversation to analyze"}
            </label>
            <textarea
              id="dashboard-question"
              ref={field}
              value={input}
              disabled={busy}
              maxLength={mode === "ask" ? 2000 : 20000}
              onChange={(event) => setInput(event.target.value)}
              rows={mode === "ask" ? 2 : 5}
              placeholder={
                mode === "ask"
                  ? "What am I forgetting? What should I follow up on?"
                  : "Paste your WhatsApp conversation here…"
              }
              className="block w-full resize-y bg-transparent p-1 text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                {mode === "ask"
                  ? "Answers use your saved tasks."
                  : "Review the extracted items before saving."}
              </span>
              <button
                disabled={busy || !input.trim() || input.length > (mode === "ask" ? 2000 : 20000)}
                className="min-h-11 shrink-0 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {busy ? "Working…" : mode === "ask" ? "Send" : "Find tasks"}
              </button>
            </div>
          </form>
          {mode === "ask" && (
            <div className="mt-3 flex flex-wrap gap-2">
              {["What am I forgetting?", "Who should I follow up with?", "What’s due today?"].map(
                (prompt) => (
                  <button
                    key={prompt}
                    disabled={busy}
                    onClick={() => {
                      setInput(prompt);
                      field.current?.focus();
                    }}
                    className="min-h-11 rounded-md px-2 text-left text-xs text-foreground underline decoration-border underline-offset-4 hover:decoration-current disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ),
              )}
            </div>
          )}
          {mode === "paste" && (
            <Link
              to="/app/import"
              className="mt-2 inline-flex min-h-11 items-center text-sm underline underline-offset-4"
            >
              Import a screenshot instead
            </Link>
          )}
        </>
      ) : (
        <div className="space-y-3">
          <h3 className="font-semibold">Review before saving</h3>
          <p className="text-sm text-muted-foreground">
            Unclear items go to your inbox for review.
          </p>
          {drafts.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-lg border border-border bg-background p-3"
            >
              <label className="flex min-h-11 min-w-11 items-center justify-center">
                <input
                  type="checkbox"
                  aria-label={`Save ${item.title}`}
                  checked={selected.includes(item.id)}
                  disabled={busy}
                  onChange={(event) =>
                    setSelected((ids) =>
                      event.target.checked ? [...ids, item.id] : ids.filter((id) => id !== item.id),
                    )
                  }
                  className="size-5 accent-emerald-800"
                />
              </label>
              <div className="min-w-0 flex-1">
                <label className="text-xs text-muted-foreground">
                  Task
                  <input
                    value={item.title}
                    disabled={busy}
                    maxLength={500}
                    onChange={(event) =>
                      setDrafts((list) =>
                        list.map((i) =>
                          i.id === item.id ? { ...i, title: event.target.value } : i,
                        ),
                      )
                    }
                    className="mt-1 block min-h-11 w-full rounded border border-border bg-background px-2 text-sm text-foreground"
                  />
                </label>
                <p className="mt-2 text-xs text-muted-foreground">
                  {item.status === "inbox"
                    ? "Needs clarification · Inbox"
                    : item.kind === "waiting"
                      ? "Waiting for a response"
                      : item.due || "No deadline detected"}
                </p>
              </div>
            </div>
          ))}
          <div className="flex flex-wrap gap-3">
            <button
              disabled={
                busy ||
                !selected.length ||
                drafts.some((i) => selected.includes(i.id) && !i.title.trim())
              }
              onClick={() => void save()}
              className="min-h-11 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {busy ? "Saving…" : `Save selected (${selected.length})`}
            </button>
            <button
              disabled={busy}
              onClick={() => {
                setDrafts([]);
                setSelected([]);
                setError("");
              }}
              className="min-h-11 rounded-lg border border-border px-4 text-sm"
            >
              Back to conversation
            </button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-800 dark:text-red-300">
          {error}
        </p>
      )}
      {busy && (
        <p role="status" className="sr-only">
          NANTI is processing your request.
        </p>
      )}
    </section>
  );
}
