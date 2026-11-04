import React from "react";
import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BigLine, CommitmentCard, ReminderNotice } from "./cards";
import { Bubble, C, Logo, fade, sans, serif, useIn } from "./ui";

/* Marketing promo: the problem (promises drowning in chats), then NANTI. 1080x1920, 30fps, 20s. */
export const PROMO_DURATION = 600;

const PROMISES: { group: string; text: string; x: number; y: number; at: number }[] = [
  { group: "Klien PT Maju", text: "Besok saya kirim revisinya ya Pak.", x: 70, y: 180, at: 6 },
  { group: "Grup Supplier", text: "Nanti saya follow up suppliernya.", x: 300, y: 430, at: 14 },
  { group: "Kantor", text: "Saya kirim invoice tanggal 28.", x: 110, y: 680, at: 22 },
  { group: "Bu Rina", text: "Siap, Jumat saya kabari lagi.", x: 330, y: 930, at: 30 },
  { group: "Proyek TPS", text: "PO-nya saya cek sore ini.", x: 60, y: 1180, at: 38 },
  { group: "Pak Budi", text: "Nanti saya transfer DP-nya.", x: 290, y: 1430, at: 46 },
];

/** The chats pile up, then sink. */
const Flood: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sink = fade(frame, 120, 175);
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
              opacity: s * (1 - sink * 0.9) * (1 - fade(frame, 58, 80) * 0.55),
              transform: `scale(${0.85 + s * 0.15}) rotate(${(p.x % 3) - 1}deg)`,
              filter: `blur(${Math.max(sink * 10, fade(frame, 58, 80) * 6)}px)`,
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
          background: `rgba(11,59,51,${interpolate(frame, [58, 80], [0, 0.9], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })})`,
        }}
      >
        <div style={{ opacity: fade(frame, 65, 85) * (1 - fade(frame, 130, 150)) }}>
          <BigLine a="Berapa janji di chat" b="terlupa minggu ini?" dark size={88} />
        </div>
        <div
          style={{
            position: "absolute",
            opacity: fade(frame, 150, 170),
            fontFamily: serif,
            fontSize: 80,
            color: C.white,
            textAlign: "center",
            lineHeight: 1.12,
            padding: "0 90px",
            letterSpacing: -1.5,
          }}
        >
          Janji di WhatsApp
          <br />
          <span style={{ fontStyle: "italic", color: C.mint }}>gampang tenggelam.</span>
        </div>
      </AbsoluteFill>
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
        Teruskan chatnya. NANTI mencatat janjinya dan mengingatkan Anda.
      </div>
    </AbsoluteFill>
  );
};

/** One promise, three states: the chat, the card, the reminder. */
const Transform: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 1 - fade(frame, 38, 50);
  const b = fade(frame, 40, 52) * (1 - fade(frame, 100, 112));
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
      {label("Pengingat", fade(frame, 102, 114))}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", opacity: a, transform: `scale(${1 + (1 - a) * 0.1})` }}>
          <Bubble
            text="nanti saya kirim invoice tgl 28 agustus ya pak Tom"
            style={{ fontSize: 46, maxWidth: 860, alignSelf: "center" }}
          />
        </div>
        <div style={{ position: "absolute", opacity: b }}>
          <CommitmentCard start={40} scale={1.12} />
        </div>
        <div style={{ position: "absolute" }}>
          <ReminderNotice start={104} width={860} />
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
          fontSize: 96,
          color: C.white,
          textAlign: "center",
          lineHeight: 1.1,
          letterSpacing: -2,
          opacity: p,
          transform: `translateY(${(1 - p) * 30}px)`,
        }}
      >
        Coba gratis.
        <br />
        <span style={{ fontStyle: "italic", color: C.mint }}>Mulai dari satu janji.</span>
      </div>
      <div
        style={{
          fontFamily: sans,
          fontSize: 54,
          fontWeight: 700,
          color: C.forest,
          background: C.white,
          borderRadius: 999,
          padding: "26px 70px",
          opacity: fade(frame, 25, 40),
        }}
      >
        nanti.site
      </div>
      <div style={{ fontFamily: sans, fontSize: 32, color: C.white, opacity: fade(frame, 35, 50) * 0.75 }}>
        Tanpa kartu kredit · @nantiapp
      </div>
    </AbsoluteFill>
  );
};

export const Promo: React.FC = () => (
  <AbsoluteFill>
    <Sequence durationInFrames={210}>
      <Flood />
    </Sequence>
    <Sequence from={210} durationInFrames={120}>
      <Reveal />
    </Sequence>
    <Sequence from={330} durationInFrames={160}>
      <Transform />
    </Sequence>
    <Sequence from={490} durationInFrames={110}>
      <Cta />
    </Sequence>
  </AbsoluteFill>
);
