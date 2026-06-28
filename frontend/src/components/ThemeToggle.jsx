import { useTheme } from "../contexts/ThemeContext";
import Icon from "./Icon";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="rounded-md p-1.5 text-on-surface-variant hover:bg-surface-container dark:text-outline-variant dark:hover:bg-surface-dim"
    >
      <Icon name={theme === "dark" ? "light_mode" : "dark_mode"} />
    </button>
  );
}
