import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Trash2, FileText, Eye } from "lucide-react";
import AdminLayout from "../../layouts/AdminLayout";

const MOCK_BRIEFS = [
  { id: 1, title: "Q2 Marketing Strategy", user: "Sarah Chen", status: "completed", created: "2026-06-15", words: 1240 },
  { id: 2, title: "Product Launch Brief", user: "Mike Johnson", status: "draft", created: "2026-06-14", words: 580 },
  { id: 3, title: "Brand Guidelines 2026", user: "Emily Davis", status: "completed", created: "2026-06-12", words: 2100 },
  { id: 4, title: "SEO Content Plan", user: "Alex Park", status: "processing", created: "2026-06-10", words: 920 },
  { id: 5, title: "Social Media Calendar", user: "Laura Kim", status: "completed", created: "2026-06-08", words: 1850 },
  { id: 6, title: "Email Campaign Brief", user: "Priya Patel", status: "draft", created: "2026-06-07", words: 430 },
  { id: 7, title: "Customer Case Study", user: "James Wilson", status: "completed", created: "2026-06-05", words: 1650 },
  { id: 8, title: "Annual Report Summary", user: "Emma Thompson", status: "processing", created: "2026-06-03", words: 780 },
  { id: 9, title: "Video Script Brief", user: "Ryan Garcia", status: "draft", created: "2026-06-01", words: 320 },
  { id: 10, title: "Partnership Proposal", user: "Omar Hassan", status: "completed", created: "2026-05-28", words: 2200 },
];

const STATUS_BADGES = {
  completed: "bg-green-100 text-green-700",
  draft: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
};

export default function AdminBriefs() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [briefs, setBriefs] = useState(MOCK_BRIEFS);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) navigate("/admin/login");
  }, [navigate]);

  const filtered = briefs.filter((b) => {
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) || b.user.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleDelete = (id) => {
    setBriefs((prev) => prev.filter((b) => b.id !== id));
    setConfirmDelete(null);
  };

  return (
    <AdminLayout title="Brief Management" subtitle="View and manage all briefs created by users.">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title or user..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["All", "draft", "processing", "completed"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors border ${
                statusFilter === s ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
              }`}>{s === "All" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3 font-semibold">Title</th>
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Words</th>
                <th className="px-5 py-3 font-semibold">Created</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-gray-900 max-w-[200px] truncate">{b.title}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{b.user}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{b.words.toLocaleString()}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{b.created}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGES[b.status]}`}>
                      {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-indigo-600 transition-colors" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => setConfirmDelete(b.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-red-600 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3" />
            <p className="font-medium">No briefs found</p>
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
              <h3 className="text-lg font-bold text-gray-900">Delete Brief?</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6">This will permanently remove this brief and all its content.</p>
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
