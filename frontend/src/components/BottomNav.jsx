import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Icon from "./Icon";

const tabs = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/new", label: "New Brief", icon: "add_circle" },
  { to: "/docs", label: "Docs", icon: "help" },
  { to: "/settings", label: "Settings", icon: "settings" },
];

export default function BottomNav() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  if (!user) return null;
  if (pathname === "/" || pathname === "/login" || pathname === "/register") return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface border-t border-outline-variant shadow-lg rounded-t-xl">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.to);
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={`flex flex-col items-center justify-center transition-transform duration-150 hover:opacity-80 active:scale-90 ${
              isActive
                ? "bg-primary-container text-on-primary-container rounded-full px-4 py-1"
                : "text-on-surface-variant"
            }`}
          >
            <Icon name={tab.icon} filled={isActive} />
            <span className="font-label-sm text-label-sm">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
