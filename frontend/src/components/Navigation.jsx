import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Icon from "./Icon";
import { LogoIcon } from "./Logo";

const productLinks = [
  { name: "Features", href: "/features" },
  { name: "How It Works", href: "/how-it-works" },
  { name: "Pricing", href: "/pricing" },
  { name: "Templates", href: "/templates" },
  { name: "Integrations", href: "/integrations" },
  { name: "Changelog", href: "/docs" },
];

const resourceLinks = [
  { name: "User Guide", href: "/guide" },
  { name: "FAQ", href: "/faq" },
  { name: "Community", href: "/community" },
];

const companyLinks = [
  { name: "About Us", href: "/team" },
  { name: "Our Values", href: "/values" },
  { name: "Careers", href: "/careers" },
  { name: "Press Kit", href: "/press" },
];

const supportLinks = [
  { name: "Help Center", href: "/docs" },
  { name: "Contact", href: "mailto:support@brieffill.com" },
  { name: "Privacy", href: "/docs" },
  { name: "Terms", href: "/referral-terms" },
];

function Dropdown({ label, links, isOpen, onToggle }) {
  return (
    <div className="relative">
      <button onClick={onToggle}
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors">
        {label}
        <Icon name={isOpen ? "expand_less" : "expand_more"} className="text-[16px]" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={onToggle} />
          <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl border border-outline-variant shadow-lg py-2 z-20">
            {links.map((link) => (
              <Link key={link.name} to={link.href} onClick={onToggle}
                className="block px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
                {link.name}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Navigation() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (!userMenuOpen) return;
    function onDoc(e) { if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false); }
    function onKey(e) { if (e.key === "Escape") setUserMenuOpen(false); }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [userMenuOpen]);

  const closeMobile = () => { setMobileOpen(false); setOpenDropdown(null); };
  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-surface border-b border-outline-variant sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <LogoIcon size={28} />
            <span className="text-lg font-logo text-on-surface">BriefFill</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            <Link to="/"
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive("/") && location.pathname === "/" ? "text-primary bg-primary/5" : "text-on-surface-variant hover:bg-surface-container"}`}>
              Home
            </Link>
            <Dropdown
              label="Product"
              links={productLinks}
              isOpen={openDropdown === "product"}
              onToggle={() => setOpenDropdown(openDropdown === "product" ? null : "product")}
            />
            <Link to="/templates"
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive("/templates") ? "text-primary bg-primary/5" : "text-on-surface-variant hover:bg-surface-container"}`}>
              Templates
            </Link>
            <Link to="/pricing"
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive("/pricing") ? "text-primary bg-primary/5" : "text-on-surface-variant hover:bg-surface-container"}`}>
              Pricing
            </Link>
            <Dropdown
              label="Resources"
              links={resourceLinks}
              isOpen={openDropdown === "resources"}
              onToggle={() => setOpenDropdown(openDropdown === "resources" ? null : "resources")}
            />
            <Link to="/team"
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive("/team") ? "text-primary bg-primary/5" : "text-on-surface-variant hover:bg-surface-container"}`}>
              About Us
            </Link>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-container transition-colors">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      (user.name?.charAt(0)?.toUpperCase() || "U")
                    )}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium text-on-surface">{user.name}</span>
                  <Icon name={userMenuOpen ? "expand_less" : "expand_more"} className="text-[16px] text-on-surface-variant" />
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl border border-outline-variant shadow-lg py-2 z-20">
                      <Link to="/dashboard" onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">Dashboard</Link>
                      <Link to="/profile" onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">Profile</Link>
                      <Link to="/settings" onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">Settings</Link>
                      <Link to="/dashboard/billing" onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">Billing</Link>
                      <hr className="my-1 border-outline-variant" />
                      <button onClick={logout}
                        className="block w-full text-left px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">Sign Out</button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link to="/login"
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors">
                  Sign In
                </Link>
                <Link to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors">
                  Get Started
                </Link>
              </>
            )}
            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors">
              <Icon name={mobileOpen ? "close" : "menu"} className="text-[24px]" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-surface border-t border-outline-variant max-h-screen overflow-y-auto">
          <div className="px-4 py-3 space-y-1">
            {user && (
              <>
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      (user.name?.charAt(0)?.toUpperCase() || "U")
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{user.name}</p>
                    <p className="text-xs text-on-surface-variant">{user.email}</p>
                  </div>
                </div>
                <MobileLink to="/dashboard" label="Dashboard" onClick={closeMobile} />
                <MobileLink to="/profile" label="Profile" onClick={closeMobile} />
                <MobileLink to="/settings" label="Settings" onClick={closeMobile} />
                <MobileLink to="/dashboard/billing" label="Billing" onClick={closeMobile} />
                <hr className="my-2 border-outline-variant" />
              </>
            )}
            <MobileLink to="/" label="Home" onClick={closeMobile} />
            <MobileLink to="/docs" label="Features" onClick={closeMobile} />
            <MobileLink to="/how-it-works" label="How It Works" onClick={closeMobile} />
            <MobileLink to="/templates" label="Templates" onClick={closeMobile} />
            <MobileLink to="/pricing" label="Pricing" onClick={closeMobile} />
            <MobileLink to="/team" label="About Us" onClick={closeMobile} />
            <MobileLink to="/values" label="Our Values" onClick={closeMobile} />
            <MobileLink to="/guide" label="User Guide" onClick={closeMobile} />
            <MobileLink to="/faq" label="FAQ" onClick={closeMobile} />
            {!user && (
              <>
                <div className="border-t border-outline-variant my-2" />
                <MobileLink to="/login" label="Sign In" onClick={closeMobile} />
                <Link to="/register" onClick={closeMobile}
                  className="block px-4 py-2.5 text-sm font-semibold text-center text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function MobileLink({ to, label, onClick }) {
  return (
    <Link to={to} onClick={onClick}
      className="block px-4 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors">
      {label}
    </Link>
  );
}
