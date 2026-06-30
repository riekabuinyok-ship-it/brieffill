import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../utils/api";
import Icon from "./Icon";
import { LogoIcon } from "./Logo";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: "grid_view" },
  { to: "/new", label: "New Brief", icon: "edit" },
  { to: "/templates", label: "Templates", icon: "folder_copy" },
  { to: "/integrations", label: "Integrations", icon: "integration_instructions" },
  { to: "/api-keys", label: "API Keys", icon: "vpn_key" },
  { to: "/notifications", label: "Notifications", icon: "notifications" },
  { to: "/security", label: "Security", icon: "shield" },
  { to: "/profile", label: "Profile", icon: "person" },
  { to: "/teams", label: "Teams", icon: "group" },
  { to: "/dashboard/referrals", label: "Refer & Earn", icon: "redeem" },
  { to: "/dashboard/billing", label: "Billing", icon: "payments" },
  { to: "/settings", label: "Settings", icon: "settings" },
];

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={onMobileClose} />
      )}

      <aside className={`fixed top-0 left-0 h-full w-[260px] bg-white border-r border-outline-variant z-50 flex flex-col transition-transform duration-300 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-outline-variant shrink-0">
          <Link to="/dashboard" className="flex items-center gap-2" onClick={onMobileClose}>
            <LogoIcon size={28} />
            <span className="text-lg tracking-tight text-on-surface font-logo">BriefFill</span>
          </Link>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-3 py-4 sidebar-scroll">
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.to;
              return (
                <Link key={item.label} to={item.to} onClick={onMobileClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive ? "bg-primary/5 text-primary font-medium" : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                  }`}>
                  <Icon name={item.icon} className="text-[20px]" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Plan card + User */}
        <div className="p-4 border-t border-outline-variant shrink-0">
          <PlanCard />
          <UserCard user={user} logout={logout} />
        </div>
      </aside>
    </>
  );
}

function PlanCard() {
  const { user } = useAuth();
  const [realCount, setRealCount] = useState(null);
  const plan = user?.billing?.planName || "Free";
  const status = user?.billing?.status || "active";
  const briefLimit = user?.billing?.briefLimit ?? (plan === "Free" ? 5 : -1);
  const isUnlimited = briefLimit === -1;
  const trialEnd = user?.billing?.trialEndDate;
  const trialDays = trialEnd ? Math.max(0, Math.ceil((new Date(trialEnd + "Z") - new Date()) / (1000 * 60 * 60 * 24))) : 0;
  const isTrial = status === "free_trial" || status === "trial";

  useEffect(() => {
    api.get("/dashboard/stats").then((res) => {
      setRealCount(res.data.totalBriefs);
    }).catch(() => {});
  }, []);

  const count = realCount ?? user?.billing?.briefsUsed ?? 0;
  const displayLimit = isUnlimited ? "∞" : briefLimit;
  const usagePct = isUnlimited ? 0 : Math.min(100, Math.round((count / briefLimit) * 100));

  return (
    <div className="bg-indigo-50/50 rounded-xl p-3 mb-4 border border-indigo-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-indigo-900 uppercase">{plan}</span>
        {isTrial && (
          <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
            <Icon name="auto_awesome" className="text-[10px]" /> Trial
          </span>
        )}
      </div>

      {/* Usage bar */}
      <div className="mb-2">
        <div className="flex justify-between text-[10px] text-indigo-700 mb-1">
          <span>{count} / {displayLimit} briefs</span>
          <span>{isUnlimited ? "—" : `${usagePct}%`}</span>
        </div>
        {!isUnlimited && (
          <div className="w-full bg-indigo-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${usagePct}%` }} />
          </div>
        )}
      </div>

      {isTrial ? (
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-indigo-500">Trial day {Math.max(1, trialDays > 0 ? 30 - trialDays + 1 : 1)} of 30</span>
          <Link to="/pricing" className="text-[10px] text-indigo-700 font-semibold hover:underline">Upgrade →</Link>
        </div>
      ) : plan === "Free" ? (
        <Link to="/pricing" className="text-[10px] text-indigo-700 font-semibold hover:underline">Upgrade to Pro →</Link>
      ) : (
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-green-700 flex items-center gap-1">
            <Icon name="check_circle" className="text-[10px]" /> Active
          </span>
          <Link to="/dashboard/billing" className="text-[10px] text-indigo-700 font-semibold hover:underline">Manage</Link>
        </div>
      )}
    </div>
  );
}

function UserCard({ user, logout }) {
  const isAdmin = !!localStorage.getItem("adminToken");
  const navigate = useNavigate();

  const handleLogout = () => {
    if (isAdmin) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminEmail");
    }
    logout();
  };

  if (!user) {
    if (isAdmin) {
      return (
        <div className="flex items-center gap-3 px-1">
          <div className="h-9 w-9 rounded-full overflow-hidden ring-1 ring-outline-variant shrink-0 bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
            <Icon name="shield" className="text-[16px]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-on-surface truncate">Admin</p>
            <p className="text-[10px] text-on-surface-variant truncate">{localStorage.getItem("adminEmail") || "riek@brieffill.com"}</p>
          </div>
          <button onClick={handleLogout} className="shrink-0 p-1 text-outline hover:text-primary transition-colors" title="Sign Out">
            <Icon name="logout" className="text-[16px]" />
          </button>
        </div>
      );
    }
    return null;
  }

  const initial = user.name?.charAt(0)?.toUpperCase() || "U";
  const avatarUrl = user.avatarUrl;

  return (
    <div className="flex items-center gap-3 px-1">
      <div className="h-9 w-9 rounded-full overflow-hidden ring-1 ring-outline-variant shrink-0 bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
        {avatarUrl ? (
          <>
            <img className="object-cover w-full h-full" src={avatarUrl} alt="" onError={(e) => { e.target.style.display = "none"; e.target.nextElementSibling?.classList.remove("hidden"); }} />
            <span className="hidden">{initial}</span>
          </>
        ) : (
          initial
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-on-surface truncate">{user.name}</p>
        <p className="text-[10px] text-on-surface-variant truncate">{user.email}</p>
      </div>
      <button onClick={handleLogout} className="shrink-0 p-1 text-outline hover:text-primary transition-colors" title="Sign Out">
        <Icon name="logout" className="text-[16px]" />
      </button>
    </div>
  );
}
