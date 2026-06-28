// BriefFill — Browser locale detection + matching.
// Reads `navigator.languages`, picks the best supported locale, and falls back
// to English if no match is found. Intended to be called once on first
// visit (when localStorage is empty).

import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from "./meta.js";

// Map less-common browser codes to the closest supported locale.
// Examples: pt-PT → pt-BR (we ship Brazilian Portuguese), zh-TW → zh-CN
// (we ship Simplified Chinese only), in → en, etc.
const ALIASES = {
  "pt": "pt-BR",
  "pt-PT": "pt-BR",
  "pt-AO": "pt-BR",
  "pt-MZ": "pt-BR",
  "zh": "zh-CN",
  "zh-HK": "zh-CN",
  "zh-TW": "zh-CN",
  "zh-MO": "zh-CN",
  "zh-SG": "zh-CN",
  "in": "en",      // Indonesian browser code
  "ms": "en",      // Malay
  "tl": "en",      // Filipino
  "iw": "en",      // Hebrew fallback
  "ji": "en",      // Yiddish fallback
  "no": "en",      // Norwegian fallback
};

// Strip regional subtags to get just the language family ("en-US" → "en").
function family(code) {
  return String(code || "").toLowerCase().split("-")[0];
}

export function detectBrowserLocale() {
  if (typeof navigator === "undefined" || !navigator.languages) {
    return DEFAULT_LOCALE;
  }
  const candidates = Array.isArray(navigator.languages)
    ? navigator.languages
    : [navigator.language];
  for (const raw of candidates) {
    if (!raw) continue;
    const code = String(raw).trim();
    // Exact match
    if (SUPPORTED_LOCALES.includes(code)) return code;
    // Alias match
    if (ALIASES[code]) return ALIASES[code];
    // Family match (en-GB → en, es-MX → es)
    const fam = family(code);
    const familyMatch = SUPPORTED_LOCALES.find((l) => family(l) === fam);
    if (familyMatch) return familyMatch;
  }
  return DEFAULT_LOCALE;
}
