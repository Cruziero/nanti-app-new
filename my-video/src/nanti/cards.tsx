import { BellRing, CalendarClock, Check, ScanText } from "lucide-react";
import React from "react";
import { useCurrentFrame } from "remotion";
import { C, fade, sans, serif, useIn } from "./ui";

/** The "commitment detected" card. Rows appear from `start`, the save state flips at `saveAt`. */
export const CommitmentCard: React.FC<{ start: number; saveAt?: number; scale?: number }> = ({
  start,
  saveAt,
  scale = 1,
}) => {
  const frame = useCurrentFrame();
  const enter = useIn(start);
  const saved = saveAt !== undefined && frame >= saveAt;
  const press = useIn(saveAt ?? 100000, 12);
  const rows = [
    { label: "Siapa", value: "Pak Tom" },
    { label: "Apa", value: "Kirim invoice" },
    { label: "Kapan", value: "28 Agustus, 10.00", accent: true },
  ];
  return (
    <div
      style={{
        width: 820,
        background: C.white,
        borderRadius: 40,
        border: `2px solid #d9e7e1`,
        padding: 48,
        fontFamily: sans,
        boxShadow: "0 30px 70px rgba(11,59,51,0.10)",
        opacity: enter,
        transform: `translateY(${(1 - enter) * 60}px) scale(${scale})`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          color: "#0f5132",
          fontWeight: 600,
          fontSize: 30,
          marginBottom: 24,
        }}
      >
        {saved ? <Check size={34} /> : <ScanText size={34} />}
        {saved ? "Tersimpan di catatan" : "Janji terdeteksi"}
      </div>
      {rows.map((r, i) => {
        const o = fade(frame, start + 12 + i * 10, start + 24 + i * 10);
        return (
          <div
            key={r.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              padding: "22px 0",
              borderTop: i ? `2px solid #eceae4` : "none",
              opacity: o,
              transform: `translateX(${(1 - o) * 24}px)`,
            }}
          >
            <span style={{ fontSize: 28, color: C.soft }}>{r.label}</span>
            <span
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: r.accent ? C.deep : C.ink,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              {r.accent && <CalendarClock size={34} />}
              {r.value}
            </span>
          </div>
        );
      })}
      {saveAt !== undefined && (
        <div
          style={{
            marginTop: 26,
            borderRadius: 22,
            padding: "24px 0",
            textAlign: "center",
            fontSize: 32,
            fontWeight: 700,
            color: C.white,
            background: saved ? C.deep : C.green,
            transform: `scale(${1 - Math.sin(Math.min(press, 1) * Math.PI) * 0.05})`,
            opacity: fade(frame, start + 40, start + 52),
          }}
        >
          {saved ? "Tercatat" : "Catat janji"}
        </div>
      )}
    </div>
  );
};

/** A lock-screen style notification. */
export const ReminderNotice: React.FC<{ start: number; width?: number }> = ({
  start,
  width = 680,
}) => {
  const p = useIn(start, 14);
  return (
    <div
      style={{
        width,
        borderRadius: 36,
        background: "rgba(255,255,255,0.94)",
        padding: "30px 34px",
        fontFamily: sans,
        boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
        transform: `translateY(${(1 - p) * -140}px)`,
        opacity: p,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: C.forest,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BellRing size={30} color={C.mint} />
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, color: C.ink }}>NANTI</div>
        <div style={{ marginLeft: "auto", fontSize: 22, color: C.soft }}>sekarang</div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: C.ink }}>Pengingat: 2 jam lagi</div>
      <div style={{ fontSize: 28, color: C.muted, lineHeight: 1.35, marginTop: 4 }}>
        Invoice untuk Pak Tom jatuh tempo jam 10.00 hari ini.
      </div>
    </div>
  );
};

export const BigLine: React.FC<{
  a: string;
  b?: string;
  delay?: number;
  dark?: boolean;
  size?: number;
}> = ({ a, b, delay = 0, dark, size = 96 }) => {
  const p = useIn(delay);
  const q = useIn(delay + 10);
  return (
    <div
      style={{
        fontFamily: serif,
        fontSize: size,
        lineHeight: 1.08,
        letterSpacing: -2,
        textAlign: "center",
        color: dark ? C.white : C.ink,
        padding: "0 80px",
      }}
    >
      <div style={{ opacity: p, transform: `translateY(${(1 - p) * 30}px)` }}>{a}</div>
      {b && (
        <div
          style={{
            fontStyle: "italic",
            color: dark ? C.mint : C.deep,
            opacity: q,
            transform: `translateY(${(1 - q) * 30}px)`,
          }}
        >
          {b}
        </div>
      )}
    </div>
  );
};
