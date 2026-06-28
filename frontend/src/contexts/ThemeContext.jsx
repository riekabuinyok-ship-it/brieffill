import { createContext, useContext, useEffect, useState } from "react";
import api from "../utils/api";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("brieffill_theme") || "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("brieffill_theme", theme);
  }, [theme]);

  useEffect(() => {
    const token = localStorage.getItem("brieffill_token");
    if (token) {
      api.get("/preferences").then((res) => {
        if (res.data?.preferences?.theme) {
          setTheme(res.data.preferences.theme);
        }
      }).catch(() => {});
    }
  }, []);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
