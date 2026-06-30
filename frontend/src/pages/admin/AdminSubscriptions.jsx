import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Users, DollarSign, TrendingUp, MoreVertical, CheckCircle, XCircle } from "lucide-react";
import AdminLayout from "../../layouts/AdminLayout";

const SUBS_STATS = [
  { label: "Active Subs", value: "342", icon: Users, change: "+12%", up: true },
  { label: "Monthly Revenue", value: "$8,429", icon: DollarSign, change: "+18%", up: true },
  { label: "Avg. Revenue/User", value: "$24.65", icon: TrendingUp, change: "+5.2%", up: true },
  { label: "Churn Rate", value: "2.1%", icon: CreditCard, change: "-0.3%", up: false },
];

const MOCK_SUBSCRIPTIONS = [
  { id: 1, user: "Sarah Chen", plan: "Pro", status: "active", started: "2026-01-15", nextBilling: "2026-07-15", amount: "$19.99" },
  { id: 2, user: "Mike Johnson", plan: "Team", status: "active", started: "2026-02-20", nextBilling: "2026-07-20", amount: "$49.99" },
  { id: 3, user: "Emily Davis", plan: "Free", status: "active", started: "2026-03-10", nextBilling: "-", amount: "$0" },
  { id: 4, user: "Alex Park", plan: "Pro", status: "active", started: "2026-01-28", nextBilling: "2026-07-28", amount: "$19.99" },
  { id: 5, user: "Laura Kim", plan: "Agency", status: "active", started: "2025-12-01", nextBilling: "2026-07-01", amount: "$99.99" },
  { id: 6, user: "James Wilson", plan: "Free", status: "suspended", started: "2026-04-05", nextBilling: "-", amount: "$0" },
  { id: 7, user: "Priya Patel", plan: "Pro", status: "active", started: "2026-03-22", nextBilling: "2026-07-22", amount: "$19.99" },
  { id: 8, user: "Omar Hassan", plan: "Agency", status: "active", started: "2025-11-15", nextBilling: "2026-07-15", amount: "$99.99" },
  { id: 9, user: "Sophie Martin", plan: "Pro", status: "canceled", started: "2026-01-08", nextBilling: "-", amount: "$19.99" },
  { id: 10, user: "David Lee", plan: "Free", status: "active", started: "2026-04-20", nextBilling: "-", amount: "$0" },
];

const PLAN_BADGES = {
  Agency: "bg-purple-100 text-purple-700", Team: "bg-blue-100 text-blue-700",
  Pro: "bg-indigo-100 text-indigo-700", Free: "bg-gray-100 text-gray-700",
};

const STATUS_BADGES = {
  active: "bg-green-100 text-green-700",
  suspended: "bg-red-100 text-red-700",
  canceled: "bg-gray-100 text-gray-600",
};

export default function AdminSubscriptions() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) navigate("/admin/login");
  }, [navigate]);

  return (
    <AdminLayout title="Subscriptions" subtitle="Monitor and manage user subscriptions and plans.">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {SUBS_STATS.map((s) => (
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

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Plan</th>
                <th className="px-5 py-3 font-semibold">Amount</th>
                <th className="px-5 py-3 font-semibold">Started</th>
                <th className="px-5 py-3 font-semibold">Next Billing</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MOCK_SUBSCRIPTIONS.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{s.user}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PLAN_BADGES[s.plan]}`}>{s.plan}</span>
                  </td>
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{s.amount}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{s.started}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{s.nextBilling}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGES[s.status]}`}>
                      {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
