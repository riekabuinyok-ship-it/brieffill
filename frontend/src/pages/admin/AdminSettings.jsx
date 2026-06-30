import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Mail, Globe, Shield, Bell } from "lucide-react";
import AdminLayout from "../../layouts/AdminLayout";

const SETTINGS_SECTIONS = [
  { id: "general", label: "General", icon: Globe },
  { id: "email", label: "Email", icon: Mail },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
];

export default function AdminSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("general");
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    appName: "BriefFill",
    supportEmail: "support@brieffill.com",
    maxFreeBriefs: "3",
    smtpHost: "smtp.sendgrid.net",
    smtpPort: "587",
    rateLimit: "100",
    sessionTimeout: "60",
    notifyNewUser: true,
    notifyPayment: true,
    notifySuspension: true,
  });

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) navigate("/admin/login");
  }, [navigate]);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const update = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <AdminLayout title="Settings" subtitle="Configure platform settings and preferences.">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {SETTINGS_SECTIONS.map((s) => (
            <button key={s.id} onClick={() => setActiveTab(s.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === s.id ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>
              <s.icon className="w-4 h-4" />
              {s.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSave} className="p-6 max-w-2xl">
          {activeTab === "general" && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Application Name</label>
                <input type="text" value={form.appName} onChange={(e) => update("appName", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Support Email</label>
                <input type="email" value={form.supportEmail} onChange={(e) => update("supportEmail", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Max Briefs (Free Tier)</label>
                <input type="number" value={form.maxFreeBriefs} onChange={(e) => update("maxFreeBriefs", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm" />
              </div>
            </div>
          )}

          {activeTab === "email" && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">SMTP Host</label>
                <input type="text" value={form.smtpHost} onChange={(e) => update("smtpHost", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">SMTP Port</label>
                <input type="text" value={form.smtpPort} onChange={(e) => update("smtpPort", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm" />
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Rate Limit (requests/min)</label>
                <input type="number" value={form.rateLimit} onChange={(e) => update("rateLimit", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Session Timeout (minutes)</label>
                <input type="number" value={form.sessionTimeout} onChange={(e) => update("sessionTimeout", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm" />
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-4">
              {[
                { key: "notifyNewUser", label: "New user registration" },
                { key: "notifyPayment", label: "Payment received" },
                { key: "notifySuspension", label: "Account suspension" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form[key]} onChange={(e) => update(key, e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
            <p className="text-xs text-gray-400">Changes are saved locally (mock).</p>
            <button type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all">
              <Save className="w-4 h-4" />
              {saved ? "Saved!" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
