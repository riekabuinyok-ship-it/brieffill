import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Icon from "../../components/Icon";

const navItems = [
  { id: "overview", label: "Overview", icon: "monitoring", path: "/admin" },
  { id: "users", label: "Users", icon: "group", path: "/admin/users" },
  { id: "briefs", label: "Briefs", icon: "description", path: "/admin/briefs" },
  { id: "subscriptions", label: "Subscriptions", icon: "credit_card", path: "/admin/subscriptions" },
  { id: "analytics", label: "Analytics", icon: "analytics", path: "/admin/analytics" },
  { id: "settings", label: "Settings", icon: "settings", path: "/admin/settings" },
];

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminEmail");
    navigate("/admin/login");
  };

  const activeId = navItems.find((item) => {
    if (item.path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(item.path);
  })?.id || "overview";

  return (
    <div className="min-h-screen bg-background">
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-outline-variant rounded-lg shadow-sm text-on-surface-variant"
      >
        <Icon name="menu" />
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-on-surface/50" />
          <aside className="relative w-64 h-full bg-surface shadow-xl" onClick={(e) => e.stopPropagation()}>
            <AdminSidebarContent activeId={activeId} onNavigate={(path) => { setMobileOpen(false); navigate(path); }} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-surface border-r border-outline-variant flex-col z-30">
        <AdminSidebarContent activeId={activeId} onNavigate={navigate} onLogout={handleLogout} />
      </aside>

      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function AdminSidebarContent({ activeId, onNavigate, onLogout }) {
  return (
    <>
      <div className="p-5 border-b border-outline-variant">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate("/admin")}>
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-on-primary">
            <Icon name="shield" />
          </div>
          <div>
            <span className="text-lg font-bold text-on-surface">BriefFill</span>
            <span className="ml-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">Admin</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.path)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeId === item.id
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <Icon name={item.icon} className={activeId === item.id ? "text-primary" : ""} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-outline-variant">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-error hover:bg-error-container/20 transition-all"
        >
          <Icon name="logout" />
          Logout
        </button>
      </div>
    </>
  );
}
