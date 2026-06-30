import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, FileText, BarChart3, Settings,
  LogOut, ChevronLeft, Menu,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/briefs", label: "Briefs", icon: FileText },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminEmail");
    navigate("/");
  };

  return (
    <div className={`h-screen bg-gray-900 text-white flex flex-col transition-all duration-300 ${collapsed ? "w-16" : "w-64"} fixed left-0 top-0 z-50`}>
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-sm">BF</div>
            <span className="font-bold text-base">BriefFill</span>
            <span className="text-[10px] bg-indigo-600/30 text-indigo-300 px-1.5 py-0.5 rounded ml-1">Admin</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-sm mx-auto">BF</div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1 rounded-lg hover:bg-gray-800 transition-colors text-gray-400">
          <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.to);
          return (
            <Link key={item.to} to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive ? "bg-indigo-600/20 text-indigo-300 border border-indigo-600/30" : "text-gray-400 hover:text-white hover:bg-gray-800 border border-transparent"
              }`}>
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-gray-800">
        <button onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-all border border-transparent hover:border-red-900/30">
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}
