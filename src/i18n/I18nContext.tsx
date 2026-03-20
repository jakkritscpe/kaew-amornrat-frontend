import { createContext, useState, useCallback, type ReactNode } from 'react';
import type { Locale, I18nContextType } from './types';
import th from './translations/th.json';
import en from './translations/en.json';

const STORAGE_KEY = 'repairhub_lang';
const translations: Record<Locale, Record<string, unknown>> = { th, en };

function resolve(obj: unknown, path: string): string {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return path;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === 'string' ? cur : path;
}

function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}

function getInitialLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'th') return stored;
  return 'th';
}

export const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l === 'th' ? 'th' : 'en';
  }, []);

  const t = useCallback((key: string, vars?: Record<string, string | number>): string => {
    const str = resolve(translations[locale], key);
    return interpolate(str, vars);
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}
