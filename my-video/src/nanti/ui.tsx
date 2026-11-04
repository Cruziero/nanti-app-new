import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/source-serif-4/400.css";
import "@fontsource/source-serif-4/400-italic.css";
import React from "react";
import {
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/* Same palette as nanti.site after the design cleanup. */
export const C = {
  paper: "#faf9f6",
  sand: "#f2f0ea",
  ink: "#171c24",
  muted: "#4a4d52",
  soft: "#5f6368",
  line: "#e6e3dc",
  green: "#107E71",
  deep: "#075E54",
  forest: "#0b3b33",
  mint: "#8fd6b8",
  waBg: "#efeae2",
  waBubble: "#ffffff",
  waOut: "#d9fdd3",
  white: "#ffffff",
};

export const sans = "'Plus Jakarta Sans', system-ui, sans-serif";
export const serif = "'Source Serif 4', Georgia, serif";

/** 0 → 1 spring that starts at `delay` frames. */
export function useIn(delay = 0, damping = 18) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, mass: 0.8 } });
}

/** Linear fade between two frames, clamped. */
export function fade(frame: number, from: number, to: number) {
  return interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
}

export const Logo: React.FC<{ size?: number; dark?: boolean }> = ({ size = 72, dark }) => (
  <div style={{ display: "flex", alignItems: "center", gap: size * 0.28 }}>
    <Img
      src={staticFile("icon-512.png")}
      style={{ width: size, height: size, borderRadius: size * 0.24 }}
    />
    <span
      style={{
        fontFamily: sans,
        fontWeight: 700,
        fontSize: size * 0.5,
        letterSpacing: size * 0.06,
        color: dark ? C.white : C.ink,
      }}
    >
      NANTI
    </span>
  </div>
);

/** A phone outline so the viewer reads "this happens on my phone". */
export const Phone: React.FC<{
  children: React.ReactNode;
  bg?: string;
  style?: React.CSSProperties;
}> = ({ children, bg = C.waBg, style }) => (
  <div
    style={{
      width: 760,
      height: 1240,
      borderRadius: 88,
      background: "#111",
      padding: 22,
      boxShadow: "0 40px 90px rgba(11,59,51,0.18)",
      ...style,
    }}
  >
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 68,
        overflow: "hidden",
        background: bg,
        position: "relative",
      }}
    >
      {children}
    </div>
  </div>
);

export const ChatHeader: React.FC<{ name: string; sub: string; initials: string }> = ({
  name,
  sub,
  initials,
}) => (
  <div
    style={{
      height: 150,
      background: C.deep,
      display: "flex",
      alignItems: "flex-end",
      padding: "0 36px 26px",
      gap: 22,
      color: C.white,
      fontFamily: sans,
    }}
  >
    <div
      style={{
        width: 70,
        height: 70,
        borderRadius: 35,
        background: "#e7f3ee",
        color: C.deep,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: 26,
      }}
    >
      {initials}
    </div>
    <div>
      <div style={{ fontSize: 32, fontWeight: 600 }}>{name}</div>
      <div style={{ fontSize: 22, opacity: 0.8 }}>{sub}</div>
    </div>
  </div>
);

export const Bubble: React.FC<{
  text: string;
  time?: string;
  out?: boolean;
  style?: React.CSSProperties;
  highlight?: number;
}> = ({ text, time = "14:32", out, style, highlight = 0 }) => (
  <div
    style={{
      alignSelf: out ? "flex-end" : "flex-start",
      maxWidth: 560,
      background: out ? C.waOut : C.waBubble,
      borderRadius: 26,
      borderTopLeftRadius: out ? 26 : 6,
      borderTopRightRadius: out ? 6 : 26,
      padding: "20px 26px 14px",
      fontFamily: sans,
      fontSize: 32,
      lineHeight: 1.35,
      color: C.ink,
      boxShadow: `0 2px 0 rgba(0,0,0,0.06), 0 0 0 ${highlight * 8}px rgba(16,126,113,${highlight * 0.35})`,
      ...style,
    }}
  >
    {text}
    <div style={{ textAlign: "right", fontSize: 20, color: C.soft, marginTop: 6 }}>{time}</div>
  </div>
);

/** Big caption at the top of a step: number + one line. */
export const StepCaption: React.FC<{ n: number; text: string; delay?: number }> = ({
  n,
  text,
  delay = 0,
}) => {
  const p = useIn(delay);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 28,
        opacity: p,
        transform: `translateY(${(1 - p) * 30}px)`,
        padding: "0 90px",
      }}
    >
      <div
        style={{
          fontFamily: serif,
          fontStyle: "italic",
          fontSize: 96,
          lineHeight: 1,
          color: C.green,
        }}
      >
        {n}.
      </div>
      <div
        style={{
          fontFamily: serif,
          fontSize: 68,
          lineHeight: 1.12,
          color: C.ink,
          letterSpacing: -1.5,
          paddingTop: 8,
        }}
      >
        {text}
      </div>
    </div>
  );
};

/** Text that types in, character by character. */
export const Typed: React.FC<{ text: string; start: number; cps?: number }> = ({
  text,
  start,
  cps = 28,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = Math.max(0, Math.floor(((frame - start) / fps) * cps));
  return <>{text.slice(0, n)}</>;
};
