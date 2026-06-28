import { useEffect } from "react";

export function useKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    function handler(e) {
      const key = [
        e.ctrlKey && "ctrl",
        e.shiftKey && "shift",
        e.altKey && "alt",
        e.metaKey && "meta",
        e.key.toLowerCase(),
      ].filter(Boolean).join("+");

      for (const [combo, action] of Object.entries(shortcuts)) {
        if (combo.toLowerCase() === key) {
          e.preventDefault();
          action(e);
          return;
        }
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts]);
}

export function formatShortcut(combo) {
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.platform);
  const parts = combo.split("+");
  return parts.map((p) => {
    if (p === "ctrl") return isMac ? "⌃" : "Ctrl";
    if (p === "shift") return isMac ? "⇧" : "Shift";
    if (p === "alt") return isMac ? "⌥" : "Alt";
    if (p === "meta") return isMac ? "⌘" : "Meta";
    if (p === "Enter") return "↵";
    if (p === "Escape") return "Esc";
    return p.toUpperCase();
  }).join(isMac ? "" : "+");
}
