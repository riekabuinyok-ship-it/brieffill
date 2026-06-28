import { useState, useEffect, useRef } from "react";
import api from "../utils/api";
import Icon from "./Icon";
import Button from "./Button";
import Toast from "./Toast";

export default function AccountSecurity({ user, logout }) {
  const [toast, setToast] = useState(null);

  // Password
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);

  // 2FA
  const [totpEnabled, setTotpEnabled] = useState(!!user?.totpEnabled);
  const [totpSetup, setTotpSetup] = useState(null);
  const [totpCode, setTotpCode] = useState("");
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpDisablePw, setTotpDisablePw] = useState("");
  const [showTotpDisable, setShowTotpDisable] = useState(false);

  // Sessions
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  // Delete account
  const [deletePw, setDeletePw] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    api.get("/auth/sessions")
      .then((res) => setSessions(res.data.sessions || []))
      .catch(() => {})
      .finally(() => setSessionsLoading(false));
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwSuccess(false);
    if (pwForm.newPassword.length < 8) {
      setToast({ message: "New password must be at least 8 characters", type: "error" });
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setToast({ message: "Passwords do not match", type: "error" });
      return;
    }
    setPwLoading(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setToast({ message: "Password changed successfully", type: "success" });
      setPwSuccess(true);
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setToast({ message: err.response?.data?.error || "Failed to change password", type: "error" });
    } finally {
      setPwLoading(false);
    }
  };

  const handleSetup2fa = async () => {
    setTotpLoading(true);
    try {
      const res = await api.post("/auth/2fa/setup");
      setTotpSetup(res.data);
    } catch (err) {
      setToast({ message: err.response?.data?.error || "Failed to setup 2FA", type: "error" });
    } finally {
      setTotpLoading(false);
    }
  };

  const handleVerify2fa = async () => {
    if (!totpCode || totpCode.length < 6) {
      setToast({ message: "Enter a valid 6-digit code", type: "error" });
      return;
    }
    setTotpLoading(true);
    try {
      await api.post("/auth/2fa/verify", { token: totpCode });
      setTotpEnabled(true);
      setTotpSetup(null);
      setTotpCode("");
      setToast({ message: "Two-factor authentication enabled", type: "success" });
    } catch (err) {
      setToast({ message: err.response?.data?.error || "Invalid code", type: "error" });
    } finally {
      setTotpLoading(false);
    }
  };

  const handleDisable2fa = async () => {
    if (!totpDisablePw) {
      setToast({ message: "Enter your password to disable 2FA", type: "error" });
      return;
    }
    setTotpLoading(true);
    try {
      await api.post("/auth/2fa/disable", { password: totpDisablePw });
      setTotpEnabled(false);
      setShowTotpDisable(false);
      setTotpDisablePw("");
      setToast({ message: "Two-factor authentication disabled", type: "success" });
    } catch (err) {
      setToast({ message: err.response?.data?.error || "Failed to disable 2FA", type: "error" });
    } finally {
      setTotpLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setToast({ message: "Session revoked", type: "success" });
    } catch (err) {
      setToast({ message: "Failed to revoke session", type: "error" });
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePw) {
      setToast({ message: "Enter your password to delete your account", type: "error" });
      return;
    }
    setDeleteLoading(true);
    try {
      await api.delete("/auth/account", { data: { password: deletePw } });
      logout();
    } catch (err) {
      setToast({ message: err.response?.data?.error || "Failed to delete account", type: "error" });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-stack-lg">
      {/* Change Password */}
      <section className="space-y-stack-md">
        <h3 className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Change Password</h3>
        <form onSubmit={handleChangePassword} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md space-y-stack-md">
          <div>
            <label className="block font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider mb-1">Current Password</label>
            <input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-md focus:outline-none focus:border-primary" required />
          </div>
          <div>
            <label className="block font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider mb-1">New Password</label>
            <input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-md focus:outline-none focus:border-primary" minLength={8} required />
            <p className="mt-1 text-xs text-on-surface-variant">Min 8 characters</p>
          </div>
          <div>
            <label className="block font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider mb-1">Confirm New Password</label>
            <input type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-md focus:outline-none focus:border-primary" required />
            {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
              <p className="mt-1 text-xs text-error">Passwords do not match</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" loading={pwLoading}>Update Password</Button>
            {pwSuccess && <span className="text-sm text-[#16a34a] flex items-center gap-1"><Icon name="check" className="text-[16px]" /> Password updated</span>}
          </div>
        </form>
      </section>

      {/* Two-Factor Authentication */}
      <section className="space-y-stack-md">
        <h3 className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Two-Factor Authentication</h3>
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md space-y-stack-md">
          {totpEnabled ? (
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#16a34a]/10">
                    <Icon name="verified" className="text-[#16a34a]" />
                  </div>
                  <div>
                    <p className="font-semibold text-on-surface">Two-factor authentication is active</p>
                    <p className="text-sm text-on-surface-variant">Your account is protected with an authenticator app.</p>
                  </div>
                </div>
                <button onClick={() => setShowTotpDisable(!showTotpDisable)} className="text-sm text-error hover:underline">Disable</button>
              </div>
              {showTotpDisable && (
                <div className="mt-4 flex items-center gap-3">
                  <input type="password" value={totpDisablePw} onChange={(e) => setTotpDisablePw(e.target.value)}
                    placeholder="Enter your password" className="flex-1 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                  <button onClick={handleDisable2fa} disabled={totpLoading} className="px-4 py-2 bg-error text-white text-sm font-medium rounded-lg hover:bg-error/90 transition disabled:opacity-60">
                    {totpLoading ? "Disabling..." : "Confirm Disable"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              {!totpSetup ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container">
                      <Icon name="lock" className="text-on-surface-variant" />
                    </div>
                    <div>
                      <p className="font-semibold text-on-surface">Two-factor authentication</p>
                      <p className="text-sm text-on-surface-variant">Add an extra layer of security to your account.</p>
                    </div>
                  </div>
                  <button onClick={handleSetup2fa} disabled={totpLoading} className="px-4 py-2 bg-primary text-on-primary text-sm font-medium rounded-lg hover:bg-primary/90 transition disabled:opacity-60">
                    {totpLoading ? "Setting up..." : "Set up"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-on-surface">Scan this QR code with your authenticator app:</p>
                  <div className="flex justify-center">
                    <QrCodeSvg uri={totpSetup.otpauth} />
                  </div>
                  <p className="text-xs text-on-surface-variant text-center break-all">Or manually enter secret: <code className="bg-surface-container px-1 rounded font-mono">{totpSetup.secret}</code></p>
                  <div className="flex items-center gap-3 max-w-sm mx-auto">
                    <input type="text" value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="Enter 6-digit code" maxLength={6}
                      className="flex-1 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm font-mono text-center tracking-widest focus:outline-none focus:border-primary" />
                    <button onClick={handleVerify2fa} disabled={totpLoading || totpCode.length < 6} className="px-4 py-2 bg-primary text-on-primary text-sm font-medium rounded-lg hover:bg-primary/90 transition disabled:opacity-60">
                      {totpLoading ? "Verifying..." : "Verify & Enable"}
                    </button>
                  </div>
                  <button onClick={() => setTotpSetup(null)} className="text-sm text-on-surface-variant hover:underline">Cancel</button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Session Management */}
      <section className="space-y-stack-md">
        <h3 className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Active Sessions</h3>
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md">
          {sessionsLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2].map((i) => <div key={i} className="h-12 bg-surface-container rounded-lg" />)}
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No active sessions found.</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-container/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon name="devices" className="text-on-surface-variant shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-on-surface truncate">{s.userAgent || "Unknown device"}</p>
                      <p className="text-xs text-on-surface-variant">
                        {s.ipAddress && <span className="mr-2">{s.ipAddress} · </span>}
                        Last active {s.lastActiveAt ? new Date(s.lastActiveAt + "Z").toLocaleDateString() : "—"}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => handleRevokeSession(s.id)} className="shrink-0 text-sm text-error hover:underline ml-3">Revoke</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Delete Account */}
      <section className="space-y-stack-md">
        <h3 className="font-label-sm text-label-sm uppercase tracking-wider text-error">Danger Zone</h3>
        <div className="rounded-xl border border-error/20 bg-error-container/20 p-stack-md space-y-stack-md">
          {!deleteConfirm ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-error/10">
                  <Icon name="delete_forever" className="text-error" />
                </div>
                <div>
                  <p className="font-semibold text-on-surface">Delete Account</p>
                  <p className="text-sm text-on-surface-variant">Permanently delete your account and all associated data. This action cannot be undone.</p>
                </div>
              </div>
              <button onClick={() => setDeleteConfirm(true)} className="shrink-0 px-4 py-2 bg-error text-white text-sm font-medium rounded-lg hover:bg-error/90 transition">
                Delete Account
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-error/10 p-4 border border-error/30">
                <p className="text-sm font-semibold text-error mb-1">Are you absolutely sure?</p>
                <p className="text-sm text-on-surface-variant">This will permanently delete your account, briefs, teams, and all associated data. Enter your password to confirm.</p>
              </div>
              <div className="flex items-center gap-3">
                <input type="password" value={deletePw} onChange={(e) => setDeletePw(e.target.value)}
                  placeholder="Enter your password to confirm" autoFocus
                  className="flex-1 rounded-lg border border-error/50 bg-surface px-3 py-2 text-sm focus:outline-none focus:border-error" />
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleDeleteAccount} disabled={deleteLoading || !deletePw} className="px-4 py-2 bg-error text-white text-sm font-medium rounded-lg hover:bg-error/90 transition disabled:opacity-60">
                  {deleteLoading ? "Deleting..." : "Yes, permanently delete my account"}
                </button>
                <button onClick={() => { setDeleteConfirm(false); setDeletePw(""); }} className="px-4 py-2 text-sm text-on-surface-variant hover:underline">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}

function QrCodeSvg({ uri }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    let cancelled = false;
    import("qrcode").then((QRCode) => {
      if (cancelled) return;
      QRCode.toCanvas(canvasRef.current, uri, { width: 180, margin: 2 }, (err) => {
        if (err) console.error("QR error:", err);
      });
    });
    return () => { cancelled = true; };
  }, [uri]);
  return <canvas ref={canvasRef} className="rounded-lg" />;
}
