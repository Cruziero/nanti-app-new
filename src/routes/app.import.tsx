import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  ClipboardPaste,
  ImageIcon,
  Loader2,
  Sparkle,
  Sparkles,
  Wand2,
  AlertCircle,
  CheckCircle,
  Calendar,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/nanti/app-shell";
import { KindBadge } from "@/components/nanti/kind-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useNanti } from "@/lib/nanti-store";
import { analyzeConversation, analyzeScreenshot } from "@/lib/nanti-ai.functions";
import { draftToItem, type Draft } from "@/lib/nanti-import";
import type { SourceType } from "@/lib/nanti-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/import")({
  head: () => ({
    meta: [
      { title: "Impor percakapan — NANTI" },
      {
        name: "description",
        content:
          "Teruskan percakapan WhatsApp ke NANTI dan biarkan AI mengingat janji, tenggat, dan hal yang Anda tunggu.",
      },
      { property: "og:title", content: "Impor percakapan — NANTI" },
      {
        property: "og:description",
        content: "Tempel chat atau unggah screenshot, NANTI menyimpan memorinya.",
      },
    ],
  }),
  component: ImportPage,
});

const SAMPLE = `[ABC Export — Purchasing]
Budi: Pak Rizky, untuk order ABC yang 500 pcs itu mereka minta update price hari ini ya.
Rizky: Baik Pak, besok saya kirim revisi quotation-nya.
Budi: Oke, saya masih tunggu approval dari owner juga.
Rizky: Siap. Kalau sudah ada kabar dari supplier saya kabarin ya.
Budi: Btw meeting dipindah ke jam 3 sore.`;

type Method = "paste" | "screenshot" | "demo";

const methods: { id: Method; label: string; hint: string; icon: typeof ClipboardPaste }[] = [
  {
    id: "paste",
    label: "Tempel percakapan",
    hint: "Salin chat dari WhatsApp",
    icon: ClipboardPaste,
  },
  {
    id: "screenshot",
    label: "Unggah screenshot",
    hint: "NANTI membaca gambarnya",
    icon: ImageIcon,
  },
  { id: "demo", label: "Coba contoh", hint: "Lihat cara kerjanya", icon: Wand2 },
];

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-16 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11.5px] text-muted-foreground">{pct}% yakin</span>
    </div>
  );
}

