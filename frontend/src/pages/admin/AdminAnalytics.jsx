import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";

export default function AdminAnalytics() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) navigate("/admin/login");
  }, [navigate]);

  const barHeights = [45, 60, 55, 85, 70, 95];

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Analytics & Insights</h1>
          <p className="text-on-surface-variant mt-1">Real-time overview of BriefFill platform health and performance.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 border border-outline text-primary font-medium rounded-xl hover:bg-surface-container-high transition-all">
            <Icon name="csv" className="text-[18px]" /> Export CSV
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary font-semibold rounded-xl hover:brightness-110 transition-all shadow-sm">
            <Icon name="picture_as_pdf" className="text-[18px]" /> Download PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 bg-surface rounded-xl p-6 border border-outline-variant shadow-sm border-l-4 border-primary">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-on-surface">Revenue Growth</h3>
              <p className="text-xs text-on-surface-variant uppercase tracking-wider">Monthly Performance</p>
            </div>
            <div className="bg-surface-container-low rounded-lg p-1 flex gap-1">
              <button className="px-3 py-1 text-xs font-medium bg-surface text-on-surface rounded shadow-sm">Monthly</button>
              <button className="px-3 py-1 text-xs font-medium text-on-surface-variant rounded">Quarterly</button>
            </div>
          </div>
          <div className="flex items-end justify-between gap-2 h-64 mt-4">
            {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((label, i) => (
              <div key={label} className="flex flex-col items-center flex-1 group">
                <div
                  className={`w-full rounded-t-lg transition-all duration-1000 relative ${i === 3 ? "bg-primary" : "bg-primary-container"}`}
                  style={{ height: barHeights[i] + "%" }}
                >
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ${[12.4, 16.8, 15.2, 24.1, 19.5, 28.3][i]}k
                  </div>
                </div>
                <span className="text-xs mt-3 text-on-surface-variant">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-4 bg-surface rounded-xl p-6 border border-outline-variant shadow-sm">
          <h3 className="text-lg font-bold text-on-surface mb-4">Plan Mix</h3>
          <div className="relative w-48 h-48 mx-auto my-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#d8e3fb" strokeDasharray="75, 100" strokeWidth="6" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#8a4cfc" strokeDasharray="20, 100" strokeDashoffset="-75" strokeWidth="6" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#c3c6d7" strokeDasharray="5, 100" strokeDashoffset="-95" strokeWidth="6" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-2xl font-bold text-on-surface">1,248</span>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Subscribers</span>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: "Enterprise Brief", pct: 75, color: "bg-primary-container" },
              { label: "Professional", pct: 20, color: "bg-secondary" },
              { label: "Basic", pct: 5, color: "bg-outline" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-2 hover:bg-surface-container transition-colors rounded">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <span className="text-sm text-on-surface-variant">{item.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-4 bg-surface-container-low rounded-xl p-6 border border-outline-variant shadow-sm border-t-4 border-secondary">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] text-on-surface-variant font-semibold uppercase tracking-wider mb-1">New Signups</p>
              <h4 className="text-3xl font-bold text-on-surface">+184</h4>
            </div>
            <div className="p-2 bg-secondary-container/10 rounded-lg">
              <Icon name="person_add" className="text-secondary text-[22px]" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-emerald-600 font-medium text-sm">
            <Icon name="trending_up" className="text-[16px]" /> 12% from last week
          </div>
          <div className="mt-4 h-16 w-full flex items-end gap-1">
            {[25, 50, 25, 75, 100].map((h, i) => (
              <div key={i} className={`w-full rounded-sm ${i === 4 ? "bg-secondary" : "bg-secondary/40"}`} style={{ height: h + "%" }} />
            ))}
          </div>
        </div>

        <div className="md:col-span-8 bg-surface rounded-xl p-6 border border-outline-variant shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-on-surface">Brief Activity Density</h3>
            <div className="flex items-center gap-4 text-xs text-on-surface-variant">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-surface-variant" /> Low</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-primary" /> High</div>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {[
              20, 40, 30, 80, 50, 60, 40,
              30, 20, 40, 90, 70, 50, 30,
              50, 60, 40, 30, 50, 10, 20,
              40, 30, 50, 20, 10, 40, 60,
            ].map((o, i) => (
              <div key={i} className="h-10 rounded-sm transition-all" style={{ backgroundColor: `rgba(0, 74, 198, ${o / 100})` }} />
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-outline-variant grid grid-cols-3 gap-4">
            <div>
              <span className="block text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Total Briefs</span>
              <span className="text-xl font-bold text-on-surface">14,282</span>
            </div>
            <div>
              <span className="block text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Completion Rate</span>
              <span className="text-xl font-bold text-on-surface">92.4%</span>
            </div>
            <div>
              <span className="block text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Avg. Processing</span>
              <span className="text-xl font-bold text-on-surface">1.2s</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-12 bg-surface rounded-xl border border-outline-variant overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
            <h3 className="text-lg font-bold text-on-surface">Recent Transaction Logs</h3>
            <button className="text-primary font-medium text-sm hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low text-[11px] text-on-surface-variant uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Transaction ID</th>
                  <th className="px-6 py-4 font-semibold">Customer</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Plan</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {[
                  { id: "#TX-94281", customer: "Acme Corp.", status: "successful", plan: "Enterprise", amount: "$2,400.00", date: "Jun 14, 2024" },
                  { id: "#TX-94280", customer: "Global Design Inc", status: "successful", plan: "Professional", amount: "$120.00", date: "Jun 14, 2024" },
                  { id: "#TX-94279", customer: "Sarah Jenkins", status: "failed", plan: "Basic", amount: "$29.00", date: "Jun 13, 2024" },
                ].map((tx) => (
                  <tr key={tx.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-4 font-mono text-sm">{tx.id}</td>
                    <td className="px-6 py-4 font-medium">{tx.customer}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tx.status === "successful" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      }`}>{tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}</span>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">{tx.plan}</td>
                    <td className="px-6 py-4 font-bold">{tx.amount}</td>
                    <td className="px-6 py-4 text-on-surface-variant">{tx.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
