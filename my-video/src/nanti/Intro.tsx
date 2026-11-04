import { ArrowUp, ClipboardPaste, Forward } from "lucide-react";
import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { BigLine, CommitmentCard, ReminderNotice } from "./cards";
import {
  Bubble,
  C,
  ChatHeader,
  Logo,
  Phone,
  StepCaption,
  Typed,
  fade,
  sans,
  serif,
  useIn,
} from "./ui";

/* How-to video: what a new user actually does in NANTI, in three steps. 1080x1920, 30fps, 32s. */
export const INTRO_DURATION = 960;
const MSG = "nanti saya kirim invoice tgl 28 agustus ya pak Tom";

/** Cross-fade wrapper so scenes don't hard-cut. */
const Scene: React.FC<{ len: number; children: React.ReactNode; bg?: string }> = ({
  len,
  children,
  bg = C.paper,
}) => {
  const frame = useCurrentFrame();
  const o = Math.min(fade(frame, 0, 10), 1 - fade(frame, len - 10, len));
  return <AbsoluteFill style={{ background: bg, opacity: o }}>{children}</AbsoluteFill>;
};

const Title: React.FC = () => {
  const p = useIn(4);
  return (
    <Scene len={90}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 70 }}>
        <div style={{ opacity: p, transform: `scale(${0.9 + p * 0.1})` }}>
          <Logo size={120} />
        </div>
        <BigLine a="Cara pakai NANTI" delay={14} size={104} />
        <div
          style={{
            fontFamily: sans,
            fontSize: 40,
            color: C.soft,
            opacity: fade(useCurrentFrame(), 30, 45),
          }}
        >
          3 langkah. Tanpa bikin tugas manual.
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

