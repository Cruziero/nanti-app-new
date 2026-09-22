import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check, Clock3 } from "lucide-react";
import { useNanti } from "@/lib/nanti-store";
import {
  askAssistant,
  analyzeConversation,
  interpretTaskCommand,
} from "@/lib/nanti-ai.functions";
import { chatMessageToFallbackItem, draftToItem } from "@/lib/nanti-import";
import type { Item } from "@/lib/nanti-types";
import { parseSmartDate } from "@/lib/nanti-dates";
import { isDueToday, isOverdue, todayISO, waitingDays } from "@/lib/nanti-utils";
import { normalizedIntentText } from "@/lib/nanti-language";
import { createAiMessage, fetchAiMessages } from "@/lib/nanti-supabase";

type Message = { role: "user" | "assistant"; text: string };
type SavedCard = Pick<
  Item,
  "id" | "title" | "kind" | "due" | "time" | "status" | "semanticContext" | "reminderTime"
>;
type PendingClarification = {
  itemId: string;
  type: NonNullable<Item["clarificationType"]>;
  question: string;
  title: string;
};

type Command = {
  intent:
    | "none"
    | "complete"
    | "dismiss"
    | "reschedule"
    | "set_reminder"
    | "edit"
    | "mark_followed_up"
    | "mark_received";
  targetId: string | null;
  dueText: string | null;
  time: string | null;
  reminderOffsetMinutes: number | null;
  title: string | null;
  priority: "low" | "medium" | "high" | null;
  personName: string | null;
  projectName: string | null;
  confidence: number;
  question: string | null;
  acknowledgement: string | null;
};

