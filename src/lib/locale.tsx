import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
export type Locale = 'id' | 'en';
const Context = createContext({ locale: 'id' as Locale, setLocale: (_: Locale) => {}, t: (en: string, id: string) => id });
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('id');
  useEffect(() => { const saved = localStorage.getItem('nanti.locale'); if (saved === 'en' || saved === 'id') setLocale(saved); }, []);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  return <Context.Provider value={{ locale, setLocale: value => { setLocale(value); localStorage.setItem('nanti.locale', value); }, t: (en,id) => locale === 'en' ? en : id }}>{children}</Context.Provider>;
}
export const useLocale = () => useContext(Context);
export function LanguageSwitch() { const { locale, setLocale } = useLocale(); return <div className="language-switch" aria-label="Language / Bahasa">{(['id','en'] as const).map(l => <button key={l} type="button" aria-pressed={locale === l} onClick={() => setLocale(l)}>{l.toUpperCase()}</button>)}</div>; }
