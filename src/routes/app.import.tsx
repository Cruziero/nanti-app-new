import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  ClipboardPaste,
  ImageIcon,
  Loader2,
  Search,
  AlertCircle,
  CheckCircle,
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
      { title: "Bring to NANTI" },
      { name: "description", content: "Paste a conversation or upload a screenshot. NANTI remembers what matters." },
    ],
  }),
  component: ImportPage,
});

type Method = "paste" | "screenshot";

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-16 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11.5px] text-muted-foreground">{pct}% confident</span>
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
    setClarifyingIndex(null);
    setClarificationAnswers({});
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
    if (!res.items.length) toast("NANTI didn't find anything that needs tracking.");
  };

  const run = async (fn: () => Promise<void>) => {
    setLoading(true);
    reset();
    try {
      await fn();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to analyze conversation");
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
        toast.error("Image too large. Max 5 MB.");
        return;
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Failed to read file"));
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
      .map((i) => getClarifiedDraft(drafts[i], i))
      .filter(Boolean) as Draft[];
    if (!chosen.length) {
      toast("Select at least one item.");
      return;
    }
    addItems(chosen.map((d) => draftToItem(d, { people, projects, sourceType })), text || undefined);
    toast.success(`${chosen.length} item${chosen.length !== 1 ? "s" : ""} saved to NANTI memory`);
    reset();
    setText("");
    setPreview(null);
    void navigate({ to: "/app/today" });
  };

  return (
    <div>
      <PageHeader
        title="Bring to NANTI"
        subtitle="Paste a conversation or upload a screenshot. NANTI remembers what matters."
      />

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          onClick={() => {
            setMethod("paste");
            setPreview(null);
          }}
          className={cn(
            "rounded-xl border px-4 py-3.5 text-left transition-colors",
            method === "paste"
              ? "border-primary/60 bg-accent/50"
              : "border-border bg-surface hover:border-primary/40",
          )}
        >
          <ClipboardPaste className="mb-2 size-4 text-primary" />
          <p className="text-[13.5px] font-semibold">Paste conversation</p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">Copy from WhatsApp</p>
        </button>
        <button
          onClick={() => {
            setMethod("screenshot");
            fileRef.current?.click();
          }}
          className={cn(
            "rounded-xl border px-4 py-3.5 text-left transition-colors",
            method === "screenshot"
              ? "border-primary/60 bg-accent/50"
              : "border-border bg-surface hover:border-primary/40",
          )}
        >
          <ImageIcon className="mb-2 size-4 text-primary" />
          <p className="text-[13.5px] font-semibold">Upload screenshot</p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">NANTI reads the image</p>
        </button>
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

      {method === "paste" && (
        <div className="mt-4 space-y-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={9}
            placeholder={'Paste a WhatsApp conversation here...\n\nExample:\n"Nanti saya kirim invoice tanggal 28 Agustus ya Pak Tom."'}
            className="resize-none bg-surface text-[14px] leading-relaxed"
          />
          <Button
            onClick={() => analyzeText(text, "paste")}
            disabled={loading || !text.trim()}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            Analyze with NANTI
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
            <p className="text-[13.5px] font-medium">Choose a WhatsApp screenshot</p>
            <p className="text-[12px] text-muted-foreground">PNG or JPG, max 5 MB</p>
          </button>
          {preview && (
            <img
              src={preview}
              alt="Conversation screenshot preview"
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
            <Search className="size-4 text-primary" />
            <h2 className="text-[16px] font-semibold">
              NANTI found {drafts.length} thing{drafts.length !== 1 ? "s" : ""} to remember.
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
                  Project: {p}
                </span>
              ))}
            </div>
          )}

          <div className="mt-4 space-y-2">
            {drafts.map((d, i) => {
              const clarified = getClarifiedDraft(d, i);
              return (
                <div key={i} className="rounded-lg border border-border p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={!!selected[i]}
                      onCheckedChange={(v) => setSelected((s) => ({ ...s, [i]: !!v }))}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <KindBadge kind={d.kind} />
                        <span className="text-[14.5px] font-medium">{d.title}</span>
                        {clarificationAnswers[i] && (
                          <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-600">
                            <CheckCircle className="size-3" />
                            Complete
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[12.5px] text-muted-foreground">
                        {clarified.person || d.person
                          ? `${clarified.person || d.person}${clarified.org || d.org ? ` — ${clarified.org || d.org}` : ""}`
                          : "No person"}
                        {clarified.project || d.project ? ` · ${clarified.project || d.project}` : ""}
                        {clarified.dueOffsetDays != null
                          ? ` · ${clarified.dueOffsetDays === 0 ? "Today" : clarified.dueOffsetDays === 1 ? "Tomorrow" : `${clarified.dueOffsetDays} days`}`
                          : ""}
                      </p>
                      {d.quote && (
                        <p className="mt-2 border-l-2 border-border pl-2.5 text-[12.5px] italic text-muted-foreground">
                          "{d.quote}"
                        </p>
                      )}
                      {d.aiNote && (
                        <p className="mt-2 text-[12px] text-muted-foreground">
                          Why NANTI knows: {d.aiNote}
                        </p>
                      )}
                      <div className="mt-2">
                        <ConfidenceBar value={d.confidence} />
                      </div>

                      {/* Inline clarification */}
                      {clarifyingIndex === i && (
                        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                          <p className="mb-2 text-[12px] font-medium text-amber-800">
                            Missing information
                          </p>
                          <div className="space-y-2">
                            {(!d.person && !clarificationAnswers[i]?.person) && (
                              <div>
                                <label className="text-[11px] text-amber-700">Who is involved?</label>
                                <Input
                                  className="mt-1 border-amber-200 bg-white"
                                  placeholder="Person name"
                                  defaultValue={d.person || ""}
                                  onBlur={(e) =>
                                    setClarificationAnswers((prev) => ({
                                      ...prev,
                                      [i]: { ...prev[i], person: e.target.value || undefined },
                                    }))
                                  }
                                />
                              </div>
                            )}
                            {d.dueOffsetDays == null && !clarificationAnswers[i]?.due && (
                              <div>
                                <label className="text-[11px] text-amber-700">When is it due?</label>
                                <div className="mt-1 flex gap-1.5">
                                  {["Today", "Tomorrow", "Next week"].map((opt) => (
                                    <button
                                      key={opt}
                                      onClick={() =>
                                        setClarificationAnswers((prev) => ({
                                          ...prev,
                                          [i]: { ...prev[i], due: opt },
                                        }))
                                      }
                                      className="rounded-md border border-amber-200 bg-white px-2 py-1 text-[11px] text-amber-700 hover:bg-amber-100"
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => setClarifyingIndex(null)}
                            className="mt-2 text-[11px] font-medium text-amber-600 hover:text-amber-800"
                          >
                            Done
                          </button>
                        </div>
                      )}

                      {d.needsClarification && clarifyingIndex !== i && !clarificationAnswers[i] && (
                        <button
                          onClick={() => setClarifyingIndex(i)}
                          className="mt-2 flex items-center gap-1 text-[11.5px] font-medium text-amber-600 hover:text-amber-800"
                        >
                          <AlertCircle className="size-3" />
                          Missing info — add details
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!!context.length && (
            <div className="mt-4 rounded-xl border border-border bg-surface p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Context (not tracked)
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
              <Button onClick={() => track(drafts.map((_, i) => i))}>
                Remember all
              </Button>
              <Button
                variant="outline"
                onClick={() => track(drafts.map((_, i) => i).filter((i) => selected[i]))}
              >
                Remember selected
              </Button>
              <Button variant="ghost" onClick={reset}>
                Discard
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
