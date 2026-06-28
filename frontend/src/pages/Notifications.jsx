import { useEffect, useState } from "react";
import api from "../utils/api";
import Icon from "../components/Icon";
import Button from "../components/Button";
import Toast from "../components/Toast";

const defaultNotifs = {
  notifications_email_enabled: 1,
  notifications_brief_analysis: 1,
  notifications_team_invites: 1,
  notifications_portal_updates: 1,
  notifications_referral_rewards: 1,
  notifications_billing: 1,
  notifications_product_updates: 1,
  notifications_weekly_summary: 1,
};

const NOTIF_ITEMS = [
  { key: "notifications_email_enabled", label: "Email Notifications", desc: "Enable/disable all email notifications" },
  { key: "notifications_brief_analysis", label: "Brief Analysis Complete", desc: "Notify when AI analysis is complete" },
  { key: "notifications_team_invites", label: "Team Invitations", desc: "Notify when invited to a team" },
  { key: "notifications_portal_updates", label: "Collaboration Portal Updates", desc: "Notify when client completes portal exercises" },
  { key: "notifications_referral_rewards", label: "Referral Rewards", desc: "Notify when you earn referral credits" },
  { key: "notifications_billing", label: "Billing & Invoices", desc: "Notify about upcoming payments and invoices" },
  { key: "notifications_product_updates", label: "Product Updates", desc: "Notify about new features and updates" },
  { key: "notifications_weekly_summary", label: "Weekly Summary", desc: "Receive weekly summary of your activity" },
];

export default function Notifications() {
  const [prefs, setPrefs] = useState(defaultNotifs);
  const [toast, setToast] = useState(null);
  const [notifSaving, setNotifSaving] = useState(false);

  useEffect(() => {
    api.get("/preferences").then((res) => {
      if (res.data?.preferences) {
        setPrefs({
          notifications_email_enabled: res.data.preferences.notifications_email_enabled ?? 1,
          notifications_brief_analysis: res.data.preferences.notifications_brief_analysis ?? 1,
          notifications_team_invites: res.data.preferences.notifications_team_invites ?? 1,
          notifications_portal_updates: res.data.preferences.notifications_portal_updates ?? 1,
          notifications_referral_rewards: res.data.preferences.notifications_referral_rewards ?? 1,
          notifications_billing: res.data.preferences.notifications_billing ?? 1,
          notifications_product_updates: res.data.preferences.notifications_product_updates ?? 1,
          notifications_weekly_summary: res.data.preferences.notifications_weekly_summary ?? 1,
        });
      }
    }).catch(() => {});
  }, []);

  const saveNotifPrefs = async () => {
    setNotifSaving(true);
    try {
      await api.put("/preferences", {
        notifications_email_enabled: prefs.notifications_email_enabled,
        notifications_brief_analysis: prefs.notifications_brief_analysis,
        notifications_team_invites: prefs.notifications_team_invites,
        notifications_portal_updates: prefs.notifications_portal_updates,
        notifications_referral_rewards: prefs.notifications_referral_rewards,
        notifications_billing: prefs.notifications_billing,
        notifications_product_updates: prefs.notifications_product_updates,
        notifications_weekly_summary: prefs.notifications_weekly_summary,
      });
      setToast({ message: "Notification preferences saved", type: "success" });
    } catch {
      setToast({ message: "Failed to save notification preferences", type: "error" });
    } finally {
      setNotifSaving(false);
    }
  };

  const toggleNotif = (key) => {
    setPrefs({ ...prefs, [key]: prefs[key] ? 0 : 1 });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface mb-2">Notifications</h1>
        <p className="text-sm text-on-surface-variant">Control which notifications you receive.</p>
      </div>

      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 space-y-4">
        {NOTIF_ITEMS.map((item) => {
          const isMaster = item.key === "notifications_email_enabled";
          const disabled = !isMaster && !prefs.notifications_email_enabled;
          return (
            <div key={item.key} className={`flex items-center justify-between ${disabled ? "opacity-40" : ""}`}>
              <div>
                <p className={`text-sm font-semibold ${isMaster ? "text-on-surface" : "text-on-surface-variant"}`}>{item.label}</p>
                <p className="text-xs text-on-surface-variant">{item.desc}</p>
              </div>
              <button type="button" role="switch" aria-checked={!!prefs[item.key]} disabled={disabled}
                onClick={() => toggleNotif(item.key)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none ${prefs[item.key] ? "bg-primary" : "bg-outline"}`}>
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${prefs[item.key] ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
              </button>
            </div>
          );
        })}
        <div className="pt-2">
          <Button size="sm" onClick={saveNotifPrefs} loading={notifSaving} icon="notifications">Save Notification Preferences</Button>
        </div>
      </div>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}
