import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";

const stats = [
  { label: "Total Users", value: "12,482", change: "+12%", icon: "group", color: "text-primary", bg: "bg-primary/10" },
  { label: "Active Subscriptions", value: "8,912", change: "+5.2%", icon: "verified", color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "Total Briefs", value: "42,105", change: "+18%", icon: "description", color: "text-secondary", bg: "bg-secondary/10" },
  { label: "Monthly Revenue", value: "$124.5k", change: "+$4.2k", icon: "payments", color: "text-primary", bg: "bg-primary/10" },
  { label: "MRR", value: "$92,400", change: "↑ 8%", icon: "recurring_updates", color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "Churn Rate", value: "1.4%", change: "-0.2%", icon: "trending_down", color: "text-error", bg: "bg-error-container/20" },
];

const recentActivity = [
  { title: "API Usage Surge", time: "2m ago", desc: "Brief generation volume increased by 40% in EMEA region.", type: "info" },
  { title: "New Admin: S. Chen", time: "14m ago", desc: 'Access level: "Content Moderator" granted by Root.', type: "success" },
  { title: "Subscription Failed", time: "1h ago", desc: "Payment processor error for user #9021. Retrying in 12h.", type: "warning" },
  { title: "System Update", time: "3h ago", desc: "Engine v2.4.1 deployed to production successfully.", type: "info" },
  { title: "Weekly Digest Sent", time: "5h ago", desc: "8,422 emails dispatched to active subscribers.", type: "success" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) navigate("/admin/login");
  }, [navigate]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface">Admin Overview</h1>
        <p className="text-on-surface-variant mt-1">System health and performance metrics for the last 30 days.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-surface rounded-xl p-5 border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[11px] text-on-surface-variant font-semibold uppercase tracking-wider">{s.label}</span>
              <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold">{s.change}</span>
            </div>
            <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center mb-2`}>
              <Icon name={s.icon} className={`${s.color} text-[22px]`} />
            </div>
            <div className="text-2xl font-bold text-on-surface">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div className="lg:col-span-8 bg-surface rounded-xl border border-outline-variant p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-on-surface">Revenue Growth</h3>
              <p className="text-xs text-on-surface-variant">Monthly vs Annual plan comparison</p>
            </div>
            <div className="flex gap-1 bg-surface-container-low rounded-lg p-0.5">
              <button className="px-3 py-1 text-xs font-medium bg-surface text-on-surface rounded-md shadow-sm">Daily</button>
              <button className="px-3 py-1 text-xs font-medium text-on-surface-variant">Monthly</button>
            </div>
          </div>
          <div className="relative h-72 flex items-end gap-1 px-2">
            <div className="absolute inset-0 flex flex-col justify-between py-8 pointer-events-none">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="border-t border-outline-variant/50 w-full" />
              ))}
            </div>
            <svg className="w-full h-full absolute" viewBox="0 0 100 40" preserveAspectRatio="none">
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#004ac6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#004ac6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,40 Q10,35 20,25 T40,15 T60,20 T80,5 T100,10 L100,40 L0,40 Z" fill="url(#revGrad)" />
              <path d="M0,40 Q10,35 20,25 T40,15 T60,20 T80,5 T100,10" fill="none" stroke="#004ac6" strokeWidth="0.5" />
            </svg>
            <div className="w-full flex justify-between text-[10px] text-on-surface-variant relative z-10 mb-1">
              <span>JAN</span><span>FEB</span><span>MAR</span><span>APR</span><span>MAY</span><span>JUN</span><span>JUL</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-surface rounded-xl border border-outline-variant p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-on-surface">System Log</h3>
            <button className="text-xs text-primary font-medium hover:underline">View All</button>
          </div>
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {recentActivity.map((a, i) => (
              <div key={i} className={`pl-3 border-l-4 ${a.type === "success" ? "border-emerald-500" : a.type === "warning" ? "border-amber-500" : "border-primary"} bg-surface-container-low p-3 rounded-r-lg`}>
                <div className="flex justify-between items-start">
                  <span className="text-sm font-bold text-on-surface">{a.title}</span>
                  <span className="text-[10px] text-on-surface-variant shrink-0">{a.time}</span>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-on-surface mb-4">Administrative Tools</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Invite User", icon: "person_add" },
            { label: "Compliance", icon: "policy" },
            { label: "Database", icon: "database" },
            { label: "Security", icon: "security" },
          ].map((tool) => (
            <button key={tool.label}
              className="flex flex-col items-center gap-2 p-6 rounded-xl bg-surface-container-high hover:bg-primary hover:text-on-primary transition-all group border border-transparent hover:border-primary"
            >
              <Icon name={tool.icon} className="text-[28px] text-primary group-hover:text-on-primary" />
              <span className="text-xs font-semibold">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
