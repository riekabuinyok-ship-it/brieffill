import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, MoreVertical, UserCheck, UserX, Trash2, X } from "lucide-react";
import AdminLayout from "../../layouts/AdminLayout";

const MOCK_USERS = [
  { id: 1, name: "Sarah Chen", email: "sarah@example.com", plan: "Pro", status: "active", joined: "2026-01-15" },
  { id: 2, name: "Mike Johnson", email: "mike@example.com", plan: "Team", status: "active", joined: "2026-02-20" },
  { id: 3, name: "Emily Davis", email: "emily@example.com", plan: "Free", status: "active", joined: "2026-03-10" },
  { id: 4, name: "Alex Park", email: "alex@example.com", plan: "Pro", status: "active", joined: "2026-01-28" },
  { id: 5, name: "Laura Kim", email: "laura@example.com", plan: "Agency", status: "active", joined: "2025-12-01" },
  { id: 6, name: "James Wilson", email: "james@example.com", plan: "Free", status: "suspended", joined: "2026-04-05" },
  { id: 7, name: "Priya Patel", email: "priya@example.com", plan: "Pro", status: "active", joined: "2026-03-22" },
  { id: 8, name: "Omar Hassan", email: "omar@example.com", plan: "Agency", status: "active", joined: "2025-11-15" },
  { id: 9, name: "Emma Thompson", email: "emma@example.com", plan: "Free", status: "active", joined: "2026-05-01" },
  { id: 10, name: "Ryan Garcia", email: "ryan@example.com", plan: "Team", status: "active", joined: "2026-02-14" },
  { id: 11, name: "Sophie Martin", email: "sophie@example.com", plan: "Pro", status: "inactive", joined: "2026-01-08" },
  { id: 12, name: "David Lee", email: "david@example.com", plan: "Free", status: "active", joined: "2026-04-20" },
];

const STATUS_BADGES = {
  active: "bg-green-100 text-green-700",
  suspended: "bg-red-100 text-red-700",
  inactive: "bg-gray-100 text-gray-600",
};

const PLAN_BADGES = {
  Agency: "bg-purple-100 text-purple-700", Team: "bg-blue-100 text-blue-700",
  Pro: "bg-indigo-100 text-indigo-700", Free: "bg-gray-100 text-gray-700",
};

export default function AdminUsers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("All");
  const [users, setUsers] = useState(MOCK_USERS);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) navigate("/admin/login");
  }, [navigate]);

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === "All" || u.plan === planFilter;
    return matchSearch && matchPlan;
  });

  const toggleStatus = (id) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: u.status === "active" ? "suspended" : "active" } : u));
    setMenuOpen(null);
  };

  const handleDelete = (id) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setConfirmDelete(null);
  };

  return (
    <AdminLayout title="User Management" subtitle="View and manage all registered users.">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["All", "Free", "Pro", "Team", "Agency"].map((p) => (
            <button key={p} onClick={() => setPlanFilter(p)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors border ${
                planFilter === p ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
              }`}>{p}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Plan</th>
                <th className="px-5 py-3 font-semibold">Joined</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{u.name}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PLAN_BADGES[u.plan]}`}>{u.plan}</span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">{u.joined}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGES[u.status]}`}>
                      {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right relative">
                    <button onClick={() => setMenuOpen(menuOpen === u.id ? null : u.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                    {menuOpen === u.id && (
                      <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg border border-gray-200 shadow-lg py-1 z-10">
                        <button onClick={() => toggleStatus(u.id)}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          {u.status === "active" ? <UserX className="w-4 h-4 text-amber-500" /> : <UserCheck className="w-4 h-4 text-green-500" />}
                          {u.status === "active" ? "Suspend" : "Activate"}
                        </button>
                        <button onClick={() => { setConfirmDelete(u.id); setMenuOpen(null); }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-3" />
            <p className="font-medium">No users found</p>
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete User?</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6">This will permanently remove this user and all their data.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(null)} className="px-5 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="px-5 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
