import { useEffect } from "react";
import Icon from "./Icon";

export default function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(onClose, 3000);
    return () => clearTimeout(id);
  }, [message, onClose]);

  if (!message) return null;

  const colors = type === "success" ? "bg-primary text-on-primary" : type === "error" ? "bg-error text-on-error" : "bg-on-background text-on-primary";
  const icon = type === "success" ? "check_circle" : type === "error" ? "error" : "info";

  return (
    <div className="fixed bottom-24 md:bottom-6 right-6 z-50 animate-fade-in">
      <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm shadow-lg ${colors}`}>
        <Icon name={icon} filled={type === "success"} />
        {message}
      </div>
    </div>
  );
}
