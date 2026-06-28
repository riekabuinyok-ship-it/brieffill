// BriefFill — Language switcher.
// Header dropdown that lists all supported locales with their native name +
// flag. Selecting a locale calls `useLocale().setLocale(code)`, which
// persists to localStorage and (if signed in) to the user profile.

import { useEffect, useRef, useState } from "react";
import { useLocale } from "../contexts/LocaleContext.jsx";
import Icon from "./Icon.jsx";

export default function LanguageSwitcher({ variant = "header" }) {
  const { locale, locales, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return undefined;
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = locales.find((l) => l.code === locale) || locales[0];

  const buttonClass = variant === "compact"
    ? "flex items-center gap-1 rounded-lg px-2 py-2 text-on-surface-variant hover:bg-surface-container"
    : "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change language"
        className={buttonClass}
      >
        <span aria-hidden="true" className="text-base leading-none">{current.flag}</span>
        {variant !== "compact" && <span className="hidden sm:inline">{current.nativeName}</span>}
        <Icon name="expand_more" className="text-[16px]" />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-50 mt-1 max-h-80 w-56 overflow-auto rounded-lg border border-outline-variant bg-surface py-1 shadow-lg"
        >
          {locales.map((l) => {
            const active = l.code === locale;
            return (
              <button
                key={l.code}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => { setLocale(l.code); setOpen(false); }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-container ${active ? "bg-primary-container/10 text-primary" : "text-on-surface"}`}
              >
                <span aria-hidden="true" className="text-base leading-none">{l.flag}</span>
                <span className="flex-1">
                  <span className="block font-medium">{l.nativeName}</span>
                  {l.englishName !== l.nativeName && (
                    <span className="block text-xs text-on-surface-variant">{l.englishName}</span>
                  )}
                </span>
                {active && <Icon name="check" className="text-[18px] text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
