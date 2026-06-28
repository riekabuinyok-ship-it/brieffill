import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";
import Toast from "../../components/Toast";

export default function AdminSettings() {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) navigate("/admin/login");
  }, [navigate]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface">System Settings</h1>
        <p className="text-on-surface-variant mt-1">Manage system configuration and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-surface rounded-xl border border-outline-variant p-6 shadow-sm">
          <h3 className="text-lg font-bold text-on-surface mb-4">General Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">Company Name</label>
              <input type="text" defaultValue="BriefFill"
                className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">Support Email</label>
              <input type="email" defaultValue="support@brieffill.com"
                className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">Default Locale</label>
              <select className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl focus:border-primary outline-none text-sm appearance-none cursor-pointer">
                <option>English (US)</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
              </select>
            </div>
            <button onClick={() => setToast({ message: "General settings saved.", type: "success" })}
              className="px-5 py-2.5 bg-primary text-on-primary font-semibold rounded-xl hover:brightness-110 transition-all"
            >
              Save Settings
            </button>
          </div>
        </section>

        <section className="bg-surface rounded-xl border border-outline-variant p-6 shadow-sm">
          <h3 className="text-lg font-bold text-on-surface mb-4">Security Settings</h3>
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-on-surface">Two-Factor Authentication</p>
                <p className="text-sm text-on-surface-variant">Require 2FA for all admin accounts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-outline-variant rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-on-surface">Session Timeout</p>
                <p className="text-sm text-on-surface-variant">Auto-logout after 30 minutes of inactivity</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-outline-variant rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
            </div>
            <button onClick={() => setToast({ message: "Security settings updated.", type: "success" })}
              className="px-5 py-2.5 bg-primary text-on-primary font-semibold rounded-xl hover:brightness-110 transition-all"
            >
              Save Security
            </button>
          </div>
        </section>

        <section className="bg-surface rounded-xl border border-outline-variant p-6 shadow-sm">
          <h3 className="text-lg font-bold text-on-surface mb-4">Email Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">SMTP Host</label>
              <input type="text" placeholder="smtp.example.com"
                className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">SMTP Port</label>
                <input type="text" placeholder="587"
                  className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Encryption</label>
                <select className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl focus:border-primary outline-none text-sm appearance-none cursor-pointer">
                  <option>TLS</option>
                  <option>SSL</option>
                  <option>None</option>
                </select>
              </div>
            </div>
            <button onClick={() => setToast({ message: "Email settings saved.", type: "success" })}
              className="px-5 py-2.5 bg-primary text-on-primary font-semibold rounded-xl hover:brightness-110 transition-all"
            >
              Save Email
            </button>
          </div>
        </section>

        <section className="bg-surface rounded-xl border border-outline-variant p-6 shadow-sm">
          <h3 className="text-lg font-bold text-on-surface mb-4">Maintenance</h3>
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-on-surface">Maintenance Mode</p>
                <p className="text-sm text-on-surface-variant">Temporarily disable user access</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-outline-variant rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <Icon name="info" className="text-amber-600 text-[20px] shrink-0" filled />
              <div>
                <p className="text-sm font-semibold text-amber-800">Cache cleared automatically</p>
                <p className="text-xs text-amber-700 mt-0.5">Static assets and route cache are purged every 24 hours.</p>
              </div>
            </div>
            <button onClick={() => setToast({ message: "Cache cleared successfully.", type: "success" })}
              className="px-5 py-2.5 border border-outline text-primary font-semibold rounded-xl hover:bg-surface-container-high transition-all"
            >
              Clear Cache
            </button>
          </div>
        </section>
      </div>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}
