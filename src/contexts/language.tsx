import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { type Lang, type TranslationKey, getTranslations } from "@/lib/i18n";

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "ar",
  setLang: () => {},
  t: (k) => k,
  isRtl: true,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      return (localStorage.getItem("lang") as Lang) ?? "ar";
    } catch {
      return "ar";
    }
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("lang", l); } catch {}
  }, []);

  const isRtl = lang === "ar";

  useEffect(() => {
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang, isRtl]);

  const translations = useMemo(() => getTranslations(lang), [lang]);
  const t = useCallback((key: TranslationKey): string => translations[key] as string, [translations]);

  const value = useMemo(() => ({ lang, setLang, t, isRtl }), [lang, setLang, t, isRtl]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
