"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { translations, type Locale } from "./translations";

const STORAGE_KEY = "mealplanner-locale";

function detectLocale(): Locale {
  // Check localStorage first (user override)
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && stored in translations) return stored;

    // Detect from browser language
    const browserLang = navigator.language.split("-")[0] as Locale;
    if (browserLang in translations) return browserLang;
  }
  return "nl";
}

type Translations = typeof translations.nl;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextType>({
  locale: "nl",
  setLocale: () => {},
  t: translations.nl,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("nl");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocaleState(detectLocale());
    setMounted(true);
  }, []);

  function setLocale(newLocale: Locale) {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
  }

  // Avoid hydration mismatch by rendering with default locale until mounted
  const t = translations[mounted ? locale : "nl"];

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
