import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "id" | "en";
export type Bilingual<T> = { id: T; en: T };

const STORAGE_KEY = "nanti-lang";
const DEFAULT_LANG: Lang = "id";

type LangContextValue = { lang: Lang; setLang: (lang: Lang) => void };

const LangContext = createContext<LangContextValue>({
  lang: DEFAULT_LANG,
  setLang: () => {},
});

function readInitialLang(): Lang | null {
  if (typeof window === "undefined") return null;
  const param = new URLSearchParams(window.location.search).get("lang");
  if (param === "id" || param === "en") return param;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "id" || saved === "en") return saved;
  } catch {
    // Storage can be blocked in private mode; the default language still works.
  }
  return null;
}

/**
 * Marketing pages render Indonesian on the server, then switch on the client if
 * the visitor picked English before or arrived with ?lang=en.
 */
export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    const initial = readInitialLang();
    if (initial && initial !== lang) setLangState(initial);
    // Only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore: the choice still applies for this page view.
    }
  }, []);

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

/** Pick the active language's copy from a { id, en } object. */
export function useCopy<T>(copy: Bilingual<T>): T {
  return copy[useLang().lang];
}

export function LangToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div
      role="group"
      aria-label="Bahasa / Language"
      className={`inline-flex rounded-md border border-[#d4d2cb] p-0.5 text-[12px] font-semibold ${className ?? ""}`}
    >
      {(["id", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded px-2 py-1 transition-colors ${
            lang === l ? "bg-[#171c24] text-white" : "text-[#5f6368] hover:text-[#171c24]"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
