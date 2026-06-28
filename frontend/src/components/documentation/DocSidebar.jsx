import { Link } from "react-router-dom";
import Icon from "../Icon";

const SECTIONS = [
  { id: "getting-started", label: "Getting Started", icon: "rocket_launch" },
  { id: "user-guide", label: "User Guide", icon: "menu_book" },
  { id: "api", label: "API Reference", icon: "api" },
  { id: "integrations", label: "Integrations", icon: "hub" },
  { id: "faq", label: "FAQ", icon: "question_answer" },
  { id: "changelog", label: "Changelog", icon: "history" },
];

export default function DocSidebar({ activeSection, onSectionClick, mobileOpen, onMobileClose }) {
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onMobileClose} />
      )}
      <aside className={`fixed md:sticky top-16 md:top-24 left-0 h-[calc(100vh-4rem)] md:h-[calc(100vh-6rem)] w-64 bg-surface border-r border-outline-variant z-50 md:z-0 transition-all duration-300 flex flex-col ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="p-4 border-b border-outline-variant md:hidden">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm">Documentation</span>
            <button onClick={onMobileClose} className="p-1 rounded-lg hover:bg-surface-container">
              <Icon name="close" />
            </button>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => { onSectionClick(s.id); onMobileClose?.(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                activeSection === s.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <Icon name={s.icon} className="text-[18px]" />
              {s.label}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}
