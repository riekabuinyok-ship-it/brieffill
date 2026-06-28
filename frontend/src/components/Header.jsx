import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LogoIcon } from "./Logo";
import Icon from "./Icon";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/new", label: "New Brief" },
  { to: "/templates", label: "Templates" },
  { to: "/integrations", label: "Integrations" },
  { to: "/api-keys", label: "API Keys" },
  { to: "/notifications", label: "Notifications" },
  { to: "/security", label: "Security" },
  { to: "/profile", label: "Profile" },
  { to: "/teams", label: "Teams" },
  { to: "/dashboard/referrals", label: "Refer & Earn" },
  { to: "/dashboard/billing", label: "Billing" },
  { to: "/settings", label: "Settings" },
];

export default function Header() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDoc(e) { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); }
    function onKey(e) { if (e.key === "Escape") setMenuOpen(false); }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [menuOpen]);

  const isActive = (path) => pathname === path || (path !== "/" && pathname.startsWith(path));

  return (
    <header className="fixed top-0 w-full z-50 h-16 bg-surface border-b border-outline-variant">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2">
          <LogoIcon size={28} />
          <span className="text-lg font-logo text-on-surface hidden sm:inline">BriefFill</span>
        </Link>

        {/* Desktop Nav (logged in) */}
        {user && (
          <div className="hidden md:flex flex-1 mx-4 overflow-x-auto scrollbar-none">
            <nav className="flex items-center gap-1 whitespace-nowrap">
              {NAV_ITEMS.map((item) => (
                <Link key={item.to} to={item.to}
                  className={`px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.to) ? "text-primary bg-primary/5" : "text-on-surface-variant hover:bg-surface-container"
                  }`}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/docs" className="p-2 rounded-full hover:bg-surface-container transition-colors" title="Help">
                <Icon name="help" className="text-[20px] text-on-surface-variant" />
              </Link>
              <div className="relative" ref={menuRef}>
                <button onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-container transition-colors">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium text-on-surface">{user.name}</span>
                  <Icon name={menuOpen ? "expand_less" : "expand_more"} className="text-[16px] text-on-surface-variant" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-surface rounded-lg border border-outline-variant shadow-lg py-1 z-50">
                    <Link to="/profile" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-on-surface hover:bg-surface-container">Profile</Link>
                    <Link to="/settings" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-on-surface hover:bg-surface-container">Settings</Link>
                    <Link to="/dashboard/billing" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-on-surface hover:bg-surface-container">Billing</Link>
                    <hr className="my-1 border-outline-variant" />
                    <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container">Sign Out</button>
                  </div>
                )}
              </div>
              {/* Mobile hamburger */}
              <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-on-surface-variant hover:bg-surface-container rounded-lg">
                <Icon name={mobileOpen ? "close" : "menu"} className="text-[24px]" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors">Sign In</Link>
              <Link to="/register" className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors">Get Started</Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {user && mobileOpen && (
        <div className="md:hidden bg-surface border-t border-outline-variant shadow-lg">
          <nav className="px-4 py-3 space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.to) ? "text-primary bg-primary/5" : "text-on-surface-variant hover:bg-surface-container"
                }`}>
                {item.label}
              </Link>
            ))}
            <hr className="my-2 border-outline-variant" />
            <button onClick={logout} className="block w-full text-left px-3 py-2.5 text-sm font-medium text-error hover:bg-surface-container rounded-lg">Sign Out</button>
          </nav>
        </div>
      )}
    </header>
  );
}