/** Step 1: the promise sits in WhatsApp, the user brings it to NANTI. */
const StepOne: React.FC = () => {
  const frame = useCurrentFrame();
  const press = interpolate(frame, [40, 55, 85, 95], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sheet = useIn(55, 16);
  const toNanti = fade(frame, 110, 130);
  const sent = frame >= 200;
  return (
    <Scene len={240}>
      <div style={{ position: "absolute", top: 150, width: "100%" }}>
        <StepCaption n={1} text="Teruskan atau tempel chat yang berisi janji." delay={4} />
      </div>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 110 }}>
        <Phone bg={toNanti > 0.5 ? C.paper : C.waBg}>
          {/* WhatsApp side */}
          <div style={{ position: "absolute", inset: 0, opacity: 1 - toNanti }}>
            <ChatHeader name="Pak Tom" sub="WhatsApp Business" initials="PT" />
            <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: 36 }}>
              <Bubble text="Pak, invoice bulan ini kapan ya?" out time="14:30" />
              <Bubble text={MSG} highlight={press} />
            </div>
            <div
              style={{
                position: "absolute",
                left: 30,
                right: 30,
                bottom: 30,
                background: C.white,
                borderRadius: 34,
                padding: "16px 0",
                fontFamily: sans,
                fontSize: 32,
                transform: `translateY(${(1 - sheet) * 400}px)`,
                boxShadow: "0 -10px 40px rgba(0,0,0,0.12)",
              }}
            >
              {[
                { label: "Teruskan ke NANTI", Icon: Forward, on: true },
                { label: "Salin", Icon: ClipboardPaste, on: false },
              ].map(({ label, Icon, on }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 22,
                    padding: "24px 36px",
                    color: on ? C.deep : C.ink,
                    fontWeight: on ? 700 : 500,
                    background: on && frame > 95 ? "#e7f3ee" : "transparent",
                  }}
                >
                  <Icon size={36} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* NANTI side: Tanya NANTI composer */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: toNanti,
              display: "flex",
              flexDirection: "column",
              fontFamily: sans,
            }}
          >
            <div style={{ padding: "70px 40px 30px", display: "flex", alignItems: "center" }}>
              <Logo size={58} />
            </div>
            <div style={{ padding: "0 40px", fontFamily: serif, fontSize: 50, color: C.ink }}>
              Tanya NANTI
            </div>
            <div style={{ flex: 1, padding: 40, display: "flex", flexDirection: "column", gap: 20 }}>
              {sent && <Bubble text={MSG} out time="14:33" style={{ maxWidth: 600 }} />}
              {frame >= 214 && (
                <Bubble
                  text="Siap. Kirim invoice ke Pak Tom, 28 Agustus jam 10.00. Saya ingatkan 2 jam sebelumnya."
                  time="14:33"
                  style={{ maxWidth: 600, opacity: fade(frame, 214, 224) }}
                />
              )}
            </div>
            <div
              style={{
                margin: 30,
                borderRadius: 30,
                border: `3px solid ${frame > 130 && !sent ? C.green : C.line}`,
                background: C.white,
                padding: "26px 26px 26px 34px",
                display: "flex",
                alignItems: "center",
                gap: 20,
                fontSize: 30,
                color: C.ink,
                minHeight: 120,
              }}
            >
              <div style={{ flex: 1, lineHeight: 1.35 }}>
                {sent ? (
                  <span style={{ color: C.soft }}>Ketik atau tempel chat...</span>
                ) : (
                  <Typed text={MSG} start={135} cps={40} />
                )}
              </div>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 20,
                  background: C.green,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${frame >= 192 && frame < 202 ? 0.88 : 1})`,
                }}
              >
                <ArrowUp size={38} color={C.white} />
              </div>
            </div>
          </div>
        </Phone>
      </AbsoluteFill>
    </Scene>
  );
};

/** Step 2: NANTI pulls out who, what, when. */
const StepTwo: React.FC = () => (
  <Scene len={240} bg={C.sand}>
    <div style={{ position: "absolute", top: 150, width: "100%" }}>
      <StepCaption n={2} text="NANTI menemukan siapa, apa, dan kapan." delay={4} />
    </div>
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingTop: 260, gap: 50 }}>
      <Bubble
        text={MSG}
        style={{ maxWidth: 760, alignSelf: "center", opacity: fade(useCurrentFrame(), 10, 25) }}
      />
      <CommitmentCard start={40} saveAt={170} />
    </AbsoluteFill>
  </Scene>
);

/** Step 3: the reminder arrives before the deadline. */
const StepThree: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Scene len={240}>
      <div style={{ position: "absolute", top: 150, width: "100%" }}>
        <StepCaption n={3} text="NANTI mengingatkan sebelum tenggat." delay={4} />
      </div>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 110 }}>
        <Phone bg={C.forest}>
          <div
            style={{
              textAlign: "center",
              color: C.white,
              fontFamily: sans,
              paddingTop: 130,
            }}
          >
            <div style={{ fontSize: 30, opacity: 0.75 }}>Senin, 28 Agustus</div>
            <div style={{ fontSize: 170, fontWeight: 600, letterSpacing: -4 }}>08.00</div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 60 }}>
            <ReminderNotice start={50} />
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 90,
              width: "100%",
              textAlign: "center",
              fontFamily: serif,
              fontStyle: "italic",
              fontSize: 40,
              color: C.mint,
              opacity: fade(frame, 120, 140),
            }}
          >
            Janji tidak tenggelam di chat.
          </div>
        </Phone>
      </AbsoluteFill>
    </Scene>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Scene len={150} bg={C.forest}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 80 }}>
        <Logo size={110} dark />
        <BigLine a="Anda bicara." b="NANTI yang mengingat." delay={10} dark />
        <div
          style={{
            fontFamily: sans,
            fontSize: 44,
            color: C.white,
            opacity: fade(frame, 40, 55),
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Coba gratis di <b>nanti.site</b>
          <div style={{ fontSize: 32, opacity: 0.7 }}>Tanpa kartu kredit</div>
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

export const Intro: React.FC = () => (
  <AbsoluteFill style={{ background: C.paper }}>
    <Sequence durationInFrames={90}>
      <Title />
    </Sequence>
    <Sequence from={90} durationInFrames={240}>
      <StepOne />
    </Sequence>
    <Sequence from={330} durationInFrames={240}>
      <StepTwo />
    </Sequence>
    <Sequence from={570} durationInFrames={240}>
      <StepThree />
    </Sequence>
    <Sequence from={810} durationInFrames={150}>
      <Outro />
    </Sequence>
  </AbsoluteFill>
);
