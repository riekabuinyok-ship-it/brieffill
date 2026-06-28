// BriefFill — i18next initialization.
// Single entry point imported from main.jsx before <App />. Loads locale
// preference from localStorage, falls back to browser detection, then
// English. Sets document direction (ltr/rtl) on every change so RTL
// languages (Arabic) flip the layout automatically.

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { SUPPORTED_LOCALES, DEFAULT_LOCALE, isRtl } from "./meta.js";
import { detectBrowserLocale } from "./detect.js";

import enCommon  from "./locales/en/common.json";
import enBrief   from "./locales/en/brief.json";
import enLanding from "./locales/en/landing.json";
import enPricing from "./locales/en/pricing.json";
import enModal   from "./locales/en/modal.json";
import enErrors  from "./locales/en/errors.json";

import esCommon  from "./locales/es/common.json";
import esBrief   from "./locales/es/brief.json";
import esLanding from "./locales/es/landing.json";
import esPricing from "./locales/es/pricing.json";
import esModal   from "./locales/es/modal.json";
import esErrors  from "./locales/es/errors.json";

import frCommon  from "./locales/fr/common.json";
import frBrief   from "./locales/fr/brief.json";
import frLanding from "./locales/fr/landing.json";
import frPricing from "./locales/fr/pricing.json";
import frModal   from "./locales/fr/modal.json";
import frErrors  from "./locales/fr/errors.json";

import deCommon  from "./locales/de/common.json";
import deBrief   from "./locales/de/brief.json";
import deLanding from "./locales/de/landing.json";
import dePricing from "./locales/de/pricing.json";
import deModal   from "./locales/de/modal.json";
import deErrors  from "./locales/de/errors.json";

import ptBRCommon  from "./locales/pt-BR/common.json";
import ptBRBrief   from "./locales/pt-BR/brief.json";
import ptBRLanding from "./locales/pt-BR/landing.json";
import ptBRPricing from "./locales/pt-BR/pricing.json";
import ptBRModal   from "./locales/pt-BR/modal.json";
import ptBRErrors  from "./locales/pt-BR/errors.json";

import itCommon  from "./locales/it/common.json";
import itBrief   from "./locales/it/brief.json";
import itLanding from "./locales/it/landing.json";
import itPricing from "./locales/it/pricing.json";
import itModal   from "./locales/it/modal.json";
import itErrors  from "./locales/it/errors.json";

import nlCommon  from "./locales/nl/common.json";
import nlBrief   from "./locales/nl/brief.json";
import nlLanding from "./locales/nl/landing.json";
import nlPricing from "./locales/nl/pricing.json";
import nlModal   from "./locales/nl/modal.json";
import nlErrors  from "./locales/nl/errors.json";

import jaCommon  from "./locales/ja/common.json";
import jaBrief   from "./locales/ja/brief.json";
import jaLanding from "./locales/ja/landing.json";
import jaPricing from "./locales/ja/pricing.json";
import jaModal   from "./locales/ja/modal.json";
import jaErrors  from "./locales/ja/errors.json";

import koCommon  from "./locales/ko/common.json";
import koBrief   from "./locales/ko/brief.json";
import koLanding from "./locales/ko/landing.json";
import koPricing from "./locales/ko/pricing.json";
import koModal   from "./locales/ko/modal.json";
import koErrors  from "./locales/ko/errors.json";

import zhCNCommon  from "./locales/zh-CN/common.json";
import zhCNBrief   from "./locales/zh-CN/brief.json";
import zhCNLanding from "./locales/zh-CN/landing.json";
import zhCNPricing from "./locales/zh-CN/pricing.json";
import zhCNModal   from "./locales/zh-CN/modal.json";
import zhCNErrors  from "./locales/zh-CN/errors.json";

import arCommon  from "./locales/ar/common.json";
import arBrief   from "./locales/ar/brief.json";
import arLanding from "./locales/ar/landing.json";
import arPricing from "./locales/ar/pricing.json";
import arModal   from "./locales/ar/modal.json";
import arErrors  from "./locales/ar/errors.json";

const STORAGE_KEY = "brieffill_locale";

function pickInitialLocale() {
  if (typeof localStorage !== "undefined") {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LOCALES.includes(saved)) return saved;
  }
  return detectBrowserLocale();
}

function applyDir(code) {
  if (typeof document === "undefined") return;
  const dir = isRtl(code) ? "rtl" : "ltr";
  document.documentElement.dir = dir;
  document.documentElement.lang = code;
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en:    { common: enCommon,    brief: enBrief,    landing: enLanding,    pricing: enPricing,    modal: enModal,    errors: enErrors },
      es:    { common: esCommon,    brief: esBrief,    landing: esLanding,    pricing: esPricing,    modal: esModal,    errors: esErrors },
      fr:    { common: frCommon,    brief: frBrief,    landing: frLanding,    pricing: frPricing,    modal: frModal,    errors: frErrors },
      de:    { common: deCommon,    brief: deBrief,    landing: deLanding,    pricing: dePricing,    modal: deModal,    errors: deErrors },
      "pt-BR": { common: ptBRCommon, brief: ptBRBrief, landing: ptBRLanding, pricing: ptBRPricing, modal: ptBRModal, errors: ptBRErrors },
      it:    { common: itCommon,    brief: itBrief,    landing: itLanding,    pricing: itPricing,    modal: itModal,    errors: itErrors },
      nl:    { common: nlCommon,    brief: nlBrief,    landing: nlLanding,    pricing: nlPricing,    modal: nlModal,    errors: nlErrors },
      ja:    { common: jaCommon,    brief: jaBrief,    landing: jaLanding,    pricing: jaPricing,    modal: jaModal,    errors: jaErrors },
      ko:    { common: koCommon,    brief: koBrief,    landing: koLanding,    pricing: koPricing,    modal: koModal,    errors: koErrors },
      "zh-CN": { common: zhCNCommon, brief: zhCNBrief, landing: zhCNLanding, pricing: zhCNPricing, modal: zhCNModal, errors: zhCNErrors },
      ar:    { common: arCommon,    brief: arBrief,    landing: arLanding,    pricing: arPricing,    modal: arModal,    errors: arErrors },
    },
    lng: pickInitialLocale(),
    fallbackLng: DEFAULT_LOCALE,
    defaultNS: "common",
    ns: ["common", "brief", "landing", "pricing", "modal", "errors"],
    interpolation: { escapeValue: false },
    returnNull: false,
    saveMissing: false,
  });

// Apply direction on init + every change.
applyDir(i18n.language);
i18n.on("languageChanged", (code) => {
  if (typeof localStorage !== "undefined") {
    try { localStorage.setItem(STORAGE_KEY, code); } catch { /* private mode */ }
  }
  applyDir(code);
});

export const LOCALE_STORAGE_KEY = STORAGE_KEY;
export default i18n;
