import { useState } from "react";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";
import UpgradePrompt from "../components/UpgradePrompt";
import Icon from "../components/Icon";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button onClick={() => setSidebarOpen(true)}
          className="p-2 bg-white border border-outline-variant rounded-lg shadow-sm text-on-surface-variant">
          <Icon name="menu" />
        </button>
      </div>
      <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      <main className="lg:ml-[260px] min-h-screen transition-all pt-16 lg:pt-0">
        <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-8">
          {children}
        </div>
      </main>
      <BottomNav />
      <UpgradePrompt />
    </>
  );
}
