import { Audio, Sequence, staticFile } from "remotion";
import React from "react";
import durations from "./vo-durations.json";

export const FPS = 30;
const LEAD = 8; // frames of silence before each line starts
const TAIL = 18; // frames held after the line ends

type Key = keyof typeof durations;

/** Scene length: long enough for its animation (`min`) and for its voice line. */
export function sceneLength(key: Key, min: number) {
  return Math.max(min, Math.ceil(durations[key] * FPS) + LEAD + TAIL);
}

/** Lays scenes end to end and returns their start frames plus the total. */
export function layout(lengths: number[]) {
  const starts: number[] = [];
  let t = 0;
  for (const l of lengths) {
    starts.push(t);
    t += l;
  }
  return { starts, total: t };
}

export const VoiceLine: React.FC<{ id: Key }> = ({ id }) => (
  <Sequence from={LEAD}>
    <Audio src={staticFile(`vo/${id}.wav`)} />
  </Sequence>
);
