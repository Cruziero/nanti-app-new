import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BigLine, CommitmentCard, ReminderNotice } from "./cards";
import { VoiceLine, layout, sceneLength } from "./timing";
import { Bubble, C, Logo, fade, sans, serif, useIn } from "./ui";

/* Marketing promo with voice-over: promises drown in chats, the viewer does the math on what that costs, then NANTI. 1080x1920, 30fps. */

const LENGTHS = [
  sceneLength("promo-0", 270),
  sceneLength("promo-1", 380),
  sceneLength("promo-2", 120),
  sceneLength("promo-3", 220),
  sceneLength("promo-4", 170),
];
const { starts: STARTS, total: TOTAL } = layout(LENGTHS);
export const PROMO_DURATION = TOTAL;

/* `at` follows the voice: the first three bubbles land as each promise is spoken. */
const PROMISES: { group: string; text: string; x: number; y: number; at: number }[] = [
  { group: "Klien PT Maju", text: "Besok saya kirim revisinya ya Pak.", x: 70, y: 180, at: 10 },
  { group: "Grup Supplier", text: "Nanti saya follow up suppliernya.", x: 300, y: 430, at: 52 },
  { group: "Kantor", text: "Saya kirim invoice tanggal 28.", x: 110, y: 680, at: 92 },
  { group: "Bu Rina", text: "Siap, Jumat saya kabari lagi.", x: 330, y: 930, at: 128 },
  { group: "Proyek TPS", text: "PO-nya saya cek sore ini.", x: 60, y: 1180, at: 140 },
  { group: "Pak Budi", text: "Nanti saya transfer DP-nya.", x: 290, y: 1430, at: 152 },
];

const Flood: React.FC<{ len: number }> = ({ len }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dim = fade(frame, 165, 185);
  const sink = fade(frame, len - 40, len);
  return (
    <AbsoluteFill style={{ background: C.forest, overflow: "hidden" }}>
      {PROMISES.map((p) => {
        const s = spring({ frame: frame - p.at, fps, config: { damping: 14, mass: 0.8 } });
        return (
          <div
            key={p.text}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y + sink * (500 + p.y * 0.4),
              opacity: s * (1 - dim * 0.55),
              transform: `scale(${0.85 + s * 0.15}) rotate(${(p.x % 3) - 1}deg)`,
              filter: `blur(${dim * 6}px)`,
            }}
          >
            <div style={{ fontFamily: sans, fontSize: 24, color: C.mint, margin: "0 0 8px 8px" }}>
              {p.group}
            </div>
            <Bubble text={p.text} time="" style={{ fontSize: 36, maxWidth: 680 }} />
          </div>
        );
      })}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          background: `rgba(11,59,51,${dim * 0.9})`,
        }}
      >
        <div style={{ opacity: fade(frame, 170, 190) * (1 - sink) }}>
          <BigLine a="Berapa janji di chat" b="terlupa minggu ini?" dark size={88} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** The viewer does the math. No invented numbers: the Rp amount is theirs to fill in. */
