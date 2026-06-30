import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Users, FileText, DollarSign, Download } from "lucide-react";
import AdminLayout from "../../layouts/AdminLayout";

const ANALYTICS_STATS = [
  { label: "Revenue (MTD)", value: "$8,429", icon: DollarSign, change: "+18%", up: true },
  { label: "User Growth", value: "+184", icon: Users, change: "+12%", up: true },
  { label: "Briefs Created", value: "412", icon: FileText, change: "+24%", up: true },
  { label: "Avg. Brief Score", value: "87.3", icon: TrendingUp, change: "+3.2%", up: true },
];

const MONTHLY_REVENUE = [
  { month: "Jan", revenue: 5200, users: 580, briefs: 180 },
  { month: "Feb", revenue: 6100, users: 680, briefs: 230 },
  { month: "Mar", revenue: 6800, users: 790, briefs: 290 },
  { month: "Apr", revenue: 7400, users: 910, briefs: 340 },
  { month: "May", revenue: 7900, users: 1050, briefs: 380 },
  { month: "Jun", revenue: 8429, users: 1247, briefs: 412 },
];

export default function AdminAnalytics() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) navigate("/admin/login");
  }, [navigate]);

  const maxVal = Math.max(...MONTHLY_REVENUE.map((m) => Math.max(m.revenue, m.users * 8, m.briefs * 25)));

  return (
    <AdminLayout title="Analytics" subtitle="Track platform growth, revenue, and user engagement.">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {ANALYTICS_STATS.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{s.label}</span>
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                <s.icon className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${s.up ? "text-green-600" : "text-red-600"}`}>
              <TrendingUp className="w-3 h-3" />
              {s.change}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-gray-900">Growth Overview</h2>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {[
            { key: "revenue", label: "Revenue", color: "bg-indigo-500" },
            { key: "users", label: "Users", color: "bg-green-500" },
            { key: "briefs", label: "Briefs", color: "bg-amber-500" },
          ].map(({ key, label, color }) => (
            <div key={key}>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 capitalize">{label}</h3>
              <div className="space-y-2">
                {MONTHLY_REVENUE.map((m) => {
                  const val = key === "revenue" ? m.revenue : key === "users" ? m.users * 8 : m.briefs * 25;
                  const pct = (val / maxVal) * 100;
                  const display = key === "revenue" ? `$${m.revenue.toLocaleString()}` : key === "users" ? m.users : m.briefs;
                  return (
                    <div key={m.month} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-8">{m.month}</span>
                      <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-16 text-right">{display}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-bold text-gray-900 mb-4">Key Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">4.8</div>
            <div className="text-sm text-gray-500 mt-1">Avg. Brief Quality Score</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">92%</div>
            <div className="text-sm text-gray-500 mt-1">User Satisfaction Rate</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">3.2</div>
            <div className="text-sm text-gray-500 mt-1">Avg. Briefs per User</div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
