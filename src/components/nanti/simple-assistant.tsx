import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Check, Loader2 } from "lucide-react";
import { useNanti } from "@/lib/nanti-store";
import { processAssistantTurn } from "@/lib/nanti-ai.functions";
import {
  chatMessageToFallbackItems,
  draftToItem,
} from "@/lib/nanti-import";
import type { Item } from "@/lib/nanti-types";
import { parseSmartDate } from "@/lib/nanti-dates";
import {
  isDueToday,
  isOverdue,
  todayISO,
  waitingDays,
} from "@/lib/nanti-utils";
import {
  normalizedIntentText,
} from "@/lib/nanti-language";
import { recordLanguageMemory } from "@/lib/nanti-learning.functions";
import { recordEntityAlias } from "@/lib/nanti-context-memory.functions";
import {
  clearAiMessages,
  createAiMessage,
  fetchAiMessages,
} from "@/lib/nanti-supabase";

type Message = {
  role: "user" | "assistant";
  text: string;
  saved?: string[];
};

type PendingClarification = {
  itemId: string;
  type: NonNullable<Item["clarificationType"]>;
  question: string;
};

type AssistantTurn = Awaited<ReturnType<typeof processAssistantTurn>>;

const suggestions = [
  "What am I forgetting?",
  "What should I do today?",
  "Who should I follow up with?",
  "What's overdue?",
];

function reminderIso(date: string, time: string, offsetMinutes = 0) {
  const base = new Date(`${date}T${time}:00+07:00`);
  if (Number.isNaN(base.getTime())) return undefined;
  return new Date(base.getTime() - offsetMinutes * 60_000).toISOString();
}

function directWorkspaceAnswer(
  question: string,
  items: Item[],
  personName: (item: Item) => string,
) {
  const q = normalizedIntentText(question);
  const openTasks = items.filter(
    (item) => item.status === "open" && item.kind !== "waiting",
  );
  const overdue = openTasks.filter(isOverdue);
  const today = openTasks.filter(isDueToday);
  const waiting = items
    .filter((item) => item.status === "open" && item.kind === "waiting")
    .sort((a, b) => waitingDays(b) - waitingDays(a));
  const inbox = items.filter((item) => item.status === "inbox");

  if (
    /what.*forget|forgetting|\b(lupa|kelupaan)\b|apa.*terlewat/.test(q)
  ) {
    const lines = [
      ...overdue.slice(0, 3).map((item) => `Overdue — ${item.title}`),
      ...today.slice(0, 3).map((item) => `Today — ${item.title}`),
      ...waiting.slice(0, 2).map(
        (item) => `Follow up — ${personName(item)}: ${item.title}`,
      ),
      ...(inbox.length ? [`${inbox.length} item still needs clarification`] : []),
    ];
    return lines.length
      ? ["Here’s what needs your attention:", ...lines].join("\n")
      : "You’re clear right now — no overdue tasks, nothing due today, and no unresolved follow-up.";
  }

  if (
    /what.*do.*today|due.*today|apa.*hari ini|priorit.*hari ini|kerjain.*hari ini/.test(q)
  ) {
    const current = [...overdue, ...today].slice(0, 6);
    return current.length
      ? [
          "Start here:",
          ...current.map(
            (item, index) =>
              `${index + 1}. ${item.title}${item.time ? ` · ${item.time}` : ""}`,
          ),
        ].join("\n")
      : "Nothing is overdue or due today.";
  }

  if (
    /who.*follow|follow.?up|siapa.*(?:hubungi|tunggu)|siapa.*follow/.test(q)
  ) {
    return waiting.length
      ? [
          "Follow up with:",
          ...waiting.slice(0, 6).map(
            (item, index) =>
              `${index + 1}. ${personName(item)} — ${item.title} · ${waitingDays(item)}d`,
          ),
        ].join("\n")
      : "There’s nobody in your active Waiting list right now.";
  }

  if (/what.*overdue|apa.*terlambat|overdue/.test(q)) {
    return overdue.length
      ? ["Overdue:", ...overdue.slice(0, 6).map((item) => `• ${item.title}`)].join("\n")
      : "Nothing is overdue.";
  }

  return null;
}

