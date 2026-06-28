// BriefFill — Locale context.
// Thin React wrapper over i18next. Exposes the current locale, the list of
// supported locales, and a setter that persists the choice to localStorage
// and (when authenticated) to the user's profile via PATCH /api/auth/me.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import i18n from "../i18n/index.js";
import { LOCALES, DEFAULT_LOCALE, getLocaleMeta, isRtl } from "../i18n/meta.js";
import { useAuth } from "./AuthContext.jsx";
import api from "../utils/api.js";

const LocaleCtx = createContext(null);

export function LocaleProvider({ children }) {
  const { user, refreshUser } = useAuth();
  const [locale, setLocaleState] = useState(() => i18n.language || DEFAULT_LOCALE);

  // Keep React state in sync with i18next (other code can call i18n.changeLanguage).
  useEffect(() => {
    function onChange(code) { setLocaleState(code); }
    i18n.on("languageChanged", onChange);
    return () => i18n.off("languageChanged", onChange);
  }, []);

  // When the user's profile arrives, adopt their persisted locale unless the
  // user has explicitly picked a different one in this browser.
  useEffect(() => {
    const userLocale = user?.locale;
    if (!userLocale) return;
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem("brieffill_locale") : null;
    if (!stored && userLocale !== i18n.language) {
      i18n.changeLanguage(userLocale);
    }
  }, [user?.locale]);

  const setLocale = useCallback(async (code) => {
    if (!LOCALES.some((l) => l.code === code)) return;
    await i18n.changeLanguage(code);
    setLocaleState(code);
    // Persist to the profile if logged in (fire-and-forget).
    if (user?.id) {
      try {
        await api.patch("/auth/me", { locale: code });
        refreshUser?.();
      } catch {
        /* offline / not signed in — localStorage still has the choice */
      }
    }
  }, [user?.id, refreshUser]);

  const value = useMemo(() => ({
    locale,
    locales: LOCALES,
    setLocale,
    meta: getLocaleMeta(locale),
    isRtl: isRtl(locale),
  }), [locale, setLocale]);

  return <LocaleCtx.Provider value={value}>{children}</LocaleCtx.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleCtx);
  if (!ctx) throw new Error("useLocale must be used inside <LocaleProvider>");
  return ctx;
}
