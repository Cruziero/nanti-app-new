import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Hourglass, Calendar, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { EmptyState, Section } from "@/components/nanti/app-shell";
import { ItemRow } from "@/components/nanti/item-row";
import { Button } from "@/components/ui/button";
import { useNanti } from "@/lib/nanti-store";
import {
  addDays,
  formatDayHeadline,
  greeting,
  isDueToday,
  isOverdue,
  isUpcoming,
  jakartaHour,
  openItems,
  todayISO,
  waitingDays,
} from "@/lib/nanti-utils";
import { useItemDetail } from "@/components/nanti/item-detail";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/today")({
  head: () => ({
    meta: [
      { title: "Hari ini · NANTI" },
      {
        name: "description",
        content:
          "Briefing harian NANTI: apa yang terlambat, jatuh tempo, dan siapa yang Anda tunggu.",
      },
      { property: "og:title", content: "Hari ini · NANTI" },
      {
        property: "og:description",
        content:
          "Briefing harian NANTI: apa yang terlambat, jatuh tempo, dan siapa yang Anda tunggu.",
      },
    ],
  }),
  component: Today,
});

function Today() {
  const { items, settings, hydrated, personOf, projectOf, complete, snooze, update } = useNanti();
  const navigate = useNavigate();
  const openDetail = useItemDetail();
  const [dismissed, setDismissed] = useState(false);
  const [sweepOpen, setSweepOpen] = useState(false);

  useEffect(() => {
    if (hydrated) setSweepOpen(jakartaHour() >= 17);
  }, [hydrated]);

  useEffect(() => {
    if (hydrated && !settings.onboarded) void navigate({ to: "/welcome" });
  }, [hydrated, settings.onboarded, navigate]);

  const overdue = useMemo(() => items.filter(isOverdue), [items]);
  const dueToday = useMemo(() => items.filter(isDueToday), [items]);
  const upcoming = useMemo(() => items.filter(isUpcoming), [items]);
  const waiting = useMemo(
    () =>
      openItems(items)
        .filter((i) => i.kind === "waiting")
        .sort((a, b) => waitingDays(b) - waitingDays(a)),
    [items],
  );
  const totalToday = overdue.length + dueToday.length;
  const urgentCount = overdue.length + dueToday.filter((i) => i.kind === "commitment").length;

  const getPriorityColor = (count: number) => {
    if (count === 0) return "text-green-600";
    if (count <= 2) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div>
      <div className="mb-9">
        <p className="eyebrow">{hydrated ? formatDayHeadline() : "Hari ini"}</p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-tight sm:text-[34px]">
          {greeting(settings.name)}
        </h1>
      </div>

      <div className="rise card-soft mb-10 p-5 sm:p-7">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-5 text-primary" />
          <p className="eyebrow">Briefing NANTI</p>
        </div>
        <p className="mt-3 text-[17px] font-medium leading-relaxed sm:text-[19px]">
          Ada {totalToday} hal yang perlu Anda tangani hari ini.
          {overdue.length > 0 && <> {overdue.length} sudah terlambat.</>}
          {waiting.length > 0 && <> {waiting.length} orang sedang Anda tunggu.</>}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Tugas",
              value: openItems(items).filter((i) => i.kind !== "waiting").length,
              icon: Calendar,
            },
            {
              label: "Terlambat",
              value: overdue.length,
              icon: AlertTriangle,
              color: getPriorityColor(overdue.length),
            },
            { label: "Menunggu", value: waiting.length, icon: Clock },
            { label: "Hari ini", value: dueToday.length, icon: Calendar },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-surface px-3.5 py-3">
              <div className="flex items-center gap-2">
                <p className={cn("text-[22px] font-semibold leading-none tracking-tight", s.color)}>
                  {s.value}
                </p>
                {s.icon && <s.icon className={cn("size-4", s.color || "text-muted-foreground")} />}
              </div>
              <p className="mt-2 text-[12px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {urgentCount > 0 && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-[13px] font-medium text-amber-800">
              ⚠️ {urgentCount} item memerlukan perhatian segera
            </p>
          </div>
        )}
      </div>

      {overdue.length > 0 && (
        <Section title="Terlambat" count={overdue.length}>
          {overdue.map((i, n) => (
            <ItemRow key={i.id} item={i} index={n} />
          ))}
        </Section>
      )}

      <Section title="Jatuh tempo hari ini" count={dueToday.length}>
        {dueToday.length ? (
          dueToday.map((i, n) => <ItemRow key={i.id} item={i} index={n} />)
        ) : (
          <EmptyState
            title="Tidak ada yang jatuh tempo hari ini."
            hint="Napas dulu. NANTI tetap menjaga sisanya."
          />
        )}
      </Section>

      {upcoming.length > 0 && (
        <Section title="Mendatang" count={upcoming.length}>
          {upcoming.slice(0, 3).map((i, n) => (
            <ItemRow key={i.id} item={i} index={n} />
          ))}
        </Section>
      )}

      <Section title="Anda menunggu" count={waiting.length}>
        {waiting.slice(0, 4).map((i, n) => {
          const person = personOf(i.personId);
          return (
            <button
              key={i.id}
              onClick={() => openDetail(i.id)}
              style={{ animationDelay: `${n * 35}ms` }}
              className="rise flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-left transition-colors hover:border-border hover:bg-surface"
            >
              <Hourglass className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-medium">
                  {person?.name ?? i.source} — {i.title}
                </p>
                <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                  Menunggu {waitingDays(i)} hari
                </p>
              </div>
            </button>
          );
        })}
        <div className="px-3 pt-2">
          <Link
            to="/app/waiting"
            className="inline-flex items-center gap-1 text-[13px] font-medium text-primary"
          >
            Lihat semua item menunggu <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </Section>

      {!dismissed && overdue[0] && (
        <div className="rise mb-8 rounded-xl border border-primary/25 bg-accent/60 p-5">
          <p className="eyebrow text-accent-foreground">Saran NANTI</p>
          <p className="mt-2.5 text-[14.5px] leading-relaxed">
            Anda menjanjikan {overdue[0].title.toLowerCase()} kepada{" "}
            {personOf(overdue[0].personId)?.name ?? "klien"} sebelumnya, tetapi saya tidak menemukan
            tindak lanjut setelah percakapan itu.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => {
                snooze(overdue[0]!.id, 1);
                toast("Dijadwalkan untuk follow up");
              }}
            >
              Follow up
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                complete(overdue[0]!.id);
                toast.success("Ditandai selesai");
              }}
            >
              Tandai selesai
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
              Abaikan
            </Button>
          </div>
        </div>
      )}

      {sweepOpen && (overdue.length > 0 || dueToday.length > 0) && (
        <div className="rise mb-4 rounded-xl border border-border bg-surface p-5">
          <p className="eyebrow">Sebelum Anda tutup hari ini</p>
          <p className="mt-2.5 text-[15px] font-medium">
            Masih ada {overdue.length + dueToday.length} hal yang belum selesai.
          </p>
          <ul className="mt-3 space-y-1.5">
            {[...overdue, ...dueToday].slice(0, 5).map((i) => (
              <li key={i.id} className="text-[13.5px] text-muted-foreground">
                · {i.title}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => {
                const tomorrow = addDays(todayISO(), 1);
                [...overdue, ...dueToday].forEach((i) => update(i.id, { due: tomorrow }));
                setSweepOpen(false);
                toast.success("Semua dipindahkan ke besok");
              }}
            >
              Pindahkan semua ke besok
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSweepOpen(false)}>
              Nanti saja
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