export function SimpleAssistant() {
  const {
    items,
    people,
    projects,
    addItems,
    editItem,
    complete,
    remove,
    ignore,
    track,
    markWaitingFollowedUp,
  } = useNanti();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<PendingClarification | null>(null);
  const [error, setError] = useState("");
  const field = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const lock = useRef(false);

  const recentItems = useMemo(
    () =>
      [...items]
        .filter((item) => item.status === "open" || item.status === "inbox")
        .sort((a, b) =>
          String(b.createdAt || "").localeCompare(String(a.createdAt || "")),
        )
        .slice(0, 40),
    [items],
  );

  useEffect(() => {
    let cancelled = false;
    fetchAiMessages()
      .then((rows) => {
        if (cancelled) return;
        setMessages(
          rows.slice(-30).map((row) => ({
            role: row.role as Message["role"],
            text: String(row.content || ""),
          })),
        );
      })
      .catch((loadError) =>
        console.error("Failed to load NANTI chat history:", loadError),
      );
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, busy]);

  const personFor = (item: Item) =>
    people.find((person) => person.id === item.personId)?.name ||
    item.personName ||
    "someone";

  const persistTurn = async (
    question: string,
    answer: string,
    metadata: Record<string, unknown> = {},
  ) => {
    const results = await Promise.allSettled([
      createAiMessage({
        data: { role: "user", content: question, metadata: { source: "ask_nanti" } },
      }),
      createAiMessage({
        data: {
          role: "assistant",
          content: answer,
          metadata: { source: "ask_nanti", ...metadata },
        },
      }),
    ]);
    if (results.some((result) => result.status === "rejected")) {
      console.error("Some NANTI messages were not persisted:", results);
    }
  };

  const appendTurn = async (
    question: string,
    answer: string,
    saved: string[] = [],
    metadata: Record<string, unknown> = {},
  ) => {
    setMessages((current) => [
      ...current,
      { role: "user", text: question },
      { role: "assistant", text: answer, saved },
    ]);
    await persistTurn(question, answer, metadata);
  };

  const resolvePending = async (answer: string) => {
    if (!pending) return false;
    const item = items.find((candidate) => candidate.id === pending.itemId);
    if (!item) {
      setPending(null);
      return false;
    }

    if (pending.type === "confirmation") {
      if (/^(ya|iya|yes|y|betul|benar|simpan|save)\b/i.test(answer.trim())) {
        const promoted = await track(item.id);
        if (!promoted) {
          await appendTurn(answer, "I couldn’t save that yet. Try once more.");
          return true;
        }
        setPending(null);
        await appendTurn(answer, "Saved.", [item.title], {
          clarification_resolved: true,
          item_id: promoted,
        });
        return true;
      }
      if (/^(tidak|nggak|ga|gak|no|bukan)\b/i.test(answer.trim())) {
        if (await ignore(item.id)) {
          setPending(null);
          await appendTurn(answer, "Okay, I won’t save that.");
        }
        return true;
      }
      await appendTurn(answer, "Just answer yes or no for this one.");
      return true;
    }

    if (pending.type === "person") {
      const promoted = await track(item.id, { personName: answer.trim() });
      if (!promoted) {
        await appendTurn(answer, "I couldn’t save that person yet.");
        return true;
      }
      setPending(null);
      await appendTurn(answer, `Got it — ${answer.trim()}.`, [item.title], {
        clarification_resolved: true,
        item_id: promoted,
      });
      return true;
    }

    const parsed = parseSmartDate(answer);
    if (!parsed.date && !parsed.time) {
      await appendTurn(answer, pending.question);
      return true;
    }
    const promoted = await track(item.id, {
      due: parsed.date || undefined,
      time: parsed.time || undefined,
    });
    if (!promoted) {
      await appendTurn(answer, "I couldn’t update that timing yet.");
      return true;
    }
    setPending(null);
    await appendTurn(
      answer,
      `Got it${parsed.date ? ` — ${parsed.date}` : ""}${parsed.time ? ` at ${parsed.time}` : ""}.`,
      [item.title],
      { clarification_resolved: true, item_id: promoted },
    );
    return true;
  };

  const teach = async (turn: AssistantTurn, rawMessage: string) => {
    if (!turn.learningType || !turn.learningPattern || !turn.learningMeaning) {
      return false;
    }
    await recordLanguageMemory({
      data: {
        memory_type: turn.learningType,
        pattern_key: `${turn.learningType}:${normalizedIntentText(turn.learningPattern)}`,
        pattern_text: turn.learningPattern,
        learned_value: {
          meaning: turn.learningMeaning,
          ...(turn.learningEntityType
            ? { entityType: turn.learningEntityType }
            : {}),
          ...(turn.reminderOffsetMinutes != null
            ? { offsetMinutes: turn.reminderOffsetMinutes }
            : {}),
        },
        example_text: rawMessage,
        confidence: Math.max(0.86, turn.confidence),
      },
    });

    if (turn.learningType === "entity_alias" && turn.learningEntityType) {
      await recordEntityAlias({
        data: {
          entity_type: turn.learningEntityType,
          canonical_name: turn.learningMeaning,
          alias_text: turn.learningPattern,
          confidence: Math.max(0.9, turn.confidence),
          source: "ask_nanti",
          metadata: { taught_from: rawMessage },
        },
      });
    }
    return true;
  };

  const applyTurn = async (turn: AssistantTurn, rawMessage: string) => {
    if (turn.mode === "answer" || turn.mode === "clarify") {
      return { answer: turn.reply, saved: [] as string[] };
    }

    if (turn.mode === "create") {
      const drafts = turn.items.map((draft) =>
        draftToItem(draft, {
          people,
          projects,
          sourceType: "chat",
          sourceName: "Ask NANTI",
        }),
      );
      if (!drafts.length) {
        return {
          answer:
            turn.reply ||
            "I understand this is something to remember, but I need one more detail.",
          saved: [] as string[],
        };
      }
      const saved = await addItems(drafts, rawMessage);
      const savedTitles = saved.map(({ index }) => drafts[index]!.title);

      const unclear = saved
        .map(({ index, id }) => ({ draft: drafts[index]!, id }))
        .find(({ draft }) => draft.status === "inbox");
      if (unclear) {
        setPending({
          itemId: unclear.id,
          type: unclear.draft.clarificationType || "confirmation",
          question:
            unclear.draft.clarificationQuestion ||
            "Should I save this as a task?",
        });
      }

      const clarification = unclear
        ? `\n\n${unclear.draft.clarificationQuestion || "Should I save this as a task?"}`
        : "";
      return {
        answer: `${turn.reply || "Saved."}${clarification}`,
        saved: savedTitles,
      };
    }

    if (turn.mode === "teach_language") {
      const learned = await teach(turn, rawMessage);
      return {
        answer: learned
          ? turn.reply ||
            `Got it. I’ll remember “${turn.learningPattern}” as “${turn.learningMeaning}”.`
          : "Tell me what phrase or habit you want me to remember.",
        saved: [] as string[],
      };
    }

    const fallbackTarget =
      /\b(itu|tadi|barusan|that|it|yg tadi|yang tadi)\b/i.test(rawMessage)
        ? recentItems[0]
        : undefined;
    const targetId = turn.targetId || fallbackTarget?.id || null;
    if (!targetId) {
      return {
        answer: turn.reply || "Which task do you mean?",
        saved: [] as string[],
      };
    }
    const target = items.find((item) => item.id === targetId);
    if (!target) {
      return { answer: "I can’t find that task anymore.", saved: [] as string[] };
    }

    if (turn.mode === "complete" || turn.mode === "mark_received") {
      const ok = await complete(target.id);
      return {
        answer: ok ? turn.reply || "Done." : "I couldn’t update that yet.",
        saved: [] as string[],
      };
    }

    if (turn.mode === "dismiss") {
      const ok =
        target.status === "inbox"
          ? await ignore(target.id)
          : await remove(target.id);
      return {
        answer: ok ? turn.reply || "Removed." : "I couldn’t remove that yet.",
        saved: [] as string[],
      };
    }

    if (turn.mode === "mark_followed_up") {
      if (target.kind !== "waiting") {
        return {
          answer: "That item isn’t in Waiting.",
          saved: [] as string[],
        };
      }
      const ok = await markWaitingFollowedUp(target.id, 2);
      return {
        answer: ok
          ? turn.reply || "Follow-up recorded. I’ll check it again in two days."
          : "I couldn’t record that follow-up yet.",
        saved: [] as string[],
      };
    }

    if (turn.mode === "reschedule") {
      const parsed = parseSmartDate(
        [turn.dueText || "", turn.time ? `jam ${turn.time}` : "", rawMessage]
          .filter(Boolean)
          .join(" "),
      );
      const patch: Partial<Item> = {};
      if (parsed.date) patch.due = parsed.date;
      if (turn.time || parsed.time) patch.time = turn.time || parsed.time || undefined;
      if (!Object.keys(patch).length) {
        return {
          answer: turn.reply || "What day or time should I move it to?",
          saved: [] as string[],
        };
      }
      const ok = await editItem(target.id, patch);
      return {
        answer: ok ? turn.reply || "Updated." : "I couldn’t change that schedule yet.",
        saved: [] as string[],
      };
    }

    if (turn.mode === "edit") {
      const patch: Partial<Item> = {};
      if (turn.title?.trim()) patch.title = turn.title.trim();
      if (turn.priority) patch.priority = turn.priority;
      if (turn.personName?.trim()) patch.personName = turn.personName.trim();
      if (turn.projectName?.trim()) patch.projectName = turn.projectName.trim();
      if (!Object.keys(patch).length) {
        return {
          answer: turn.reply || "What should I change?",
          saved: [] as string[],
        };
      }
      const ok = await editItem(target.id, patch);
      return {
        answer: ok ? turn.reply || "Updated." : "I couldn’t save that change yet.",
        saved: [] as string[],
      };
    }

    if (turn.mode === "set_reminder") {
      const parsed = parseSmartDate(
        [turn.dueText || "", turn.time ? `jam ${turn.time}` : "", rawMessage]
          .filter(Boolean)
          .join(" "),
      );
      const due = parsed.date || target.due;
      const time = turn.time || parsed.time || target.time || "09:00";
      if (!due) {
        return {
          answer: turn.reply || "When should I remind you?",
          saved: [] as string[],
        };
      }
      const offset =
        turn.reminderOffsetMinutes ?? (target.time || parsed.time ? 60 : 0);
      const when = reminderIso(due, time, offset);
      if (!when) {
        return {
          answer: "I couldn’t read that reminder time.",
          saved: [] as string[],
        };
      }
      const ok = await editItem(target.id, {
        reminderEnabled: true,
        reminderTime: when,
        reminderChannels: target.reminderChannels?.length
          ? target.reminderChannels
          : ["in_app", "push"],
        ...(parsed.date ? { due: parsed.date } : {}),
        ...(parsed.time || turn.time ? { time } : {}),
        semanticContext: {
          ...(target.semanticContext || {}),
          reminder: {
            shouldRemind: true,
            strategy: offset > 0 ? "before" : "at_time",
            offsetMinutes: offset,
            reason: "Requested in Ask NANTI.",
            message:
              target.semanticContext?.reminder?.message ||
              `Remember: ${target.title}`,
          },
        },
      });
      return {
        answer: ok ? turn.reply || "Reminder set." : "I couldn’t save that reminder yet.",
        saved: [] as string[],
      };
    }

    return { answer: turn.reply || "Okay.", saved: [] as string[] };
  };

  const clearChat = async () => {
    if (busy || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await clearAiMessages();
      setMessages([]);
      setPending(null);
      setInput("");
    } catch (clearError) {
      console.error("Failed to clear Ask NANTI:", clearError);
      setError("Chat history couldn’t be cleared. Please try again.");
    } finally {
      lock.current = false;
      setBusy(false);
      field.current?.focus();
    }
  };

  const saveDeterministicFallback = async (
    question: string,
    fallbackItems: Item[],
    reason: "fast_path" | "ai_failure",
  ) => {
    if (!fallbackItems.length) return false;

    const saved = await addItems(fallbackItems, question);
    if (!saved.length) return false;

    const titles = saved.map(({ index }) => fallbackItems[index]!.title);
    const timing = saved
      .map(({ index }) => {
        const item = fallbackItems[index]!;
        return [item.title, item.due, item.time].filter(Boolean).join(" · ");
      })
      .join("\n");

    setInput("");
    await appendTurn(
      question,
      saved.length > 1
        ? `Saved ${saved.length} things:\n${timing}`
        : `Saved: ${timing}`,
      titles,
      {
        route: `deterministic_${reason}`,
        saved_count: saved.length,
      },
    );
    return true;
  };

  const send = async (value?: string) => {
    const question = (value ?? input).trim();
    if (!question || lock.current) return;

    lock.current = true;
    setBusy(true);
    setError("");

    try {
      if (pending) {
        setInput("");
        if (await resolvePending(question)) return;
      }

      const direct = directWorkspaceAnswer(question, items, personFor);
      if (direct) {
        setInput("");
        await appendTurn(question, direct, [], { route: "direct_workspace_answer" });
        return;
      }

      const deterministicItems = chatMessageToFallbackItems(question, {
        people,
        projects,
      });
      const highConfidenceFallback =
        deterministicItems.length > 1 ||
        (deterministicItems.length === 1 &&
          Boolean(deterministicItems[0]!.due || deterministicItems[0]!.time) &&
          deterministicItems[0]!.confidence >= 0.88);

      if (
        highConfidenceFallback &&
        (await saveDeterministicFallback(
          question,
          deterministicItems,
          "fast_path",
        ))
      ) {
        return;
      }

      const itemContext = recentItems.map((item) => ({
        id: item.id,
        title: item.title,
        kind: item.kind,
        status: item.status,
        due: item.due,
        time: item.time,
        person: personFor(item),
        project:
          projects.find((project) => project.id === item.projectId)?.name ||
          item.projectName,
        semantic: item.semanticContext,
      }));

      const workspaceContext = [
        `Today: ${todayISO()}`,
        "All active work:",
        ...items
          .filter((item) => item.status === "open" || item.status === "inbox")
          .slice(0, 80)
          .map((item) =>
            JSON.stringify({
              id: item.id,
              title: item.title,
              kind: item.kind,
              status: item.status,
              due: item.due,
              time: item.time,
              person: personFor(item),
              project:
                projects.find((project) => project.id === item.projectId)?.name ||
                item.projectName,
              where: item.semanticContext?.where,
              how: item.semanticContext?.how,
              clarificationQuestion: item.clarificationQuestion,
            }),
          ),
      ]
        .join("\n")
        .slice(0, 24000);

      const recentConversation = messages
        .slice(-10)
        .map((message) => `${message.role}: ${message.text}`)
        .join("\n")
        .slice(0, 10000);

      const turn = await processAssistantTurn({
        data: {
          message: question,
          workspaceContext,
          recentConversation,
          items: itemContext,
        },
      });

      const outcome = await applyTurn(turn, question);
      setInput("");
      await appendTurn(question, outcome.answer, outcome.saved, {
        route: turn.mode,
        confidence: turn.confidence,
        target_id: turn.targetId,
        saved_count: outcome.saved.length,
      });
    } catch (submitError) {
      console.error("Ask NANTI failed:", submitError);
      try {
        const fallbackItems = chatMessageToFallbackItems(question, {
          people,
          projects,
        });
        if (
          fallbackItems.length &&
          (await saveDeterministicFallback(
            question,
            fallbackItems,
            "ai_failure",
          ))
        ) {
          setError("");
          return;
        }
      } catch (fallbackError) {
        console.error("Ask NANTI deterministic fallback failed:", fallbackError);
      }

      setError(
        "NANTI couldn’t process that. Your message is still here — try again.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
      field.current?.focus();
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col">
      <div className="flex-1">
        {messages.length > 0 && (
          <div className="mb-5 flex justify-end">
            <button
              type="button"
              disabled={busy}
              onClick={() => void clearChat()}
              className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:opacity-50"
            >
              Clear chat
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="py-8 sm:py-14">
            <p className="max-w-xl text-[17px] leading-7 text-foreground">
              Tell NANTI what you need to remember, or ask about your work.
            </p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Typos are fine. Paste a conversation, change a task, set a reminder,
              or ask what you’re forgetting.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={busy}
                  onClick={() => void send(suggestion)}
                  className="rounded-full border border-border px-3 py-1.5 text-[13px] text-foreground hover:bg-secondary disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div
            role="log"
            aria-label="Conversation with NANTI"
            className="space-y-6 pb-6"
          >
            {messages.map((message, index) =>
              message.role === "user" ? (
                <div key={index} className="flex justify-end">
                  <p className="max-w-[88%] rounded-2xl bg-primary px-4 py-2.5 text-[14.5px] leading-6 text-primary-foreground">
                    {message.text}
                  </p>
                </div>
              ) : (
                <div key={index} className="max-w-2xl">
                  <p className="whitespace-pre-wrap text-[15px] leading-7">
                    {message.text}
                  </p>
                  {!!message.saved?.length && (
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-primary">
                      <Check className="mt-0.5 size-3.5 shrink-0" />
                      <span>
                        Saved to NANTI: {message.saved.join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              ),
            )}
          </div>
        )}

        {busy && (
          <p className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            NANTI is thinking…
          </p>
        )}
        {error && (
          <p role="alert" className="py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <div ref={end} />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
        className="sticky bottom-[4.75rem] mt-6 bg-background pb-2 pt-2 lg:bottom-4"
      >
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2 shadow-sm">
          <textarea
            ref={field}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send();
              }
            }}
            rows={1}
            placeholder="Message NANTI…"
            className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-[15px] leading-6 outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            aria-label="Send"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-35"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
        <p className="mt-2 px-1 text-[11px] text-muted-foreground">
          One conversation. Tasks, reminders, changes, and answers happen here.
        </p>
      </form>
    </div>
  );
}
