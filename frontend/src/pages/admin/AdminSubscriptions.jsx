import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";
import Toast from "../../components/Toast";

const MOCK_SUBS = [
  { id: 1, name: "Julianne Devis", initials: "JD", email: "julianne.d@corporate.com", plan: "Enterprise Tier", desc: "50 briefs/mo • API Access", cycle: "Annually", next: "Oct 12, 2024", status: "active" },
  { id: 2, name: "Marcus Knight", initials: "MK", email: "m.knight@venture.io", plan: "Professional Plan", desc: "15 briefs/mo", cycle: "Monthly", next: "Sep 28, 2023", status: "past_due" },
  { id: 3, name: "Sarah Lopez", initials: "SL", email: "slopez@data-sync.net", plan: "Starter", desc: "5 briefs/mo", cycle: "Monthly", next: "—", status: "cancelled" },
  { id: 4, name: "Elena Rodriguez", initials: "ER", email: "elena.r@horizon-global.com", plan: "Agency Plan", desc: "Unlimited • Team features", cycle: "Annually", next: "Mar 15, 2025", status: "active" },
  { id: 5, name: "Riek Abuinyok", initials: "RA", email: "riekabui@brieffill.com", plan: "Agency Plan", desc: "Unlimited • White-label", cycle: "Annually", next: "Jun 01, 2025", status: "active" },
];

const STATUS_BADGE = {
  active: "bg-emerald-100 text-emerald-700",
  past_due: "bg-amber-100 text-amber-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export default function AdminSubscriptions() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subs, setSubs] = useState(MOCK_SUBS);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) navigate("/admin/login");
  }, [navigate]);

  const filtered = subs.filter((s) => {
    const q = search.toLowerCase();
    if (q && !s.name.toLowerCase().includes(q) && !s.email.toLowerCase().includes(q)) return false;
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    return true;
  });

  const handleAction = (type, name) => {
    const msg = type === "refund" ? "Refund initiated for" : "Subscription cancelled for";
    setToast({ message: `${msg} ${name}.`, type: "success" });
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Subscription Management</h1>
          <p className="text-on-surface-variant mt-1">Monitor billing cycles, manage plans, and oversee financial operations.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-semibold rounded-xl hover:brightness-110 transition-all shadow-sm">
          <Icon name="add_circle" className="text-[18px]" />
          Add/Edit Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active Subs", value: "1,284", icon: "group", color: "text-primary" },
          { label: "MRR Projection", value: "$42,900", icon: "payments", color: "text-secondary" },
          { label: "Churn Rate", value: "1.2%", icon: "trending_down", color: "text-error" },
          { label: "Pending Refunds", value: "04", icon: "history", color: "text-on-surface-variant" },
        ].map((s) => (
          <div key={s.label} className="bg-surface rounded-xl p-5 border border-outline-variant shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[11px] text-on-surface-variant font-semibold uppercase tracking-wider">{s.label}</span>
              <Icon name={s.icon} className={`${s.color} text-[20px]`} />
            </div>
            <div className="text-2xl font-bold text-on-surface">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, email..."
            className="w-full pl-11 pr-4 py-2.5 bg-surface border border-outline-variant rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-surface border border-outline-variant rounded-xl focus:border-primary outline-none text-sm appearance-none cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="past_due">Past Due</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Plan Details</th>
                <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Billing Cycle</th>
                <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-surface-container-lowest transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary font-bold">{s.initials}</div>
                      <div>
                        <div className="font-bold text-on-surface">{s.name}</div>
                        <div className="text-xs text-on-surface-variant">{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-on-surface font-medium">{s.plan}</div>
                    <div className="text-xs text-on-surface-variant">{s.desc}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-on-surface">{s.cycle}</div>
                    <div className="text-xs text-on-surface-variant">{s.next !== "—" ? `Next: ${s.next}` : s.next}</div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_BADGE[s.status] || "bg-gray-100 text-gray-600"}`}>
                      {s.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleAction("refund", s.name)}
                        className="p-2 text-primary hover:bg-primary-fixed rounded-lg transition-colors" title="Refund"
                      >
                        <Icon name="payments" className="text-[18px]" />
                      </button>
                      <button onClick={() => handleAction("cancel", s.name)}
                        className="p-2 text-error hover:bg-error-container/20 rounded-lg transition-colors" title="Cancel"
                      >
                        <Icon name="cancel" className="text-[18px]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant flex items-center justify-between">
          <span className="text-xs text-on-surface-variant">Showing 1-{filtered.length} of 1,284 customers</span>
          <div className="flex gap-2">
            <button className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors">
              <Icon name="chevron_left" className="text-[18px]" />
            </button>
            <button className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors">
              <Icon name="chevron_right" className="text-[18px]" />
            </button>
          </div>
        </div>
      </div>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}
