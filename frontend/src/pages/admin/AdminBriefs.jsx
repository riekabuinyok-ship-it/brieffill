import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";
import Toast from "../../components/Toast";

const MOCK_BRIEFS = [
  { id: "BF-2024-001", name: "Global Q4 Logistics Strategy", client: "Velocity Corp", date: "Oct 24, 2023", status: "completed" },
  { id: "BF-2024-005", name: "Project Aurora: Phase 2 Review", client: "Nordic Financial", date: "Oct 23, 2023", status: "processing" },
  { id: "BF-2024-012", name: "Market Expansion: SE Asia", client: "RetailPro Ltd.", date: "Oct 21, 2023", status: "flagged" },
  { id: "BF-2024-015", name: "Sustainability Audit 2024", client: "EcoBuilt Systems", date: "Oct 20, 2023", status: "completed" },
  { id: "BF-2024-018", name: "Brand Identity Refresh", client: "Apex Creative", date: "Oct 19, 2023", status: "pending" },
  { id: "BF-2024-021", name: "Data Center Migration Plan", client: "TechSphere Inc.", date: "Oct 18, 2023", status: "completed" },
];

const STATUS_COLORS = {
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  processing: "bg-blue-100 text-blue-700 border-blue-200",
  flagged: "bg-amber-100 text-amber-700 border-amber-200",
  pending: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function AdminBriefs() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [briefs, setBriefs] = useState(MOCK_BRIEFS);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) navigate("/admin/login");
  }, [navigate]);

  const filtered = briefs.filter((b) => {
    const q = search.toLowerCase();
    if (q && !b.name.toLowerCase().includes(q) && !b.client.toLowerCase().includes(q) && !b.id.toLowerCase().includes(q)) return false;
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    return true;
  });

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setBriefs((prev) => prev.filter((b) => b.id !== deleteTarget.id));
    setToast({ message: `"${deleteTarget.name}" deleted permanently.`, type: "success" });
    setDeleteTarget(null);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Brief Management</h1>
          <p className="text-on-surface-variant mt-1">Overview of all synthesized briefs across the platform.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-semibold rounded-xl hover:brightness-110 transition-all shadow-sm">
          <Icon name="add" className="text-[18px]" />
          New Brief
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface rounded-xl p-5 border border-outline-variant shadow-sm">
          <p className="text-[11px] text-on-surface-variant font-semibold uppercase tracking-wider mb-1">Total Briefs</p>
          <h3 className="text-2xl font-bold text-on-surface">1,482</h3>
          <div className="mt-2 flex items-center text-primary text-xs font-medium">
            <Icon name="trending_up" className="text-[14px] mr-1" /> 12% increase this month
          </div>
        </div>
        <div className="bg-surface rounded-xl p-5 border border-outline-variant shadow-sm">
          <p className="text-[11px] text-on-surface-variant font-semibold uppercase tracking-wider mb-1">Avg. Completion</p>
          <h3 className="text-2xl font-bold text-on-surface">4.2m</h3>
          <div className="mt-2 flex items-center text-on-surface-variant text-xs">
            <Icon name="timer" className="text-[14px] mr-1" /> Optimized by AI
          </div>
        </div>
        <div className="md:col-span-2 bg-surface rounded-xl p-5 border border-outline-variant shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center">
              <Icon name="monitoring" className="text-primary text-[24px]" />
            </div>
            <div>
              <p className="text-[11px] text-on-surface-variant font-semibold uppercase tracking-wider">Platform Health</p>
              <h3 className="text-2xl font-bold text-on-surface">99.9%</h3>
            </div>
            <div className="ml-auto hidden lg:flex items-end gap-1 h-12">
              {[20, 35, 55, 45, 80, 60, 75].map((h, i) => (
                <div key={i} className={`w-3 rounded-t-sm transition-all ${i === 4 ? "bg-primary" : "bg-primary/30"}`} style={{ height: h + "%" }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-low p-4 rounded-xl mb-6 flex flex-col lg:flex-row gap-4 items-center border border-outline-variant">
        <div className="relative w-full lg:flex-1">
          <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by brief name, project, or client..."
            className="w-full pl-11 pr-4 py-2.5 bg-surface border border-outline-variant rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-surface border border-outline-variant rounded-xl focus:border-primary outline-none text-sm appearance-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="pending">Pending</option>
            <option value="flagged">Flagged</option>
          </select>
          <select className="px-4 py-2.5 bg-surface border border-outline-variant rounded-xl focus:border-primary outline-none text-sm appearance-none cursor-pointer">
            <option>Date Range</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>This Quarter</option>
          </select>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Brief Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Client</th>
                <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Date Analyzed</th>
                <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-surface-container-low transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-primary-container/10 flex items-center justify-center">
                        <Icon name="description" className="text-primary text-[16px]" />
                      </div>
                      <div>
                        <div className="font-semibold text-on-surface">{b.name}</div>
                        <div className="text-xs text-on-surface-variant">ID: {b.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-on-surface">{b.client}</td>
                  <td className="px-6 py-4 text-on-surface-variant">{b.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[b.status] || "bg-gray-100 text-gray-600"}`}>
                      {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors" title="View">
                        <Icon name="visibility" className="text-[18px]" />
                      </button>
                      <button onClick={() => setDeleteTarget(b)}
                        className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-colors" title="Delete"
                      >
                        <Icon name="delete" className="text-[18px]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant flex items-center justify-between">
          <span className="text-sm text-on-surface-variant">Showing 1 to {filtered.length} of 1,482 entries</span>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface transition-colors disabled:opacity-50">
              <Icon name="chevron_left" className="text-[16px]" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-on-primary text-sm font-medium">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface transition-colors text-sm">2</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface transition-colors">
              <Icon name="chevron_right" className="text-[16px]" />
            </button>
          </div>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-surface w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center">
                <Icon name="warning" className="text-error text-[24px]" filled />
              </div>
              <h3 className="text-lg font-bold text-on-surface">Confirm Deletion</h3>
            </div>
            <p className="text-on-surface-variant mb-6">
              Are you sure you want to delete <strong className="text-on-surface">{deleteTarget.name}</strong>? This action is irreversible.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-3 border border-outline-variant rounded-xl font-semibold hover:bg-surface-container-low transition-colors"
              >
                Cancel
              </button>
              <button onClick={confirmDelete}
                className="flex-1 px-4 py-3 bg-error text-on-error rounded-xl font-semibold hover:brightness-110 active:scale-95 transition-all"
              >
                Yes, Delete Brief
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}
