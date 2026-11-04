#!/usr/bin/env bash
# Regenerate the voice-over WAVs and their durations.
# Needs: pip install piper-tts, and the Indonesian Piper voice:
#   curl -L -o m.tar.bz2 https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-id_ID-news_tts-medium.tar.bz2 && tar xjf m.tar.bz2
# Usage: VOICE_DIR=/path/to/vits-piper-id_ID-news_tts-medium ./scripts/make-voiceover.sh
set -euo pipefail
cd "$(dirname "$0")/.."
M="$VOICE_DIR/id_ID-news_tts-medium"
python3 - "$M" <<'PY'
import json, subprocess, sys, wave
m = sys.argv[1]
lines = {k: v for k, v in json.load(open("scripts/voiceover.json")).items() if not k.startswith("_")}
durations = {}
for key, text in lines.items():
    raw = f"public/vo/{key}.raw.wav"
    out = f"public/vo/{key}.wav"
    subprocess.run(["python3", "-m", "piper", "-m", m + ".onnx", "-c", m + ".onnx.json",
                    "--length-scale", "0.95", "--sentence-silence", "0.25", "-f", raw],
                   input=text.encode(), check=True)
    # Even out loudness so every line sits at the same level.
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", raw, "-af", "loudnorm=I=-16:TP=-1.5", "-ar", "44100", out], check=True)
    subprocess.run(["rm", raw], check=True)
    with wave.open(out) as w:
        durations[key] = round(w.getnframes() / w.getframerate(), 3)
json.dump(durations, open("src/nanti/vo-durations.json", "w"), indent=2)
print(durations)
PY
