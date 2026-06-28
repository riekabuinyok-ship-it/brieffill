// BriefFill — Locale metadata for all supported languages.
// Each entry: code, native name, English name, dir (ltr/rtl), flag emoji, completeness.

export const LOCALES = [
  { code: "en",    nativeName: "English",    englishName: "English",    dir: "ltr", flag: "🇺🇸", completeness: 1.00 },
  { code: "es",    nativeName: "Español",    englishName: "Spanish",    dir: "ltr", flag: "🇪🇸", completeness: 1.00 },
  { code: "fr",    nativeName: "Français",   englishName: "French",     dir: "ltr", flag: "🇫🇷", completeness: 1.00 },
  { code: "de",    nativeName: "Deutsch",    englishName: "German",     dir: "ltr", flag: "🇩🇪", completeness: 1.00 },
  { code: "pt-BR", nativeName: "Português (BR)", englishName: "Portuguese (Brazil)", dir: "ltr", flag: "🇧🇷", completeness: 1.00 },
  { code: "it",    nativeName: "Italiano",   englishName: "Italian",    dir: "ltr", flag: "🇮🇹", completeness: 1.00 },
  { code: "nl",    nativeName: "Nederlands", englishName: "Dutch",      dir: "ltr", flag: "🇳🇱", completeness: 1.00 },
  { code: "ja",    nativeName: "日本語",     englishName: "Japanese",   dir: "ltr", flag: "🇯🇵", completeness: 1.00 },
  { code: "ko",    nativeName: "한국어",     englishName: "Korean",     dir: "ltr", flag: "🇰🇷", completeness: 1.00 },
  { code: "zh-CN", nativeName: "简体中文",   englishName: "Chinese (Simplified)", dir: "ltr", flag: "🇨🇳", completeness: 1.00 },
  { code: "ar",    nativeName: "العربية",    englishName: "Arabic",     dir: "rtl", flag: "🇸🇦", completeness: 1.00 },
];

export const DEFAULT_LOCALE = "en";
export const SUPPORTED_LOCALES = LOCALES.map((l) => l.code);

export function getLocaleMeta(code) {
  return LOCALES.find((l) => l.code === code) || LOCALES[0];
}

export function isRtl(code) {
  return getLocaleMeta(code).dir === "rtl";
}
