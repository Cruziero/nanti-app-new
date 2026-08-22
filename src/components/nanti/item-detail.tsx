import { createContext, useContext, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { KindBadge } from "./kind-badge";
import { useNanti } from "@/lib/nanti-store";
import { dueLabel, formatDate, priorityLabel } from "@/lib/nanti-utils";
import type { Item } from "@/lib/nanti-types";

const sourceTypeLabel: Record<string, string> = {
  paste: "Tempel percakapan",
  screenshot: "Screenshot",
  demo: "Contoh",
  manual: "Dibuat manual",
};

/** Simple derived history for a commitment. */
function timeline(item: Item): { text: string; when: string }[] {
  const rows: { text: string; when: string }[] = [
    {
      text: `Terdeteksi NANTI dari ${item.source}`,
      when: item.createdAt ? formatDate(item.createdAt) : "Saat impor percakapan",
    },
  ];
  if (item.since) rows.push({ text: "Mulai menunggu", when: formatDate(item.since) });
  if (item.due) rows.push({ text: "Tenggat", when: formatDate(item.due) });
  if (item.status === "done") rows.push({ text: "Diselesaikan", when: "Selesai" });
  if (item.status === "received") rows.push({ text: "Sudah diterima", when: "Selesai" });
  return rows;
}

const Ctx = createContext<(id: string | null) => void>(() => {});
export const useItemDetail = () => useContext(Ctx);

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-2.5">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className="text-right text-[13px] font-medium text-foreground">{children}</span>
    </div>
  );
}

export function ItemDetailProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<string | null>(null);
  const { items, personOf, projectOf, complete, snooze, remove, update, projects } = useNanti();
  const item = items.find((i) => i.id === id);
  const person = personOf(item?.personId);
  const project = projectOf(item?.projectId);

  return (
    <Ctx.Provider value={setId}>
      {children}
      <Sheet open={!!item} onOpenChange={(o) => !o && setId(null)}>
        <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md">
          {item && (
            <>
              <SheetHeader className="gap-3 border-b border-border px-6 py-5">
                <div className="flex items-center gap-2">
                  <KindBadge kind={item.kind} />
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {item.status === "done"
                      ? "Selesai"
                      : item.status === "inbox"
                        ? "Belum dilacak"
                        : "Terbuka"}
                  </span>
                </div>
                <SheetTitle className="text-xl leading-snug">{item.title}</SheetTitle>
                {item.description && (
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                )}
              </SheetHeader>

              <div className="px-6 py-4">
                <Field label="Orang">
                  {person ? `${person.name} — ${person.org}` : (item.personName ?? "—")}
                </Field>
                <Field label="Proyek">{project?.name ?? item.projectName ?? "—"}</Field>
                <Field label="Tenggat">
                  {item.kind === "waiting"
                    ? `Sejak ${formatDate(item.since)}`
                    : formatDate(item.due)}
                </Field>
                <Field label="Prioritas">{priorityLabel[item.priority]}</Field>
                <Field label="Status">{dueLabel(item)}</Field>
                <Field label="Terdeteksi dari">{item.source}</Field>
                <Field label="Cara impor">
                  {sourceTypeLabel[item.sourceType ?? "manual"] ?? "—"}
                </Field>
                <Field label="Dibuat oleh">{item.createdBy === "ai" ? "NANTI (AI)" : "Anda"}</Field>
                <Field label="Keyakinan AI">{Math.round(item.confidence * 100)}%</Field>

                <div className="mt-5 rounded-xl border border-border bg-surface-strong/60 p-4">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Pesan asli
                  </p>
                  <p className="mt-2 text-[14px] italic leading-relaxed text-foreground">
                    “{item.quote}”
                  </p>
                </div>

                <div className="mt-3 rounded-xl border border-primary/20 bg-accent/50 p-4">
                  <p className="text-[11px] uppercase tracking-wider text-accent-foreground">
                    Kenapa NANTI mendeteksi ini
                  </p>
                  <p className="mt-2 text-[14px] leading-relaxed text-foreground">
                    {item.aiNote || "Terdeteksi dari percakapan yang Anda impor."}
                  </p>
                </div>

                <div className="mt-3 rounded-xl border border-border p-4">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Linimasa
                  </p>
                  <ol className="mt-3 space-y-3">
                    {timeline(item).map((t, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                        <div>
                          <p className="text-[13.5px] text-foreground">{t.text}</p>
                          <p className="text-[12px] text-muted-foreground">{t.when}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="mt-3 rounded-xl border border-dashed border-border p-4">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Bukti
                  </p>
                  <p className="mt-2 text-[13px] text-muted-foreground">
                    Lampiran dan screenshot asli akan tersimpan di sini pada versi berikutnya.
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-2 pb-8">
                  <Button
                    size="sm"
                    onClick={() => {
                      complete(item.id);
                      setId(null);
                      toast.success("Ditandai selesai");
                    }}
                  >
                    Tandai selesai
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      snooze(item.id, 1);
                      toast("Ditunda ke besok");
                    }}
                  >
                    Tunda 1 hari
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      update(item.id, { kind: "followup", status: "open" });
                      snooze(item.id, 1);
                      toast("Dijadwalkan untuk ditindaklanjuti besok");
                    }}
                  >
                    Tindak lanjut
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      snooze(item.id, 7);
                      toast("Dijadwalkan ulang");
                    }}
                  >
                    Ubah ke minggu depan
                  </Button>
                  <select
                    className="h-8 rounded-md border border-input bg-surface px-2 text-[13px]"
                    value={item.projectId ?? ""}
                    onChange={(e) =>
                      update(item.id, { projectId: e.target.value ? e.target.value : undefined })
                    }
                  >
                    <option value="">Tanpa proyek</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      remove(item.id);
                      setId(null);
                      toast("Dihapus");
                    }}
                  >
                    Hapus
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </Ctx.Provider>
  );
}
