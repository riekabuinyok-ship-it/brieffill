import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import Icon from "../components/Icon";
import Button from "../components/Button";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { Skeleton } from "../components/Skeleton";
import Toast from "../components/Toast";

const SOCIAL_PLATFORMS = [
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/..." },
  { key: "twitter", label: "Twitter / X", placeholder: "https://twitter.com/..." },
  { key: "dribbble", label: "Dribbble", placeholder: "https://dribbble.com/..." },
  { key: "behance", label: "Behance", placeholder: "https://behance.net/..." },
];

function statusBadgeClass(status) {
  if (status === "active") return "bg-primary/10 text-primary";
  if (status === "past_due") return "bg-error-container/30 text-error";
  if (status === "cancelled") return "bg-outline-variant/30 text-on-surface-variant";
  return "bg-yellow-100 text-yellow-700";
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatAmount(cents, currency) {
  if (cents == null) return "—";
  const value = (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (currency || "usd").toUpperCase() + " " + value;
}

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { user, logout, refreshUser } = useAuth();
  const [toast, setToast] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
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
  const [prefs, setPrefs] = useState({ email_greeting: "Hi {clientName},", email_signoff: "Best regards,\n{name}", email_template: "", ...defaultNotifs });
  const [notifSaving, setNotifSaving] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/usage").then((res) => setUsage(res.data)).catch(() => {})
      .finally(() => setLoading(false));
    api.get("/preferences").then((res) => {
      if (res.data?.preferences) {
        setPrefs({
          email_greeting: res.data.preferences.email_greeting,
          email_signoff: res.data.preferences.email_signoff,
          email_template: res.data.preferences.email_template || "",
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

  const savePrefs = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/preferences", { ...prefs, theme });
      setToast({ message: "Preferences saved", type: "success" });
    } catch {
      setToast({ message: "Failed to save preferences", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const saveNotifPrefs = async () => {
    setNotifSaving(true);
    try {
      await api.put("/preferences", {
        theme,
        email_greeting: prefs.email_greeting,
        email_signoff: prefs.email_signoff,
        email_template: prefs.email_template || null,
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

  // Billing state
  const [billingData, setBillingData] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [billingLoading, setBillingLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  useEffect(() => {
    api.get("/billing/me").then((res) => {
      setBillingData(res.data.billing);
      setInvoices(res.data.invoices || []);
    }).catch(() => {}).finally(() => setBillingLoading(false));
  }, []);

  const openBillingPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await api.post("/billing/portal", {});
      if (res.data.portalUrl) {
        window.open(res.data.portalUrl, "_blank", "noopener,noreferrer");
      } else {
        setToast({ message: "Portal unavailable", type: "info" });
      }
    } catch (err) {
      setToast({ message: err.response?.data?.error || "Failed to open portal", type: "error" });
    } finally {
      setPortalLoading(false);
    }
  };

  const cancelSubscription = async () => {
    setCancelLoading(true);
    try {
      await api.post("/billing/cancel", {});
      setToast({ message: "Subscription canceled. You keep access until the end of the current period.", type: "success" });
      setShowCancel(false);
      const res = await api.get("/billing/me");
      setBillingData(res.data.billing);
    } catch (err) {
      setToast({ message: err.response?.data?.error || "Failed to cancel", type: "error" });
    } finally {
      setCancelLoading(false);
    }
  };

  // API Keys state
  const [apiKeys, setApiKeys] = useState([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(true);
  const [newKeyData, setNewKeyData] = useState(null);
  const [keyName, setKeyName] = useState("");
  const [creatingKey, setCreatingKey] = useState(false);
  const [keyError, setKeyError] = useState("");

  useEffect(() => {
    api.get("/docs/api-keys").then((res) => {
      setApiKeys(res.data.keys || []);
    }).catch(() => {}).finally(() => setApiKeysLoading(false));
  }, []);

  const createApiKey = async () => {
    const name = keyName.trim();
    if (!name) { setKeyError("Enter a name for this key"); return; }
    setCreatingKey(true);
    setKeyError("");
    try {
      const res = await api.post("/docs/api-keys", { name });
      setNewKeyData(res.data.key);
      setApiKeys((prev) => [{ id: res.data.key.id, name: res.data.key.name, createdAt: res.data.key.createdAt }, ...prev]);
      setKeyName("");
    } catch (err) {
      setKeyError(err.response?.data?.error || "Failed to create key");
    } finally {
      setCreatingKey(false);
    }
  };

  const revokeApiKey = async (id) => {
    try {
      await api.delete(`/docs/api-keys/${id}`);
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (err) {
      setToast({ message: err.response?.data?.error || "Failed to revoke key", type: "error" });
    }
  };

  const copyKey = (text) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setToast({ message: "API key copied to clipboard", type: "success" });
  };

  // Integrations status
  const [integrationsStatus, setIntegrationsStatus] = useState({});
  const [integrationsLoading, setIntegrationsLoading] = useState(true);

  useEffect(() => {
    api.get("/integrations/status").then((res) => {
      setIntegrationsStatus(res.data.integrations || {});
    }).catch(() => {}).finally(() => setIntegrationsLoading(false));
  }, []);

  const notionConfigured = integrationsStatus?.notion?.configured;
  const googleDocsConfigured = apiKeys.length > 0;

  // Team Settings state
  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [teamDetail, setTeamDetail] = useState(null);
  const [teamDetailLoading, setTeamDetailLoading] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: "", description: "" });
  const [savingTeam, setSavingTeam] = useState(false);
  const [teamLogoUploading, setTeamLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [invitingMember, setInvitingMember] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);
  const [teamActionLoading, setTeamActionLoading] = useState(false);

  useEffect(() => {
    api.get("/teams").then((res) => {
      setTeams(res.data.teams || []);
      const adminTeams = (res.data.teams || []).filter((t) => t.role === "admin");
      if (adminTeams.length > 0) setSelectedTeamId(adminTeams[0].id);
    }).catch(() => {}).finally(() => setTeamsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedTeamId) return;
    setTeamDetailLoading(true);
    setTeamDetail(null);
    setLogoPreview(null);
    api.get(`/teams/${selectedTeamId}`).then((res) => {
      setTeamDetail(res.data);
      setTeamForm({ name: res.data.team.name || "", description: res.data.team.description || "" });
    }).catch(() => {}).finally(() => setTeamDetailLoading(false));
  }, [selectedTeamId]);

  const saveTeamSettings = async () => {
    if (!teamForm.name.trim()) { setToast({ message: "Team name is required", type: "error" }); return; }
    setSavingTeam(true);
    try {
      await api.put(`/teams/${selectedTeamId}`, teamForm);
      setToast({ message: "Team settings saved", type: "success" });
      setTeams((prev) => prev.map((t) => t.id === selectedTeamId ? { ...t, name: teamForm.name } : t));
    } catch (err) {
      setToast({ message: err.response?.data?.error || "Failed to save", type: "error" });
    } finally {
      setSavingTeam(false);
    }
  };

  const uploadTeamLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTeamLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await api.post(`/teams/${selectedTeamId}/logo`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setLogoPreview(URL.createObjectURL(file));
      setTeamDetail((prev) => prev ? { ...prev, team: { ...prev.team, logoUrl: res.data.logoUrl } } : prev);
      setToast({ message: "Team logo updated", type: "success" });
    } catch (err) {
      setToast({ message: err.response?.data?.error || "Failed to upload logo", type: "error" });
    } finally {
      setTeamLogoUploading(false);
    }
  };

  const sendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInvitingMember(true);
    try {
      await api.post(`/teams/${selectedTeamId}/invite`, { email: inviteEmail, role: inviteRole });
      setToast({ message: `Invite sent to ${inviteEmail}`, type: "success" });
      setInviteEmail("");
      const res = await api.get(`/teams/${selectedTeamId}`);
      setTeamDetail(res.data);
    } catch (err) {
      setToast({ message: err.response?.data?.error || "Failed to send invite", type: "error" });
    } finally {
      setInvitingMember(false);
    }
  };

  const changeRole = async (userId, role) => {
    try {
      await api.put(`/teams/${selectedTeamId}/members/${userId}/role`, { role });
      setToast({ message: "Role updated", type: "success" });
      const res = await api.get(`/teams/${selectedTeamId}`);
      setTeamDetail(res.data);
    } catch (err) {
      setToast({ message: err.response?.data?.error || "Failed to update role", type: "error" });
    }
  };

  const removeMember = async (userId, name) => {
    try {
      await api.delete(`/teams/${selectedTeamId}/members/${userId}`);
      setToast({ message: `${name} removed from team`, type: "success" });
      const res = await api.get(`/teams/${selectedTeamId}`);
      setTeamDetail(res.data);
    } catch (err) {
      setToast({ message: err.response?.data?.error || "Failed to remove member", type: "error" });
    }
  };

  const transferOwnershipAction = async () => {
    setTeamActionLoading(true);
    try {
      await api.post(`/teams/${selectedTeamId}/transfer`, { userId: transferTargetUserId });
      setToast({ message: "Ownership transferred", type: "success" });
      setShowTransferConfirm(false);
      const res = await api.get(`/teams/${selectedTeamId}`);
      setTeamDetail(res.data);
    } catch (err) {
      setToast({ message: err.response?.data?.error || "Failed to transfer ownership", type: "error" });
    } finally {
      setTeamActionLoading(false);
    }
  };

  const deleteTeamAction = async () => {
    setTeamActionLoading(true);
    try {
      await api.delete(`/teams/${selectedTeamId}`);
      setToast({ message: "Team deleted", type: "success" });
      setShowDeleteConfirm(false);
      setSelectedTeamId(null);
      setTeamDetail(null);
      setTeams((prev) => prev.filter((t) => t.id !== selectedTeamId));
    } catch (err) {
      setToast({ message: err.response?.data?.error || "Failed to delete team", type: "error" });
    } finally {
      setTeamActionLoading(false);
    }
  };

  const adminTeams = teams.filter((t) => t.role === "admin");
  const isOwner = teamDetail?.team?.ownerId === user?.id;

  const requestPct = usage ? Math.min(Math.round((usage.totalBriefs / 100) * 100), 100) : 0;

  const avatarInputRef = useRef(null);
  const [profile, setProfile] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    displayName: user?.displayName || user?.name || "",
    bio: user?.bio || "",
    company: user?.company || "",
    jobTitle: user?.jobTitle || "",
    location: user?.location || "",
    website: user?.website || "",
    socialLinks: user?.socialLinks || {},
    avatarPreview: null,
  });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.(jpg|jpeg|png|gif)$/i.test(file.name)) {
      setToast({ message: "Only JPG, PNG, and GIF files are allowed", type: "error" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: "File must be under 5MB", type: "error" });
      return;
    }
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await api.post("/auth/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfile({ ...profile, avatarPreview: URL.createObjectURL(file) });
      setToast({ message: "Profile picture updated", type: "success" });
      await refreshUser();
    } catch (err) {
      setToast({ message: err.response?.data?.error || "Failed to upload", type: "error" });
    } finally {
      setAvatarUploading(false);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSaved(false);
    try {
      await api.patch("/auth/me", {
        first_name: profile.firstName,
        last_name: profile.lastName,
        display_name: profile.displayName,
        bio: profile.bio,
        company: profile.company,
        job_title: profile.jobTitle,
        location: profile.location,
        website: profile.website,
        social_links: profile.socialLinks,
      });
      setToast({ message: "Profile saved", type: "success" });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
      await refreshUser();
    } catch (err) {
      setToast({ message: err.response?.data?.error || "Failed to save", type: "error" });
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-margin-mobile md:px-margin-desktop pt-20 md:pt-24">
      <div className="mb-stack-lg">
        <h1 className="font-headline-lg text-headline-lg mb-2">Settings</h1>
        <p className="font-body-md text-on-surface-variant">Manage your personal profile and application preferences.</p>
      </div>



      {/* Billing & Subscription */}
      <section className="mb-stack-lg space-y-stack-md">
        <h3 className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Billing &amp; Subscription</h3>

        {billingLoading ? (
          <div className="rounded-xl border border-outline-variant p-stack-md space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
        ) : (
          <>
            {/* Current Plan */}
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md space-y-stack-md">
              <div className="flex flex-wrap items-center justify-between gap-stack-md">
                <div>
                  <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Current Plan</p>
                  <p className="font-headline-md text-headline-md text-on-surface mt-1">{billingData?.planName || "Free"}</p>
                  {billingData?.plan === "free" ? (
                    <p className="text-sm text-on-surface-variant mt-1">Free — upgrade anytime to unlock unlimited briefs and Brief Builder.</p>
                  ) : (
                    <p className="text-sm text-on-surface-variant mt-1">
                      {formatAmount(billingData?.plan === "pro" ? 1900 : billingData?.plan === "team" ? 4900 : 9900, "usd")}/mo — {billingData?.cancelAtPeriodEnd ? "cancelled" : "active"}
                      {billingData?.currentPeriodEnd ? `, renews ${formatDate(billingData.currentPeriodEnd)}` : ""}
                    </p>
                  )}
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase ${statusBadgeClass(billingData?.status || "active")}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" /> {billingData?.status || "active"}
                </span>
              </div>
              {billingData?.cancelAtPeriodEnd && (
                <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-stack-sm text-sm text-yellow-800">
                  <strong>Cancellation scheduled.</strong> You'll drop to the Free plan on {formatDate(billingData.currentPeriodEnd)}.
                </div>
              )}
            </div>

            {/* Plan Features */}
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md">
              <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-3">Plan Features</p>
              <ul className="space-y-2">
                {(billingData?.perks || []).map((perk, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-on-surface">
                    <Icon name="check_circle" className="text-[16px] text-primary shrink-0" /> {perk}
                  </li>
                ))}
              </ul>
            </div>

            {/* Manage Subscription */}
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md space-y-3">
              <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Manage Subscription</p>
              <div className="flex flex-wrap gap-stack-sm">
                {billingData?.plan === "free" ? (
                  <Link to="/pricing" className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary/90">
                    <Icon name="upgrade" className="text-[18px]" /> Upgrade plan
                  </Link>
                ) : (
                  <Button onClick={openBillingPortal} loading={portalLoading} icon="settings" variant="outline" size="sm">
                    Manage in Stripe portal
                  </Button>
                )}
                {billingData?.plan !== "free" && billingData?.status !== "cancelled" && (
                  <Button onClick={() => setShowCancel(true)} variant="ghost" size="sm" icon="cancel">Cancel subscription</Button>
                )}
              </div>
              <p className="text-xs text-on-surface-variant">The Stripe portal lets you update your payment method, switch plans, view past invoices, and cancel.</p>
            </div>

            {/* Invoices */}
            {billingData?.plan !== "free" && (
              <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md space-y-3">
                <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Invoices</p>
                {invoices.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">No invoices yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-outline-variant">
                          <th className="py-2 pr-4 font-semibold text-on-surface">Date</th>
                          <th className="py-2 pr-4 font-semibold text-on-surface">Amount</th>
                          <th className="py-2 pr-4 font-semibold text-on-surface">Status</th>
                          <th className="py-2 text-right font-semibold text-on-surface">PDF</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((inv) => (
                          <tr key={inv.id} className="border-b border-outline-variant last:border-0">
                            <td className="py-2 pr-4 text-on-surface">{formatDate(inv.createdAt)}</td>
                            <td className="py-2 pr-4 text-on-surface">{formatAmount(inv.amount, inv.currency)}</td>
                            <td className="py-2 pr-4">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${
                                inv.status === "paid" ? "bg-primary/10 text-primary" : "bg-yellow-100 text-yellow-700"
                              }`}>{inv.status}</span>
                            </td>
                            <td className="py-2 text-right">
                              {inv.invoicePdf ? (
                                <a href={inv.invoicePdf} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">Download</a>
                              ) : (
                                <span className="text-sm text-on-surface-variant">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </section>

      {/* Referral Program */}
      <section className="mb-stack-lg space-y-stack-md">
        <h3 className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Referral Program</h3>
        <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
          <div className="flex items-start justify-between p-stack-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Icon name="group_add" className="text-primary" />
              </div>
              <div>
                <p className="font-semibold text-on-surface">Invite friends, earn credit</p>
                <p className="text-sm text-on-surface-variant">Share your referral link and earn $10 credit for every friend who becomes a paid subscriber.</p>
              </div>
            </div>
            <Link to="/dashboard/referrals" className="shrink-0 rounded-lg border border-primary bg-primary px-4 py-2 text-center text-sm font-semibold text-on-primary hover:bg-primary/90 transition-colors">Open Referrals</Link>
          </div>
        </div>
      </section>





      {/* API Usage */}
      <section className="mb-stack-lg space-y-stack-md">
        <h3 className="font-label-sm text-label-sm uppercase tracking-wider text-outline">API Usage (This Month)</h3>
        {loading ? (
          <div className="rounded-xl border border-outline-variant p-stack-md animate-pulse space-y-stack-md">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-2 w-full" />
          </div>
        ) : (
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md space-y-stack-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-stack-sm">
                <Icon name="api" className="text-secondary" />
                <span className="font-body-md font-semibold text-on-surface">Brief Analyses</span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">{usage?.totalBriefs || 0} / ∞</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-variant">
              <div className="h-full rounded-full brand-gradient transition-all duration-1000 ease-out" style={{ width: `${Math.min(usage?.totalBriefs || 0, 100)}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-stack-md pt-base">
              <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-stack-sm">
                <p className="text-xs text-on-surface-variant">Avg. Response</p>
                <p className="font-label-sm text-label-sm text-on-background">~30s</p>
              </div>
              <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-stack-sm">
                <p className="text-xs text-on-surface-variant">Avg. Score</p>
                <p className="font-label-sm text-label-sm text-on-background">{usage?.averageScore || 0}%</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Appearance */}
      <section className="mb-stack-lg space-y-stack-md">
        <h3 className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Appearance</h3>
        <div className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md">
          <span className="text-sm text-on-surface">Theme:</span>
          <Button size="sm" variant={theme === "light" ? "primary" : "ghost"} onClick={() => setTheme("light")} icon="light_mode">Light</Button>
          <Button size="sm" variant={theme === "dark" ? "primary" : "ghost"} onClick={() => setTheme("dark")} icon="dark_mode">Dark</Button>
        </div>
      </section>

      {/* Team Settings */}
      <section className="mb-stack-lg space-y-stack-md">
        <h3 className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Team Settings</h3>
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md space-y-stack-md">
          {billingData?.plan !== "agency" ? (
            <div className="flex items-center gap-3 text-sm text-on-surface-variant">
              <Icon name="lock" className="text-[18px]" />
              <span>API key management is available on the <Link to="/pricing" className="text-primary hover:underline">Agency plan</Link>.</span>
            </div>
          ) : teamsLoading ? (
            <div className="flex items-center justify-center h-16">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : adminTeams.length === 0 ? (
            <div className="flex items-center gap-3 text-sm text-on-surface-variant">
              <Icon name="info" className="text-[18px]" />
              <span>You need to be a team admin to manage team settings. <Link to="/dashboard/teams" className="text-primary hover:underline">View your teams</Link></span>
            </div>
          ) : (
            <>
              {/* Team selector */}
              <div>
                <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-2">Select Team</p>
                <select value={selectedTeamId || ""} onChange={(e) => setSelectedTeamId(Number(e.target.value))}
                  className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-md text-sm focus:outline-none focus:border-primary">
                  {adminTeams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {teamDetailLoading ? (
                <div className="flex items-center justify-center h-24">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : teamDetail && (
                <>
                  {/* Team Name & Description */}
                  <div>
                    <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-2">Team Info</p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-on-surface-variant mb-1">Team Name</label>
                        <input type="text" value={teamForm.name}
                          onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                          className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-md text-sm focus:outline-none focus:border-primary" />
                      </div>
                      <div>
                        <label className="block text-xs text-on-surface-variant mb-1">Description</label>
                        <textarea rows={2} value={teamForm.description}
                          onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                          className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-md text-sm resize-none focus:outline-none focus:border-primary" />
                      </div>
                      <Button size="sm" onClick={saveTeamSettings} loading={savingTeam} icon="save">Save Team Info</Button>
                    </div>
                  </div>

                  {/* Team Logo */}
                  <div>
                    <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-2">Team Logo</p>
                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-outline-variant bg-surface-container overflow-hidden">
                        {logoPreview || teamDetail?.team?.logoUrl ? (
                          <img src={logoPreview || teamDetail.team.logoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Icon name="groups" className="text-2xl text-on-surface-variant" />
                        )}
                      </div>
                      <div>
                        <label className="cursor-pointer rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary hover:bg-primary/90">
                          {teamLogoUploading ? "Uploading..." : "Upload Logo"}
                          <input type="file" accept=".jpg,.jpeg,.png,.gif,.svg" className="hidden" onChange={uploadTeamLogo} />
                        </label>
                        <p className="text-xs text-on-surface-variant mt-1">JPG, PNG, GIF, SVG. Max 5MB.</p>
                      </div>
                    </div>
                  </div>

                  {/* Members */}
                  <div>
                    <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-2">Members ({teamDetail.members.length})</p>
                    <div className="space-y-2">
                      {teamDetail.members.map((m) => {
                        const isOwner = m.id === teamDetail.team.ownerId;
                        return (
                          <div key={m.id} className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                                {(m.name || m.email)[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-on-surface">{m.name || m.email} {isOwner && <span className="text-xs text-primary font-semibold">(Owner)</span>}</p>
                                <p className="text-xs text-on-surface-variant">{m.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isOwner ? (
                                <span className="text-xs font-semibold uppercase text-primary">Owner</span>
                              ) : (
                                <>
                                  <select value={m.role} onChange={(e) => changeRole(m.id, e.target.value)}
                                    className="rounded border border-outline-variant bg-surface px-2 py-1 text-xs focus:outline-none">
                                    <option value="admin">Admin</option>
                                    <option value="editor">Editor</option>
                                    <option value="viewer">Viewer</option>
                                  </select>
                                  <button onClick={() => removeMember(m.id, m.name || m.email)}
                                    className="text-xs text-error hover:text-error/80">Remove</button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Invite */}
                  <form onSubmit={sendInvite} className="space-y-3">
                    <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Invite Member</p>
                    <div className="flex items-end gap-stack-sm">
                      <div className="flex-1">
                        <label className="block text-xs text-on-surface-variant mb-1">Email address</label>
                        <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="colleague@example.com"
                          className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-md text-sm focus:outline-none focus:border-primary" />
                      </div>
                      <div className="w-28">
                        <label className="block text-xs text-on-surface-variant mb-1">Role</label>
                        <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
                          className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:border-primary">
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <Button type="submit" loading={invitingMember} icon="person_add" size="sm">Invite</Button>
                    </div>
                  </form>

                  {/* Owner-only actions */}
                  {isOwner && (
                    <div className="space-y-3 pt-stack-sm border-t border-outline-variant">
                      <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Danger Zone</p>

                      {/* Transfer Ownership */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-on-surface">Transfer Ownership</p>
                          <p className="text-xs text-on-surface-variant">Transfer team ownership to another admin.</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setShowTransferConfirm(true)} icon="swap_horiz">Transfer</Button>
                      </div>

                      {/* Delete Team */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-error">Delete Team</p>
                          <p className="text-xs text-on-surface-variant">Permanently delete this team and all data.</p>
                        </div>
                        <Button size="sm" variant="error" onClick={() => setShowDeleteConfirm(true)} icon="delete">Delete</Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </section>

      {/* Transfer Ownership Modal */}
      {showTransferConfirm && teamDetail && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-stack-md" onClick={() => setShowTransferConfirm(false)}>
          <div className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface p-stack-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-headline-md text-headline-md text-on-surface">Transfer Ownership</h3>
            <p className="text-sm text-on-surface-variant mt-2">Choose which admin will become the new owner of <strong>{teamDetail.team.name}</strong>.</p>
            <div className="space-y-2 mt-4 max-h-60 overflow-y-auto">
              {teamDetail.members.filter((m) => m.role === "admin" && m.id !== user?.id).map((m) => (
                <button key={m.id} onClick={() => { setTransferTargetUserId(m.id); transferOwnershipAction(); }}
                  className="w-full flex items-center gap-3 rounded-lg border border-outline-variant p-3 text-left hover:bg-surface-container transition-colors">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                    {(m.name || m.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-on-surface">{m.name || m.email}</p>
                    <p className="text-xs text-on-surface-variant">{m.email}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="ghost" onClick={() => setShowTransferConfirm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Team Modal */}
      {showDeleteConfirm && teamDetail && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-stack-md" onClick={() => setShowDeleteConfirm(false)}>
          <div className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface p-stack-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-headline-md text-headline-md text-on-surface">Delete Team?</h3>
            <p className="text-sm text-on-surface-variant mt-2">
              This will permanently delete <strong>{teamDetail.team.name}</strong> and all associated data, including member associations and shared briefs. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-stack-sm mt-6">
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>Keep team</Button>
              <Button variant="error" onClick={deleteTeamAction} loading={teamActionLoading} icon="delete">Delete permanently</Button>
            </div>
          </div>
        </div>
      )}



      {/* Email Template */}
      <section className="mb-stack-lg space-y-stack-md">
        <h3 className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Email Template</h3>
        <form onSubmit={savePrefs} className="space-y-stack-md rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md">
          <p className="text-xs text-on-surface-variant">Use <code className="rounded bg-surface-container px-1 font-mono">{"{clientName}"}</code> and <code className="rounded bg-surface-container px-1 font-mono">{"{name}"}</code> as placeholders.</p>
          <div>
            <label className="block font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider mb-1">Greeting</label>
            <input type="text" value={prefs.email_greeting} onChange={(e) => setPrefs({ ...prefs, email_greeting: e.target.value })}
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-md focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider mb-1">Sign-off</label>
            <textarea rows={3} value={prefs.email_signoff} onChange={(e) => setPrefs({ ...prefs, email_signoff: e.target.value })}
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-md focus:outline-none focus:border-primary" />
          </div>
          <Button type="submit" loading={saving} icon="save">Save Preferences</Button>
        </form>
      </section>



      {/* Sign Out */}
      <button onClick={logout}
        className="w-full flex items-center justify-between rounded-xl border border-error/20 bg-error-container/20 p-stack-md text-error transition-colors hover:bg-error-container/40">
        <div className="flex items-center gap-stack-md">
          <Icon name="logout" />
          <span className="font-semibold">Sign Out</span>
        </div>
        <Icon name="chevron_right" />
      </button>

      {showCancel && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-stack-md" onClick={() => setShowCancel(false)}>
          <div className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface p-stack-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-headline-md text-headline-md text-on-surface">Cancel subscription?</h3>
            <p className="mt-stack-sm text-sm text-on-surface-variant">
              You'll keep access to the {billingData?.planName} plan until the end of your current billing period
              {billingData?.currentPeriodEnd ? ` (${formatDate(billingData.currentPeriodEnd)})` : ""}.
              After that, you'll drop to the Free plan (5 briefs / month).
            </p>
            <div className="mt-stack-md flex justify-end gap-stack-sm">
              <Button variant="ghost" onClick={() => setShowCancel(false)}>Keep subscription</Button>
              <Button variant="error" onClick={cancelSubscription} loading={cancelLoading}>Cancel subscription</Button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}
