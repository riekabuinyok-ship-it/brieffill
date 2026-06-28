import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";
import Toast from "../../components/Toast";

const MOCK_USERS = [
  { id: 1, name: "Julianne Davis", initials: "JD", email: "j.davis@nexusmedia.com", plan: "team", status: "active" },
  { id: 2, name: "Marcus Kane", initials: "MK", email: "m.kane@freelance.io", plan: "free", status: "active" },
  { id: 3, name: "Thomas Halloway", initials: "TH", email: "thalloway@corp-gov.us", plan: "pro", status: "suspended" },
  { id: 4, name: "Elena Rodriguez", initials: "ER", email: "elena.r@horizon-global.com", plan: "agency", status: "active" },
  { id: 5, name: "Sarah Chen", initials: "SC", email: "sarah@example.com", plan: "pro", status: "active" },
  { id: 6, name: "Mike Johnson", initials: "MJ", email: "mike@example.com", plan: "team", status: "active" },
  { id: 7, name: "Alex Park", initials: "AP", email: "alex@example.com", plan: "pro", status: "active" },
  { id: 8, name: "Laura Kim", initials: "LK", email: "laura@example.com", plan: "agency", status: "active" },
  { id: 9, name: "Riek Abuinyok", initials: "RA", email: "riekabui@brieffill.com", plan: "agency", status: "active" },
];

const PLAN_COLORS = {
  free: "bg-outline-variant/30 text-on-surface-variant",
  pro: "bg-primary/10 text-primary",
  team: "bg-secondary/10 text-secondary",
  agency: "bg-primary/20 text-primary font-bold",
};

const planOrder = ["all", "free", "pro", "team", "agency"];

function getInitials(name) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function bgForInitials(name) {
  const colors = ["bg-primary-fixed", "bg-surface-container-high", "bg-secondary-fixed-dim", "bg-error-container/20"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [users, setUsers] = useState(MOCK_USERS);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) navigate("/admin/login");
  }, [navigate]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    if (planFilter !== "all" && u.plan !== planFilter) return false;
    return true;
  });

  const toggleStatus = (id) => {
    setUsers((prev) => prev.map((u) => {
      if (u.id !== id) return u;
      const newStatus = u.status === "active" ? "suspended" : "active";
      setToast({ message: `${u.name} ${newStatus === "active" ? "activated" : "suspended"}.`, type: "success" });
      return { ...u, status: newStatus };
    }));
  };

  const deleteUser = (id) => {
    const u = users.find((x) => x.id === id);
    setUsers((prev) => prev.filter((x) => x.id !== id));
    setToast({ message: `${u.name} deleted permanently.`, type: "success" });
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">User Management</h1>
          <p className="text-on-surface-variant mt-1">Review, filter, and manage user access.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-semibold rounded-xl hover:brightness-110 transition-all shadow-sm">
          <Icon name="person_add" className="text-[18px]" />
          Invite User
        </button>
      </div>

      <div className="bg-surface rounded-xl border border-outline-variant p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-11 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
            />
          </div>
          <div className="flex p-1 bg-surface-container-low rounded-xl gap-0.5">
            {planOrder.map((p) => (
              <button key={p} onClick={() => setPlanFilter(p)}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                  planFilter === p ? "bg-surface text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {p === "all" ? "All" : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Plan</th>
                <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filtered.map((u) => (
                <tr key={u.id} className={`hover:bg-surface-container-lowest transition-colors group ${u.status === "suspended" ? "bg-surface-container-lowest/50" : ""}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${bgForInitials(u.name)} flex items-center justify-center text-sm font-bold`}>
                        {getInitials(u.name)}
                      </div>
                      <span className="font-medium text-on-surface">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PLAN_COLORS[u.plan]}`}>
                      {u.plan.charAt(0).toUpperCase() + u.plan.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      u.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.status === "active" ? "bg-emerald-500" : "bg-red-500"}`} />
                      {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-on-surface-variant hover:text-primary rounded-lg hover:bg-primary/5 transition-colors" title="View">
                        <Icon name="visibility" className="text-[18px]" />
                      </button>
                      <button onClick={() => toggleStatus(u.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          u.status === "active" ? "text-on-surface-variant hover:text-error hover:bg-error-container/20" : "text-on-surface-variant hover:text-emerald-600 hover:bg-emerald-50"
                        }`}
                        title={u.status === "active" ? "Suspend" : "Activate"}
                      >
                        <Icon name={u.status === "active" ? "block" : "check_circle"} className="text-[18px]" />
                      </button>
                      <button onClick={() => deleteUser(u.id)}
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
          <span className="text-sm text-on-surface-variant">Showing <strong>{filtered.length}</strong> of <strong>{users.length}</strong> users</span>
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant disabled:opacity-50" disabled={filtered.length <= 8}>
              <Icon name="chevron_left" className="text-[18px]" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-on-primary text-sm font-medium">1</button>
            <button className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant">
              <Icon name="chevron_right" className="text-[18px]" />
            </button>
          </div>
        </div>
      </div>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}
