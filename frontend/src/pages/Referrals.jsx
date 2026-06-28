import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import Icon from "../components/Icon";
import Toast from "../components/Toast";

function statusBadge(status) {
  const map = {
    pending_signup: { label: "Pending Signup", className: "bg-outline-variant/30 text-on-surface-variant" },
    signed_up:      { label: "Active Trial",   className: "bg-yellow-100 text-yellow-800" },
    paid:           { label: "Paid",            className: "bg-primary/15 text-primary" },
    rewarded:       { label: "Rewarded",        className: "bg-green-100 text-green-800" },
    cancelled:      { label: "Cancelled",       className: "bg-error-container/30 text-error" },
    rejected:       { label: "Rejected",        className: "bg-error-container/30 text-error" },
  };
  const m = map[status] || map.pending_signup;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${m.className}`}>{m.label}</span>;
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatCents(cents) {
  if (cents == null) return "—";
  return "$" + (cents / 100).toFixed(2);
}

export default function Referrals() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await api.get("/referrals/stats");
      setStats(res.data);
    } catch (err) {
      setToast({ message: err.response?.data?.error || "Failed to load referrals", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!stats?.link) return;
    try {
      await navigator.clipboard.writeText(stats.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setToast({ message: "Copy failed — please copy manually", type: "error" });
    }
  };

  const shareEmail = () => {
    if (!stats?.link) return;
    const subject = encodeURIComponent("Try BriefFill for analyzing client briefs");
    const body = encodeURIComponent(`I've been using BriefFill to catch missing fields in client briefs before I quote. You get 1 month free Pro when you sign up with my link:\n\n${stats.link}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };
  const shareTwitter = () => {
    if (!stats?.link) return;
    const text = encodeURIComponent("I've been using BriefFill to catch missing fields in client briefs. Try it free with my link:");
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(stats.link)}`, "_blank", "noopener,noreferrer");
  };
  const shareLinkedIn = () => {
    if (!stats?.link) return;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(stats.link)}`, "_blank", "noopener,noreferrer");
  };

  if (loading || !stats) {
    return (
      <div className="mx-auto max-w-4xl px-margin-mobile md:px-margin-desktop pt-20 md:pt-24">
        <div className="text-on-surface-variant">Loading referrals…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-margin-mobile md:px-margin-desktop pt-20 md:pt-24">
      <div className="mb-stack-lg flex flex-wrap items-end justify-between gap-stack-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-background">Invite Friends</h1>
          <p className="text-on-surface-variant">
            Earn <strong>{formatCents(stats.referrerCreditCents)}</strong> in credit for every friend who becomes a paid subscriber. They get {stats.friendReward}.
          </p>
        </div>
        <Link to="/referral-terms" className="text-sm font-medium text-primary hover:underline">
          Referral terms &rarr;
        </Link>
      </div>

      <section className="mb-stack-lg rounded-2xl border border-primary/20 bg-gradient-to-br from-primary-container/20 to-secondary-container/10 p-stack-md">
        <h2 className="mb-stack-sm font-headline-md text-headline-md text-on-background">Your unique link</h2>
        <div className="flex flex-col gap-stack-sm sm:flex-row">
          <input
            readOnly
            value={stats.link}
            onClick={(e) => e.target.select()}
            className="flex-1 rounded-lg border border-outline-variant bg-surface px-4 py-3 font-mono text-sm text-on-surface focus:outline-none focus:border-primary"
          />
          <button
            onClick={copyLink}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-on-primary hover:bg-primary/90"
          >
            <Icon name={copied ? "check" : "content_copy"} className="text-[18px]" />
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
        <p className="mt-stack-sm text-xs text-on-surface-variant">
          Code: <span className="font-mono font-semibold">{stats.code}</span> · Share anywhere — DMs, email signatures, your website.
        </p>

        <div className="mt-stack-md flex flex-wrap gap-stack-sm">
          <button
            onClick={shareEmail}
            className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container"
          >
            <Icon name="mail" className="text-[18px]" /> Share via Email
          </button>
          <button
            onClick={shareTwitter}
            className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M18.244 2H21l-6.49 7.413L22 22h-6.79l-4.74-6.18L4.94 22H2.18l6.94-7.93L2 2h6.95l4.3 5.69L18.244 2zm-1.19 18.2h1.86L7.05 3.7H5.05l11.99 16.5z"/>
            </svg>
            Share on X
          </button>
          <button
            onClick={shareLinkedIn}
            className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/>
            </svg>
            Share on LinkedIn
          </button>
        </div>
      </section>

      <section className="mb-stack-lg grid grid-cols-2 gap-stack-md md:grid-cols-4">
        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-stack-md text-center">
          <p className="font-display text-headline-md text-primary">{stats.totals.invited}</p>
          <p className="text-sm text-on-surface-variant">Invited</p>
        </div>
        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-stack-md text-center">
          <p className="font-display text-headline-md text-primary">{stats.totals.signedUp}</p>
          <p className="text-sm text-on-surface-variant">Signed up</p>
        </div>
        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-stack-md text-center">
          <p className="font-display text-headline-md text-primary">{stats.totals.paid}</p>
          <p className="text-sm text-on-surface-variant">Paid subscribers</p>
        </div>
        <div className="rounded-2xl border border-primary/30 bg-primary-container/5 p-stack-md text-center">
          <p className="font-display text-headline-md text-primary">{formatCents(stats.creditsEarnedCents)}</p>
          <p className="text-sm text-on-surface-variant">Credit earned</p>
        </div>
      </section>

      <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-stack-md">
        <h2 className="mb-stack-sm font-headline-md text-headline-md text-on-background">Your referrals</h2>
        {stats.invitees.length === 0 ? (
          <div className="rounded-xl border border-dashed border-outline-variant p-stack-lg text-center">
            <Icon name="group_add" className="mx-auto text-[40px] text-on-surface-variant" />
            <p className="mt-stack-sm font-semibold text-on-background">No referrals yet</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              Share your link to start earning. You&apos;ll see each friend&apos;s status here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="py-2 font-semibold text-on-surface">Friend</th>
                  <th className="py-2 font-semibold text-on-surface">Status</th>
                  <th className="py-2 font-semibold text-on-surface">Joined</th>
                  <th className="py-2 text-right font-semibold text-on-surface">Reward</th>
                </tr>
              </thead>
              <tbody>
                {stats.invitees.map((inv) => (
                  <tr key={inv.id} className="border-b border-outline-variant last:border-0">
                    <td className="py-3">
                      <div className="font-medium text-on-surface">{inv.friendName || "(no name)"}</div>
                      <div className="text-xs text-on-surface-variant">{inv.friendEmail}</div>
                    </td>
                    <td className="py-3">{statusBadge(inv.status)}</td>
                    <td className="py-3 text-on-surface-variant">{formatDate(inv.friendSignedUpAt || inv.createdAt)}</td>
                    <td className="py-3 text-right">
                      {inv.status === "rewarded" ? (
                        <span className="font-semibold text-green-700">+{formatCents(inv.creditCents)}</span>
                      ) : inv.status === "signed_up" ? (
                        <span className="text-on-surface-variant">Pending qualification</span>
                      ) : inv.status === "rejected" ? (
                        <span className="text-error">—</span>
                      ) : (
                        <span className="text-on-surface-variant">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-stack-lg rounded-2xl border border-outline-variant bg-surface-container-low p-stack-md text-sm text-on-surface-variant">
        <p>
          <strong className="text-on-surface">How it works:</strong> Your friend signs up via your link, starts their trial, and activates a paid plan. When that happens, you earn{" "}
          <strong className="text-on-surface">{formatCents(stats.referrerCreditCents)}</strong> in account credit (applied to your next invoice), and your friend receives {stats.friendReward}. Credit can&apos;t be withdrawn as cash. See{" "}
          <Link to="/referral-terms" className="font-medium text-primary hover:underline">full terms</Link>.
        </p>
      </section>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}