function formatReminderClock(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function deterministicMemoryAnswer(
  question: string,
  items: Item[],
  people: Array<{ id: string; name: string }>,
) {
  const normalized = normalizedIntentText(question);
  const asksForForgetting =
    /\bforget(?:ting)?\b/.test(normalized) ||
    /\b(lupa|kelupaan)\b/.test(normalized);
  const asksDueToday =
    /\bdue\s+today\b/.test(normalized) ||
    /jatuh\s+tempo.*hari\s+ini/.test(normalized) ||
    /apa.*hari\s+ini.*(?:tugas|deadline)/.test(normalized);
  const asksFollowUp =
    /\bfollowup\b/.test(normalized) ||
    /tindak\s+lanjut/.test(normalized) ||
    /siapa.*(?:tunggu|hubungi)/.test(normalized);

  if (!asksForForgetting && !asksDueToday && !asksFollowUp) return null;

  const activeTasks = items.filter(
    (item) => item.status === "open" && item.kind !== "waiting",
  );
  const overdue = activeTasks.filter(isOverdue);
  const dueToday = activeTasks.filter(isDueToday);
  const waiting = items
    .filter((item) => item.status === "open" && item.kind === "waiting")
    .sort((a, b) => {
      const aAt = a.followUpAt ? new Date(a.followUpAt).getTime() : 0;
      const bAt = b.followUpAt ? new Date(b.followUpAt).getTime() : 0;
      return aAt - bAt;
    });
  const inbox = items.filter((item) => item.status === "inbox");

  const describeTask = (item: Item) => {
    const place = item.semanticContext?.where;
    const clock = item.time ? ` · ${item.time}` : "";
    const location = place ? ` · ${place}` : "";
    return `${item.title}${clock}${location}`;
  };

  if (asksFollowUp) {
    if (!waiting.length) return "Tidak ada follow-up aktif yang sedang menunggu.";
    return [
      "Yang perlu kamu follow up:",
      ...waiting.slice(0, 5).map((item, index) => {
        const person =
          people.find((candidate) => candidate.id === item.personId)?.name ||
          item.personName ||
          "pihak terkait";
        const age = item.since ? ` · menunggu ${waitingDays(item)} hari` : "";
        return `${index + 1}. ${person} — ${item.title}${age}`;
      }),
    ].join("\n");
  }

  if (asksDueToday) {
    if (!dueToday.length && !overdue.length) {
      return "Tidak ada tugas yang jatuh tempo hari ini atau sudah terlambat.";
    }
    const lines = [
      ...overdue.map((item) => `Overdue: ${describeTask(item)}`),
      ...dueToday.map((item) => `Hari ini: ${describeTask(item)}`),
    ];
    return ["Ini yang perlu perhatian sekarang:", ...lines.slice(0, 6)].join("\n");
  }

  const attention = [
    ...overdue.map((item) => ({ label: "Overdue", item })),
    ...dueToday.map((item) => ({ label: "Hari ini", item })),
  ];
  if (!attention.length && !waiting.length && !inbox.length) {
    return "Saya tidak melihat tugas overdue, due hari ini, follow-up aktif, atau item yang masih butuh klarifikasi.";
  }
  const lines = attention
    .slice(0, 4)
    .map(({ label, item }) => `${label}: ${describeTask(item)}`);
  if (waiting.length) {
    const first = waiting[0]!;
    const person =
      people.find((candidate) => candidate.id === first.personId)?.name ||
      first.personName ||
      "pihak terkait";
    lines.push(`Follow-up: ${person} — ${first.title}`);
  }
  if (inbox.length) lines.push(`Clarify: ${inbox.length} item di Inbox masih belum lengkap.`);
  return ["Yang mungkin kamu lupa:", ...lines].join("\n");
}

function reminderIso(date: string, time: string, offsetMinutes = 0) {
  const base = new Date(`${date}T${time}:00+07:00`);
  if (Number.isNaN(base.getTime())) return undefined;
  return new Date(base.getTime() - offsetMinutes * 60_000).toISOString();
}

function fallbackCommand(message: string, target?: Item): Command | null {
  if (!target) return null;
  const lower = normalizedIntentText(message);
  const parsed = parseSmartDate(message);

  if (/^(sudah|udah|selesai|done|beres)\b/.test(lower)) {
    return {
      intent: target.kind === "waiting" ? "mark_received" : "complete",
      targetId: target.id,
      dueText: null,
      time: null,
      reminderOffsetMinutes: null,
      title: null,
      priority: null,
      personName: null,
      projectName: null,
      confidence: 0.9,
      question: null,
      acknowledgement: null,
    };
  }
  if (/bukan\s+(tugas|task)|\b(hapus|abaikan|ignore)\b/.test(lower)) {
    return {
      intent: "dismiss",
      targetId: target.id,
      dueText: null,
      time: null,
      reminderOffsetMinutes: null,
      title: null,
      priority: null,
      personName: null,
      projectName: null,
      confidence: 0.86,
      question: null,
      acknowledgement: null,
    };
  }
  if (/followup/.test(lower) && /sudah|udah|already/.test(lower)) {
    return {
      intent: "mark_followed_up",
      targetId: target.id,
      dueText: null,
      time: null,
      reminderOffsetMinutes: null,
      title: null,
      priority: null,
      personName: null,
      projectName: null,
      confidence: 0.88,
      question: null,
      acknowledgement: null,
    };
  }
  if (/\b(ingatkan|ingetin|remind)\b/.test(lower)) {
    const offset = /(\d+)\s*(jam|hour|hours|menit|minute|minutes)\s*(sebelum|before)/.exec(lower);
    const amount = offset ? Number(offset[1]) : 0;
    const unit = offset?.[2] || "";
    return {
      intent: "set_reminder",
      targetId: target.id,
      dueText: parsed.date ? message : null,
      time: parsed.time,
      reminderOffsetMinutes: offset ? (unit.startsWith("jam") || unit.startsWith("hour") ? amount * 60 : amount) : null,
      title: null,
      priority: null,
      personName: null,
      projectName: null,
      confidence: 0.84,
      question: null,
      acknowledgement: null,
    };
  }
  if (
    /^(actually|sebenarnya|ubah|ganti|jadikan|make it|pindah)/.test(lower) &&
    (parsed.date || parsed.time)
  ) {
    return {
      intent: "reschedule",
      targetId: target.id,
      dueText: message,
      time: parsed.time,
      reminderOffsetMinutes: null,
      title: null,
      priority: null,
      personName: null,
      projectName: null,
      confidence: 0.84,
      question: null,
      acknowledgement: null,
    };
  }
  return null;
}

export function DashboardAssistant() {
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
  const [mode, setMode] = useState<"ask" | "paste">("ask");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [drafts, setDrafts] = useState<Item[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [source, setSource] = useState("");
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [pendingClarification, setPendingClarification] = useState<PendingClarification | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const field = useRef<HTMLTextAreaElement>(null);

  const recentItems = useMemo(
    () =>
      [...items]
        .filter((item) => item.status === "open" || item.status === "inbox")
        .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
        .slice(0, 25),
    [items],
  );

  useEffect(() => {
    let cancelled = false;
    fetchAiMessages()
      .then((rows) => {
        if (cancelled) return;
        setMessages(
          rows.map((row) => ({
            role: row.role as Message["role"],
            text: row.content as string,
          })),
        );
      })
      .catch((loadError) => console.error("Failed to load NANTI chat history:", loadError));
    return () => {
      cancelled = true;
    };
  }, []);

  const persistChatTurn = async (
    question: string,
    answer: string,
    metadata: Record<string, unknown> = {},
  ) => {
    const results = await Promise.allSettled([
      createAiMessage({
        data: { role: "user", content: question, metadata: { source: "dashboard" } },
      }),
      createAiMessage({
        data: {
          role: "assistant",
          content: answer,
          metadata: { source: "dashboard", ...metadata },
        },
      }),
    ]);
    if (results.some((result) => result.status === "rejected")) {
      console.error("Some NANTI chat messages were not persisted:", results);
    }
  };

  const appendTurn = async (
    question: string,
    answer: string,
    metadata: Record<string, unknown> = {},
  ) => {
    setMessages((current) => [
      ...current,
      { role: "user", text: question },
      { role: "assistant", text: answer },
    ]);
    await persistChatTurn(question, answer, metadata);
  };

  const resolveClarification = async (answer: string) => {
    if (!pendingClarification) return false;
    const item = items.find((candidate) => candidate.id === pendingClarification.itemId);
    if (!item) {
      setPendingClarification(null);
      return false;
    }

    if (pendingClarification.type === "confirmation") {
      if (/^(ya|iya|yes|y|betul|benar|simpan|save)\b/i.test(answer.trim())) {
        const promotedId = await track(item.id);
        if (!promotedId) return true;
        setPendingClarification(null);
        setSavedCards((cards) =>
          cards.map((card) =>
            card.id === item.id ? { ...card, id: promotedId, status: "open" } : card,
          ),
        );
        await appendTurn(answer, "Siap. Saya simpan dan akan ingatkan kalau perlu.", {
          clarification_resolved: true,
          item_id: promotedId,
        });
        return true;
      }
      if (/^(tidak|nggak|ga|gak|no|bukan)\b/i.test(answer.trim())) {
        if (!await ignore(item.id)) return true;
        setPendingClarification(null);
        setSavedCards((cards) => cards.filter((card) => card.id !== item.id));
        await appendTurn(answer, "Oke, saya abaikan. Itu tidak akan jadi tugas.", {
          clarification_resolved: true,
          dismissed: true,
        });
        return true;
      }
      await appendTurn(answer, "Cukup jawab “ya” atau “tidak” untuk yang ini.");
      return true;
    }

    if (pendingClarification.type === "person") {
      const promotedId = await track(item.id, { personName: answer.trim() });
      if (!promotedId) return true;
      setPendingClarification(null);
      setSavedCards((cards) =>
        cards.map((card) =>
          card.id === item.id ? { ...card, id: promotedId, status: "open" } : card,
        ),
      );
      await appendTurn(answer, `Siap. Saya catat kamu menunggu ${answer.trim()}.`, {
        clarification_resolved: true,
        item_id: promotedId,
      });
      return true;
    }

    const parsed = parseSmartDate(answer);
    const due = parsed.date || item.due;
    const time = parsed.time || item.time;
    if (!due && !time) {
      await appendTurn(answer, "Saya belum menangkap waktunya. Contoh: “besok jam 10 pagi”.");
      return true;
    }
    const promotedId = await track(item.id, { due, time });
    if (!promotedId) return true;
    setPendingClarification(null);
    setSavedCards((cards) =>
      cards.map((card) =>
        card.id === item.id
          ? { ...card, id: promotedId, due: due || card.due, time: time || card.time, status: "open" }
          : card,
      ),
    );
    await appendTurn(answer, `Siap. Saya jadwalkan${due ? ` untuk ${due}` : ""}${time ? ` jam ${time}` : ""}.`, {
      clarification_resolved: true,
      item_id: promotedId,
    });
    return true;
  };

  const applyCommand = async (command: Command, rawMessage: string) => {
    if (command.intent === "none" || command.confidence < 0.72) return null;
    const fallbackTarget = recentItems[0];
    const targetId =
      command.targetId ||
      (/\b(itu|tadi|barusan|that|it)\b/i.test(rawMessage) ? fallbackTarget?.id || null : null);

    if (!targetId) {
      return {
        handled: true,
        answer: command.question || "Yang mana yang kamu maksud? Sebutkan tugasnya sedikit.",
      };
    }

    const target = items.find((item) => item.id === targetId);
    if (!target) {
      return { handled: true, answer: "Saya tidak menemukan tugas itu lagi." };
    }

    if (command.intent === "complete") {
      if (!await complete(target.id)) return { handled: true, answer: "Belum berhasil menandainya selesai." };
      return {
        handled: true,
        answer: command.acknowledgement || `Selesai. “${target.title}” saya tandai done.`,
      };
    }

    if (command.intent === "mark_received") {
      if (!await complete(target.id)) return { handled: true, answer: "Belum berhasil memperbaruinya." };
      return {
        handled: true,
        answer: command.acknowledgement || `Sip. “${target.title}” sudah saya tandai diterima.`,
      };
    }

    if (command.intent === "dismiss") {
      const ok = target.status === "inbox" ? await ignore(target.id) : await remove(target.id);
      if (!ok) return { handled: true, answer: "Belum berhasil menghapusnya." };
      return {
        handled: true,
        answer: command.acknowledgement || `Oke. “${target.title}” saya hapus dari ingatan aktif.`,
      };
    }

    if (command.intent === "mark_followed_up") {
      if (target.kind !== "waiting") {
        return { handled: true, answer: "Item itu bukan sesuatu yang sedang kamu tunggu." };
      }
      if (!await markWaitingFollowedUp(target.id, 2)) {
        return { handled: true, answer: "Follow-up belum berhasil tercatat." };
      }
      return {
        handled: true,
        answer:
          command.acknowledgement ||
          `Tercatat. Kamu sudah follow up “${target.title}”. Saya cek lagi 2 hari dari sekarang.`,
      };
    }

    if (command.intent === "reschedule") {
      const parsed = parseSmartDate(
        [command.dueText || "", command.time ? `jam ${command.time}` : "", rawMessage]
          .filter(Boolean)
          .join(" "),
      );
      const patch: Partial<Item> = {};
      if (parsed.date) patch.due = parsed.date;
      if (command.time || parsed.time) patch.time = command.time || parsed.time || undefined;
      if (!patch.due && !patch.time) {
        return {
          handled: true,
          answer: command.question || "Mau saya pindahkan ke hari dan jam berapa?",
        };
      }
      if (!await editItem(target.id, patch)) {
        return { handled: true, answer: "Jadwalnya belum berhasil saya ubah." };
      }
      return {
        handled: true,
        answer:
          command.acknowledgement ||
          `Diubah. “${target.title}” sekarang ${patch.due || target.due || ""}${patch.time ? ` · ${patch.time}` : ""}.`,
      };
    }

    if (command.intent === "edit") {
      const patch: Partial<Item> = {};
      if (command.title?.trim()) patch.title = command.title.trim();
      if (command.priority) patch.priority = command.priority;
      if (command.personName?.trim()) patch.personName = command.personName.trim();
      if (command.projectName?.trim()) patch.projectName = command.projectName.trim();

      if (!Object.keys(patch).length) {
        return {
          handled: true,
          answer: command.question || "Apa yang mau kamu ubah dari tugas itu?",
        };
      }
      if (!await editItem(target.id, patch)) {
        return { handled: true, answer: "Perubahannya belum berhasil saya simpan." };
      }
      return {
        handled: true,
        answer: command.acknowledgement || `Siap. “${target.title}” sudah saya perbarui.`,
      };
    }

    if (command.intent === "set_reminder") {
      const parsed = parseSmartDate(
        [command.dueText || "", command.time ? `jam ${command.time}` : "", rawMessage]
          .filter(Boolean)
          .join(" "),
      );
      const due = parsed.date || target.due;
      const time = command.time || parsed.time || target.time || "09:00";
      if (!due) {
        return {
          handled: true,
          answer: command.question || "Kapan saya harus mengingatkan kamu?",
        };
      }
      const offset = command.reminderOffsetMinutes ?? (target.time || parsed.time ? 60 : 0);
      const when = reminderIso(due, time, offset);
      if (!when) return { handled: true, answer: "Waktu pengingatnya belum bisa saya baca." };
      if (
        !await editItem(target.id, {
          reminderEnabled: true,
          reminderTime: when,
          reminderChannels: target.reminderChannels?.length
            ? target.reminderChannels
            : ["in_app", "push"],
          semanticContext: {
            ...(target.semanticContext || {}),
            when:
              [
                parsed.date || target.due,
                parsed.time || command.time || target.time,
              ].filter(Boolean).join(" · ") || target.semanticContext?.when,
            reminder: {
              shouldRemind: true,
              strategy: offset > 0 ? "before" : "at_time",
              offsetMinutes: offset,
              reason: "Requested in chat.",
              message:
                target.semanticContext?.reminder?.message ||
                `Ingat: ${target.title}`,
            },
          },
          ...(parsed.date ? { due: parsed.date } : {}),
          ...(parsed.time || command.time ? { time } : {}),
        })
      ) {
        return { handled: true, answer: "Pengingatnya belum berhasil disimpan." };
      }
      return {
        handled: true,
        answer:
          command.acknowledgement ||
          `Siap. Saya pasang pengingat untuk “${target.title}”.`,
      };
    }

    return null;
  };

  const submit = async () => {
    if (!input.trim() || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    const question = input.trim();

    try {
      if (mode === "ask" && pendingClarification) {
        setInput("");
        await resolveClarification(question);
        return;
      }

      if (mode === "paste") {
        const result = await analyzeConversation({ data: { text: question } });
        const next = result.items.map((draft) =>
          draftToItem(draft, { people, projects, sourceType: "paste" }),
        );
        setDrafts(next);
        setSelected(next.map((item) => item.id));
        setSource(question);
        if (!next.length) {
          setError("No tasks found. Add more context to the conversation and try again.");
        }
        return;
      }

      const taskContext = recentItems
        .map((item) =>
          JSON.stringify({
            id: item.id,
            title: item.title,
            status: item.status,
            due: item.due,
            time: item.time,
            kind: item.kind,
            person: people.find((person) => person.id === item.personId)?.name || item.personName,
            project: projects.find((project) => project.id === item.projectId)?.name || item.projectName,
            semantic: item.semanticContext,
            reminderTime: item.reminderTime,
          }),
        )
        .join("\n")
        .slice(0, 12000);
      const history = messages
        .slice(-8)
        .map((message) => `${message.role}: ${message.text.slice(0, 800)}`)
        .join("\n");
      const peopleMemory = people
        .slice(0, 50)
        .map((person) => {
          const recentActivity = person.activity
            .slice(0, 4)
            .map((activity) => `${activity.date}: ${activity.text}`)
            .join(" | ");
          return [
            `${person.name}${person.org ? ` — ${person.org}` : ""}`,
            person.role ? `role: ${person.role}` : "",
            person.lastConversation ? `last interaction: ${person.lastConversation}` : "",
            recentActivity ? `recent: ${recentActivity}` : "",
          ]
            .filter(Boolean)
            .join(" · ");
        })
        .join("\n");
      const projectMemory = projects
        .slice(0, 50)
        .map((project) => `${project.name}${project.description ? ` — ${project.description}` : ""}`)
        .join("\n");
      const context = `Today (Asia/Jakarta): ${todayISO()}\nSaved items:\n${taskContext}\nPeople memory:\n${peopleMemory}\nProject memory:\n${projectMemory}\nRecent conversation:\n${history}`;

      const commandItems = recentItems.map((item) => ({
        id: item.id,
        title: item.title,
        kind: item.kind,
        status: item.status,
        due: item.due,
        time: item.time,
        person: people.find((person) => person.id === item.personId)?.name || item.personName,
        project: projects.find((project) => project.id === item.projectId)?.name || item.projectName,
        updatedAt: item.createdAt,
      }));

      const deterministicAnswer = deterministicMemoryAnswer(question, items, people);

      const [commandResult, answerResult, extractionResult] = await Promise.allSettled([
        interpretTaskCommand({ data: { message: question, items: commandItems } }),
        askAssistant({ data: { question, context } }),
        analyzeConversation({ data: { text: question, source: "Chat dengan NANTI" } }),
      ]);

      const aiCommand =
        commandResult.status === "fulfilled" ? (commandResult.value as Command) : null;
      const localCommand =
        fallbackCommand(question, recentItems[0]) ||
        ({
          intent: "none",
          targetId: null,
          dueText: null,
          time: null,
          reminderOffsetMinutes: null,
          title: null,
          priority: null,
          personName: null,
          projectName: null,
          confidence: 0,
          question: null,
          acknowledgement: null,
        } satisfies Command);
      const command =
        aiCommand && aiCommand.intent !== "none" && aiCommand.confidence >= localCommand.confidence
          ? aiCommand
          : localCommand;

      const commandOutcome = await applyCommand(command, question);
      if (commandOutcome?.handled) {
        setInput("");
        setSavedCards([]);
        await appendTurn(question, commandOutcome.answer, {
          command: command.intent,
          item_id: command.targetId,
        });
        return;
      }

      const detected =
        extractionResult.status === "fulfilled"
          ? extractionResult.value.items.map((draft) =>
              draftToItem(draft, {
                people,
                projects,
                sourceType: "chat",
                sourceName: "Chat dengan NANTI",
              }),
            )
          : [];

      const fallback = detected.length
        ? null
        : chatMessageToFallbackItem(question, { people, projects });
      const nextItems = detected.length ? detected : fallback ? [fallback] : [];

      let saved: Array<{ index: number; id: string }> = [];
      let newClarification: PendingClarification | null = null;
      if (nextItems.length) {
        saved = await addItems(nextItems, question);
        const cards = saved.map(({ index, id }) => ({
          id,
          title: nextItems[index]!.title,
          kind: nextItems[index]!.kind,
          due: nextItems[index]!.due,
          time: nextItems[index]!.time,
          status: nextItems[index]!.status,
          semanticContext: nextItems[index]!.semanticContext,
          reminderTime: nextItems[index]!.reminderTime,
        }));
        setSavedCards(cards);

        const unclear = saved
          .map(({ index, id }) => ({ draft: nextItems[index]!, id }))
          .find(({ draft }) => draft.status === "inbox");
        if (unclear) {
          newClarification = {
            itemId: unclear.id,
            type: unclear.draft.clarificationType || "confirmation",
            question:
              unclear.draft.clarificationQuestion ||
              "Mau NANTI simpan ini sebagai tugas?",
            title: unclear.draft.title,
          };
          setPendingClarification(newClarification);
        }
      } else {
        setSavedCards([]);
      }

      const baseAnswer =
        deterministicAnswer ||
        (answerResult.status === "fulfilled"
          ? answerResult.value.answer
          : nextItems.length
            ? "Saya menangkap sesuatu yang perlu diingat."
            : "Saya sudah menyimpan pesanmu. Coba tanyakan lagi kalau kamu ingin saya merangkum ingatan aktif.");

      const resolvedBaseAnswer = baseAnswer;

      const savedText =
        saved.length > 0
          ? `\n\n✓ ${saved.length === 1 ? "Sudah saya simpan" : `${saved.length} hal sudah saya simpan`}.`
          : "";
      const clarificationText = newClarification
        ? `\n\n${newClarification.question}`
        : "";
      const answer = `${resolvedBaseAnswer}${savedText}${clarificationText}`;

      setInput("");
      await appendTurn(question, answer, {
        detected_task_count: nextItems.length,
        saved_task_count: saved.length,
        saved_item_ids: saved.map((record) => record.id),
      });

      if (
        answerResult.status === "rejected" &&
        extractionResult.status === "rejected" &&
        !nextItems.length &&
        !deterministicAnswer
      ) {
        setError("NANTI couldn’t answer or detect an action from that message. Please try again.");
      }
    } catch (submitError) {
      console.error("NANTI chat failed:", submitError);
      setError(
        mode === "ask"
          ? "NANTI couldn’t process that safely. Your message is still here; please try again."
          : "The conversation couldn’t be analyzed. Your text is still here; please try again.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  const savePaste = async () => {
    if (lock.current || !selected.length) return;
    lock.current = true;
    setBusy(true);
    setError("");
    const chosenWithSourceIndex = drafts
      .map((item, sourceIndex) => ({ item, sourceIndex }))
      .filter(({ item }) => selected.includes(item.id));
    const chosen = chosenWithSourceIndex.map(({ item }) => item);
    try {
      const saved = await addItems(chosen, source);
      const savedIndexes = new Set(
        saved.map((record) => chosenWithSourceIndex[record.index]?.sourceIndex).filter(
          (index): index is number => typeof index === "number",
        ),
      );
      setDrafts((list) => list.filter((_, index) => !savedIndexes.has(index)));
      setSelected([]);
      if (saved.length) toast.success(`${saved.length} item${saved.length === 1 ? "" : "s"} saved`);
      if (saved.length !== chosen.length) {
        setError("Some items weren’t saved. They remain here for you to retry.");
      }
      if (saved.length === chosen.length) {
        setSource("");
        setInput("");
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
            Talk naturally. NANTI can remember, update, remind, and follow up.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-background p-1">
          {(["ask", "paste"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              disabled={busy || (mode === "paste" && drafts.length > 0)}
              onClick={() => {
                setMode(value);
                setError("");
                field.current?.focus();
              }}
              className={`min-h-11 rounded-md px-3 text-sm font-medium disabled:opacity-50 ${
                mode === value ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
              }`}
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
        </div>
      )}

      {mode === "ask" && savedCards.length > 0 && (
        <div className="mb-3 space-y-2">
          {savedCards.map((card) => (
            <div
              key={card.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-background px-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                  <Check className="size-3.5" />
                  {card.status === "inbox" ? "Saved · needs one detail" : "Saved to NANTI"}
                </div>
                <p className="mt-1 truncate text-sm font-medium">{card.title}</p>
                {(card.due || card.time || card.semanticContext?.where) && (
                  <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                    <Clock3 className="size-3" />
                    {[card.due, card.time, card.semanticContext?.where]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
                {card.reminderTime && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Reminder {formatReminderClock(card.reminderTime)}
                    {card.semanticContext?.reminder?.reason
                      ? ` · ${card.semanticContext.reminder.reason}`
                      : ""}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {mode === "ask" && pendingClarification && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-950">
          <p className="text-xs font-semibold uppercase tracking-wide">One thing I need</p>
          <p className="mt-1 text-sm font-medium">{pendingClarification.question}</p>
          <p className="mt-1 text-xs opacity-70">For: {pendingClarification.title}</p>
        </div>
      )}

      {mode === "paste" && drafts.length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-semibold">Review before saving</h3>
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
                      event.target.checked
                        ? [...ids, item.id]
                        : ids.filter((id) => id !== item.id),
                    )
                  }
                  className="size-5 accent-emerald-800"
                />
              </label>
              <div className="min-w-0 flex-1">
                <input
                  value={item.title}
                  disabled={busy}
                  maxLength={500}
                  onChange={(event) =>
                    setDrafts((list) =>
                      list.map((candidate) =>
                        candidate.id === item.id
                          ? { ...candidate, title: event.target.value }
                          : candidate,
                      ),
                    )
                  }
                  className="block min-h-11 w-full rounded border border-border bg-background px-2 text-sm text-foreground"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  {item.status === "inbox"
                    ? item.clarificationQuestion || "Needs clarification · Inbox"
                    : item.kind === "waiting"
                      ? "Waiting for a response"
                      : [item.due, item.time].filter(Boolean).join(" · ") || "No deadline detected"}
                </p>
              </div>
            </div>
          ))}
          <div className="flex flex-wrap gap-3">
            <button
              disabled={busy || !selected.length}
              onClick={() => void savePaste()}
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
              Back
            </button>
          </div>
        </div>
      ) : (
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
                  ? pendingClarification
                    ? "Answer naturally…"
                    : "Tell NANTI what you need to remember or change…"
                  : "Paste your WhatsApp conversation here…"
              }
              className="block w-full resize-y bg-transparent p-1 text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                {mode === "ask"
                  ? "Clear actions save automatically. NANTI asks when something important is unclear."
                  : "You review extracted items before saving."}
              </span>
              <button
                disabled={busy || !input.trim()}
                className="min-h-11 shrink-0 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {busy ? "Working…" : mode === "ask" ? "Send" : "Find tasks"}
              </button>
            </div>
          </form>

          {mode === "ask" && !pendingClarification && (
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                "What am I forgetting?",
                "Who should I follow up with?",
                "What’s due today?",
                "Remind me about the last task tomorrow",
              ].map((prompt) => (
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
              ))}
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
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-800 dark:text-red-300">
          {error}
        </p>
      )}
    </section>
  );
}