function ImportPage() {
  const navigate = useNavigate();
  const { addItems, people, projects } = useNanti();
  const fileRef = useRef<HTMLInputElement>(null);

  const [method, setMethod] = useState<Method>("paste");
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sourceType, setSourceType] = useState<SourceType>("paste");
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [summary, setSummary] = useState("");
  const [context, setContext] = useState<string[]>([]);
  const [detected, setDetected] = useState<string[]>([]);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [reviewMode, setReviewMode] = useState(false);
  const [clarificationMode, setClarificationMode] = useState(false);
  const [clarifyingIndex, setClarifyingIndex] = useState<number | null>(null);
  const [clarificationAnswers, setClarificationAnswers] = useState<
    Record<number, { person?: string; due?: string; project?: string }>
  >({});

  const reset = () => {
    setDrafts(null);
    setSummary("");
    setContext([]);
    setDetected([]);
    setSelected({});
    setReviewMode(false);
    setClarificationMode(false);
    setClarifyingIndex(null);
    setClarificationAnswers({});
  };

  const startClarification = (index: number) => {
    setClarifyingIndex(index);
    setClarificationMode(true);
  };

  const saveClarification = (
    index: number,
    answers: { person?: string; due?: string; project?: string },
  ) => {
    setClarificationAnswers((prev) => ({ ...prev, [index]: answers }));
    setClarificationMode(false);
    setClarifyingIndex(null);
  };

  const getClarifiedDraft = (draft: Draft, index: number): Draft => {
    const answers = clarificationAnswers[index];
    if (!answers) return draft;
    return {
      ...draft,
      person: answers.person || draft.person,
      due: answers.due || draft.due,
      project: answers.project || draft.project,
    };
  };

  const apply = (
    res: { summary: string; context: string[]; projects: string[]; items: Draft[] },
    type: SourceType,
  ) => {
    setSourceType(type);
    setDrafts(res.items);
    setSummary(res.summary);
    setContext(res.context);
    setDetected(res.projects);
    setSelected(Object.fromEntries(res.items.map((_, i) => [i, true])));
    if (!res.items.length) toast("NANTI tidak menemukan hal yang perlu ditindaklanjuti.");
  };

  const run = async (fn: () => Promise<void>) => {
    setLoading(true);
    reset();
    try {
      await fn();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menganalisis percakapan");
    } finally {
      setLoading(false);
    }
  };

  const analyzeText = (value: string, type: SourceType) =>
    run(async () => {
      const res = await analyzeConversation({ data: { text: value } });
      apply(res, type);
    });

  const analyzeImage = (dataUrl: string) =>
    run(async () => {
      const res = await analyzeScreenshot({ data: { image: dataUrl } });
      apply(res, "screenshot");
    });

  const onFile = async (file: File) => {
    if (file.type.startsWith("image/")) {
      if (file.size > 5_000_000) {
        toast.error("Ukuran gambar maksimal 5 MB.");
        return;
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Gagal membaca file"));
        reader.readAsDataURL(file);
      });
      setPreview(dataUrl);
      setText("");
      void analyzeImage(dataUrl);
      return;
    }
    const content = await file.text();
    setMethod("paste");
    setText(content);
    void analyzeText(content, "paste");
  };

  const track = (indexes: number[]) => {
    if (!drafts) return;
    const chosen = indexes
      .map((i) => {
        const draft = drafts[i];
        return getClarifiedDraft(draft, i);
      })
      .filter(Boolean) as Draft[];
    if (!chosen.length) {
      toast("Pilih minimal satu item.");
      return;
    }
    addItems(chosen.map((d) => draftToItem(d, { people, projects, sourceType })), text || undefined);
    toast.success(`${chosen.length} item disimpan ke memori NANTI`);
    reset();
    setText("");
    setPreview(null);
    void navigate({ to: "/app/today" });
  };

  return (
    <div>
      <PageHeader
        title="Teruskan ke NANTI"
        subtitle="Tempel percakapan, unggah screenshot, atau coba contoh. NANTI yang mengingat sisanya."
      />

      <div className="grid gap-2 sm:grid-cols-3">
        {methods.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setMethod(m.id);
              setPreview(null);
              if (m.id === "demo") {
                setText(SAMPLE);
                void analyzeText(SAMPLE, "demo");
              }
              if (m.id === "screenshot") fileRef.current?.click();
            }}
            className={cn(
              "rounded-xl border px-4 py-3.5 text-left transition-colors",
              method === m.id
                ? "border-primary/60 bg-accent/50"
                : "border-border bg-surface hover:border-primary/40",
            )}
          >
            <m.icon className="mb-2 size-4 text-primary" />
            <p className="text-[13.5px] font-semibold">{m.label}</p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">{m.hint}</p>
          </button>
        ))}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,.txt"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void onFile(file);
        }}
      />

      {method !== "screenshot" && (
        <div className="mt-4 space-y-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={9}
            placeholder="Tempel pesan atau percakapan WhatsApp di sini..."
            className="resize-none bg-surface text-[14px] leading-relaxed"
          />
          <Button
            onClick={() => analyzeText(text, method === "demo" ? "demo" : "paste")}
            disabled={loading || !text.trim()}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkle className="size-4" />}
            Analisis dengan NANTI
          </Button>
        </div>
      )}

      {method === "screenshot" && (
        <div className="mt-4 space-y-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-surface px-6 py-10 text-center transition-colors hover:border-primary/50"
          >
            <ImageIcon className="size-5 text-muted-foreground" />
            <p className="text-[13.5px] font-medium">Pilih screenshot WhatsApp</p>
            <p className="text-[12px] text-muted-foreground">PNG atau JPG, maksimal 5 MB</p>
          </button>
          {preview && (
            <img
              src={preview}
              alt="Pratinjau screenshot percakapan"
              className="max-h-64 w-full rounded-xl border border-border object-contain"
            />
          )}
        </div>
      )}

      {loading && (
        <div className="mt-6 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {drafts && !loading && (
        <div className="mt-8">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h2 className="text-[16px] font-semibold">
              Saya menemukan {drafts.length} hal yang perlu ditindaklanjuti.
            </h2>
          </div>
          {summary && <p className="mt-1.5 text-[13.5px] text-muted-foreground">{summary}</p>}

          {!!detected.length && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {detected.map((p) => (
                <span
                  key={p}
                  className="rounded-full bg-secondary px-2.5 py-1 text-[11.5px] font-medium"
                >
                  Proyek: {p}
                </span>
              ))}
            </div>
          )}

          <div className="mt-4 space-y-2">
            {drafts.map((d, i) => (
              <label
                key={i}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 transition-colors hover:border-foreground/20"
              >
                <Checkbox
                  checked={!!selected[i]}
                  onCheckedChange={(v) => setSelected((s) => ({ ...s, [i]: !!v }))}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <KindBadge kind={d.kind} />
                    <span className="text-[14.5px] font-medium">{d.title}</span>
                    {d.needsClarification && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                        <AlertCircle className="size-3" />
                        Perlu Info
                      </span>
                    )}
                    {clarificationAnswers[i] && (
                      <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-600">
                        <CheckCircle className="size-3" />
                        Lengkap
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[12.5px] text-muted-foreground">
                    {d.person ? `Orang: ${d.person}${d.org ? ` — ${d.org}` : ""}` : "Tanpa orang"}
                    {d.project ? ` · Proyek: ${d.project}` : ""}
                    {d.dueOffsetDays != null
                      ? ` · ${d.dueOffsetDays === 0 ? "Hari ini" : d.dueOffsetDays === 1 ? "Besok" : `${d.dueOffsetDays} hari lagi`}`
                      : ""}
                  </p>
                  {d.quote && (
                    <p className="mt-2 border-l-2 border-border pl-2.5 text-[12.5px] italic text-muted-foreground">
                      “{d.quote}”
                    </p>
                  )}
                  {reviewMode && d.aiNote && (
                    <p className="mt-2 rounded-lg bg-secondary/60 px-3 py-2 text-[12.5px] text-muted-foreground">
                      Kenapa NANTI mendeteksi ini: {d.aiNote}
                    </p>
                  )}
                  <div className="mt-2">
                    <ConfidenceBar value={d.confidence} />
                  </div>
                  {reviewMode && (
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" onClick={() => track([i])}>
                        Lacak ini
                      </Button>
                      {d.needsClarification && (
                        <Button size="sm" variant="outline" onClick={() => startClarification(i)}>
                          Lengkapi Info
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelected((s) => ({ ...s, [i]: false }))}
                      >
                        Abaikan
                      </Button>
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>

          {!!context.length && (
            <div className="mt-4 rounded-xl border border-border bg-surface p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Informasi (tidak dijadikan tugas)
              </p>
              <ul className="mt-2 space-y-1">
                {context.map((c, i) => (
                  <li key={i} className="text-[13px] text-muted-foreground">
                    · {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!!drafts.length && (
            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={() => track(drafts.map((_, i) => i))}>Lacak semua</Button>
              <Button
                variant="outline"
                onClick={() =>
                  reviewMode
                    ? track(drafts.map((_, i) => i).filter((i) => selected[i]))
                    : setReviewMode(true)
                }
              >
                {reviewMode ? "Lacak yang dipilih" : "Tinjau satu per satu"}
              </Button>
              <Button variant="ghost" onClick={reset}>
                Abaikan
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ClarificationForm({
  draft,
  onSave,
  onCancel,
  people,
}: {
  draft: Draft;
  onSave: (answers: { person?: string; due?: string; project?: string }) => void;
  onCancel: () => void;
  people: Array<{ id: string; name: string }>;
}) {
  const [person, setPerson] = useState(draft.person || "");
  const [due, setDue] = useState("");
  const [project, setProject] = useState(draft.project || "");

  const missingFields: string[] = [];
  if (!draft.person) missingFields.push("Siapa orangnya?");
  if (draft.dueOffsetDays == null) missingFields.push("Kapan tenggatnya?");
  if (!draft.project) missingFields.push("Proyek apa?");

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5">
      <div className="mb-4 flex items-center gap-2">
        <AlertCircle className="size-5 text-amber-600" />
        <h3 className="text-[14px] font-semibold text-amber-900">Lengkapi Informasi</h3>
      </div>
      <p className="mb-4 text-[13px] text-amber-700">
        NANTI perlu informasi tambahan untuk item ini:
      </p>

      <div className="space-y-3">
        {!draft.person && (
          <div>
            <label className="flex items-center gap-1.5 text-[12px] font-medium text-amber-800">
              <User className="size-3.5" />
              Siapa orangnya?
            </label>
            <Input
              className="mt-1.5 border-amber-200 bg-white"
              placeholder="Nama orang"
              value={person}
              onChange={(e) => setPerson(e.target.value)}
            />
            {people.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {people.slice(0, 5).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPerson(p.name)}
                    className="rounded-full border border-amber-200 bg-white px-2 py-0.5 text-[11px] text-amber-700 hover:bg-amber-100"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {draft.dueOffsetDays == null && (
          <div>
            <label className="flex items-center gap-1.5 text-[12px] font-medium text-amber-800">
              <Calendar className="size-3.5" />
              Kapan tenggatnya?
            </label>
            <Input
              type="date"
              className="mt-1.5 border-amber-200 bg-white"
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
          </div>
        )}

        {!draft.project && (
          <div>
            <label className="flex items-center gap-1.5 text-[12px] font-medium text-amber-800">
              Proyek apa?
            </label>
            <Input
              className="mt-1.5 border-amber-200 bg-white"
              placeholder="Nama proyek (opsional)"
              value={project}
              onChange={(e) => setProject(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          size="sm"
          onClick={() =>
            onSave({
              person: person || undefined,
              due: due || undefined,
              project: project || undefined,
            })
          }
        >
          Simpan
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Batal
        </Button>
      </div>
    </div>
  );
}
