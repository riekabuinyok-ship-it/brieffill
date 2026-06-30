import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, CreditCard, FileText, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import AdminLayout from "../../layouts/AdminLayout";

const STATS = [
  { label: "Total Users", value: "1,247", icon: Users, change: "+12%", up: true },
  { label: "Active Subscriptions", value: "342", icon: CreditCard, change: "+8%", up: true },
  { label: "Total Briefs", value: "4,891", icon: FileText, change: "+24%", up: true },
  { label: "Monthly Revenue", value: "$8,429", icon: DollarSign, change: "+18%", up: true },
];

const RECENT_ACTIVITY = [
  { action: "New user registered", user: "Sarah Chen", time: "2 min ago" },
  { action: "Brief analyzed", user: "Mike Johnson", time: "15 min ago" },
  { action: "Subscription upgraded", user: "Laura Kim", time: "1 hour ago" },
  { action: "Account suspended", user: "James Wilson", time: "3 hours ago" },
  { action: "New brief created", user: "Priya Patel", time: "5 hours ago" },
  { action: "Payment received", user: "Omar Hassan", time: "1 day ago" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) navigate("/admin/login");
  }, [navigate]);

  return (
    <AdminLayout title="Overview" subtitle="System health and performance metrics at a glance.">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {STATS.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{s.label}</span>
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                <s.icon className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${s.up ? "text-green-600" : "text-red-600"}`}>
              {s.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {s.change} from last month
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-bold text-gray-900">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {RECENT_ACTIVITY.map((a, i) => (
            <div key={i} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
              <div>
                <span className="text-sm text-gray-900">{a.action}</span>
                <span className="text-sm text-gray-500 ml-2">— {a.user}</span>
              </div>
              <span className="text-xs text-gray-400">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