const DoTheMath: React.FC = () => {
  const frame = useCurrentFrame();
  const rows = [
    { left: "1 follow-up terlupa", right: "1 order hilang", at: 50 },
    { left: "1 invoice telat ditagih", right: "uang Anda tertahan", at: 165 },
  ];
  const ask = fade(frame, 285, 305);
  const cursorOn = Math.floor(frame / 15) % 2 === 0;
  return (
    <AbsoluteFill
      style={{ background: C.paper, padding: "0 90px", fontFamily: sans, justifyContent: "center" }}
    >
      <div
        style={{
          fontFamily: serif,
          fontSize: 100,
          letterSpacing: -2,
          color: C.ink,
          opacity: fade(frame, 4, 20),
        }}
      >
        Hitung <span style={{ fontStyle: "italic", color: C.deep }}>sendiri.</span>
      </div>
      <div style={{ marginTop: 90, display: "flex", flexDirection: "column", gap: 56 }}>
        {rows.map((r) => {
          const a = fade(frame, r.at, r.at + 14);
          const b = fade(frame, r.at + 40, r.at + 56);
          return (
            <div key={r.left} style={{ opacity: a, transform: `translateY(${(1 - a) * 24}px)` }}>
              <div style={{ fontSize: 58, fontWeight: 600, color: C.ink }}>{r.left}</div>
              <div style={{ fontSize: 58, color: C.green, fontWeight: 700, opacity: b }}>
                = {r.right}
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          marginTop: 110,
          borderTop: `3px solid ${C.line}`,
          paddingTop: 60,
          opacity: ask,
          transform: `translateY(${(1 - ask) * 24}px)`,
        }}
      >
        <div style={{ fontSize: 42, color: C.muted }}>Nilai 1 janji untuk bisnis Anda:</div>
        <div
          style={{
            marginTop: 24,
            fontFamily: serif,
            fontSize: 120,
            color: C.ink,
            display: "flex",
            alignItems: "baseline",
            gap: 20,
          }}
        >
          Rp
          <span
            style={{
              display: "inline-block",
              width: 520,
              borderBottom: `6px solid ${C.green}`,
              height: 110,
              position: "relative",
            }}
          >
            {/* Blinking caret: it asks the viewer to fill in their own number. */}
            <span
              style={{
                position: "absolute",
                left: 14,
                bottom: 14,
                width: 6,
                height: 84,
                background: C.green,
                opacity: cursorOn ? 1 : 0,
              }}
            />
          </span>
        </div>
        <div style={{ fontSize: 36, color: C.soft, marginTop: 28 }}>
          × janji yang terlupa tiap bulan
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const p = useIn(0, 16);
  return (
    <AbsoluteFill
      style={{ background: C.paper, alignItems: "center", justifyContent: "center", gap: 90 }}
    >
      <div style={{ transform: `scale(${0.7 + p * 0.3})`, opacity: p }}>
        <Logo size={150} />
      </div>
      <BigLine a="Anda bicara." b="NANTI yang mengingat." delay={18} size={100} />
      <div
        style={{
          fontFamily: sans,
          fontSize: 38,
          color: C.muted,
          textAlign: "center",
          padding: "0 120px",
          lineHeight: 1.45,
          opacity: fade(frame, 45, 60),
        }}
      >
        Ingatan untuk janji di chat WhatsApp Anda.
      </div>
    </AbsoluteFill>
  );
};

/** One promise, three states, timed to "chat → siapa, apa, kapan → mengingatkan". */
const Transform: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 1 - fade(frame, 50, 62);
  const b = fade(frame, 52, 64) * (1 - fade(frame, 130, 142));
  const label = (text: string, on: number) => (
    <div
      style={{
        position: "absolute",
        top: 260,
        width: "100%",
        textAlign: "center",
        fontFamily: sans,
        fontWeight: 700,
        fontSize: 40,
        color: C.green,
        opacity: on,
      }}
    >
      {text}
    </div>
  );
  return (
    <AbsoluteFill style={{ background: C.sand }}>
      {label("Chat", a)}
      {label("Janji", b)}
      {label("Pengingat", fade(frame, 132, 144))}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", opacity: a, transform: `scale(${1 + (1 - a) * 0.1})` }}>
          <Bubble
            text="nanti saya kirim invoice tgl 28 agustus ya pak Tom"
            style={{ fontSize: 46, maxWidth: 860, alignSelf: "center" }}
          />
        </div>
        <div style={{ position: "absolute", opacity: b }}>
          <CommitmentCard start={52} scale={1.12} />
        </div>
        <div style={{ position: "absolute" }}>
          <ReminderNotice start={134} width={860} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const p = useIn(6);
  return (
    <AbsoluteFill
      style={{ background: C.forest, alignItems: "center", justifyContent: "center", gap: 70 }}
    >
      <Logo size={120} dark />
      <div
        style={{
          fontFamily: serif,
          fontSize: 92,
          color: C.white,
          textAlign: "center",
          lineHeight: 1.1,
          letterSpacing: -2,
          padding: "0 70px",
          opacity: p,
          transform: `translateY(${(1 - p) * 30}px)`,
        }}
      >
        Jangan biarkan uang
        <br />
        <span style={{ fontStyle: "italic", color: C.mint }}>hilang karena lupa.</span>
      </div>
      <div
        style={{
          fontFamily: sans,
          fontSize: 50,
          fontWeight: 700,
          color: C.forest,
          background: C.white,
          borderRadius: 999,
          padding: "26px 64px",
          opacity: fade(frame, 60, 75),
        }}
      >
        Coba gratis di nanti.site
      </div>
      <div
        style={{
          fontFamily: sans,
          fontSize: 32,
          color: C.white,
          opacity: fade(frame, 70, 85) * 0.75,
        }}
      >
        Tanpa kartu kredit · @nantiapp
      </div>
    </AbsoluteFill>
  );
};

/* Soft cross-fade into each scene so the cuts don't jump. */
const FadeIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

export const Promo: React.FC = () => (
  <AbsoluteFill style={{ background: C.forest }}>
    <Sequence from={STARTS[0]!} durationInFrames={LENGTHS[0]!}>
      <Flood len={LENGTHS[0]!} />
      <VoiceLine id="promo-0" />
    </Sequence>
    <Sequence from={STARTS[1]!} durationInFrames={LENGTHS[1]!}>
      <FadeIn>
        <DoTheMath />
      </FadeIn>
      <VoiceLine id="promo-1" />
    </Sequence>
    <Sequence from={STARTS[2]!} durationInFrames={LENGTHS[2]!}>
      <FadeIn>
        <Reveal />
      </FadeIn>
      <VoiceLine id="promo-2" />
    </Sequence>
    <Sequence from={STARTS[3]!} durationInFrames={LENGTHS[3]!}>
      <FadeIn>
        <Transform />
      </FadeIn>
      <VoiceLine id="promo-3" />
    </Sequence>
    <Sequence from={STARTS[4]!} durationInFrames={LENGTHS[4]!}>
      <FadeIn>
        <Cta />
      </FadeIn>
      <VoiceLine id="promo-4" />
    </Sequence>
  </AbsoluteFill>
);
