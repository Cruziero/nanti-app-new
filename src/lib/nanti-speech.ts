import { useCallback, useEffect, useRef, useState } from "react";

type SpeechAlternativeLike = { readonly transcript: string };

type SpeechResultLike = {
  readonly isFinal: boolean;
  readonly [index: number]: SpeechAlternativeLike;
};

type SpeechResultListLike = {
  readonly length: number;
  readonly [index: number]: SpeechResultLike;
};

type SpeechRecognitionEventLike = {
  readonly resultIndex: number;
  readonly results: SpeechResultListLike;
};

type SpeechRecognitionErrorEventLike = { readonly error: string };

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export const speechErrorMessages: Record<string, string> = {
  "not-allowed": "Microphone access is blocked. Allow it in your browser, then try again.",
  "service-not-allowed": "Voice input is not available for this browser profile.",
  "no-speech": "I didn't hear anything. Try speaking again.",
  "audio-capture": "No microphone was found on this device.",
  network: "Voice input needs an internet connection.",
};

function speechCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const browser = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return browser.SpeechRecognition ?? browser.webkitSpeechRecognition ?? null;
}

function joinWith(base: string, spoken: string): string {
  if (!spoken) return base;
  if (!base.trim()) return spoken;
  if (/\s$/.test(base)) return `${base}${spoken}`;
  return `${base} ${spoken}`;
}

export type SpeechToText = {
  supported: boolean;
  listening: boolean;
  message: string;
  clearMessage: () => void;
  toggle: () => void;
  stop: () => void;
};

export function useSpeechToText(config: {
  lang: string;
  read: () => string;
  write: (text: string) => void;
}): SpeechToText {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState("");
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const base = useRef("");
  const muted = useRef(false);

  const callbacks = useRef(config);
  useEffect(() => {
    callbacks.current = config;
  });

  useEffect(() => {
    if (speechCtor()) setSupported(true);
  }, []);

  const finish = useCallback(() => {
    setListening(false);
    recognition.current = null;
  }, []);

  const clearMessage = useCallback(() => setMessage(""), []);

  const stop = useCallback(() => {
    muted.current = true;
    recognition.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = speechCtor();
    if (!Ctor || recognition.current) return;
    setMessage("");
    muted.current = false;

    const instance = new Ctor();
    instance.lang = callbacks.current.lang;
    instance.continuous = false;
    instance.interimResults = true;
    base.current = callbacks.current.read();

    instance.onresult = (event) => {
      if (muted.current) return;
      let spoken = "";
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i];
        spoken += result?.[0]?.transcript ?? "";
      }
      callbacks.current.write(joinWith(base.current, spoken));
    };

    instance.onerror = (event) => {
      if (muted.current || event.error === "aborted") return;
      const known = speechErrorMessages[event.error];
      setMessage(known ?? "Voice input stopped unexpectedly. You can keep typing instead.");
      finish();
    };

    instance.onend = finish;

    try {
      instance.start();
    } catch {
      setMessage("Voice input is already running in another tab. Close it, then try again.");
      return;
    }

    recognition.current = instance;
    setListening(true);
  }, [finish]);

  useEffect(
    () => () => {
      muted.current = true;
      recognition.current?.abort();
      recognition.current = null;
    },
    [],
  );

  const toggle = useCallback(() => {
    if (recognition.current) stop();
    else start();
  }, [start, stop]);

  return { supported, listening, message, clearMessage, toggle, stop };
}
