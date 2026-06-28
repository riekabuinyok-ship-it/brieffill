import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import Icon from "../components/Icon";
import Button from "../components/Button";
import Toast from "../components/Toast";

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

export default function Billing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();
  const [billing, setBilling] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [toast, setToast] = useState(null);
  const [showCancel, setShowCancel] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      api.post("/billing/checkout/verify", { sessionId })
        .then(() => {
          setToast({ message: "Subscription activated", type: "success" });
          navigate("/dashboard/billing", { replace: true });
          refresh();
          refreshUser?.();
        })
        .catch((err) => setToast({ message: err.response?.data?.error || "Verification failed", type: "error" }));
    } else if (searchParams.get("canceled")) {
      setToast({ message: "Checkout canceled", type: "info" });
      navigate("/dashboard/billing", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await api.get("/billing/me");
      setBilling(res.data.billing);
      setInvoices(res.data.invoices || []);
    } catch (err) {
      setToast({ message: err.response?.data?.error || "Failed to load billing", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const manageSubscription = async () => {
    setBusy("portal");
    try {
      const res = await api.post("/billing/portal", {});
      if (res.data.portalUrl) {
        window.open(res.data.portalUrl, "_blank", "noopener,noreferrer");
      } else {
        setToast({ message: "Portal unavailable", type: "info" });
      }
    } catch (err) {
      if (err.response?.status === 503) {
        setToast({ message: "Stripe is not configured. Use a dev bypass from the Pricing page to change plans.", type: "info" });
      } else {
        setToast({ message: err.response?.data?.error || "Failed to open portal", type: "error" });
      }
    } finally {
      setBusy(null);
    }
  };

  const cancelSubscription = async () => {
    setBusy("cancel");
    try {
      await api.post("/billing/cancel", {});
      setToast({ message: "Subscription canceled. You keep access until the end of the current period.", type: "success" });
      setShowCancel(false);
      refresh();
    } catch (err) {
      setToast({ message: err.response?.data?.error || "Failed to cancel", type: "error" });
    } finally {
      setBusy(null);
    }
  };

  if (loading || !billing) {
    return (
      <div className="mx-auto max-w-3xl px-margin-mobile md:px-margin-desktop pt-20 md:pt-24">
        <div className="text-on-surface-variant">Loading billing…</div>
      </div>
    );
  }

  const isPaid = billing.plan !== "free";
  const usagePct = billing.briefLimit === -1 ? 0 : Math.min(100, Math.round((billing.briefsUsed / billing.briefLimit) * 100));
  const isLimitWarning = billing.briefLimit !== -1 && billing.briefsUsed >= billing.briefLimit;

  return (
    <div className="mx-auto max-w-4xl px-margin-mobile md:px-margin-desktop pt-20 md:pt-24">
      <div className="mb-stack-lg flex flex-wrap items-end justify-between gap-stack-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-background">Billing & Subscription</h1>
          <p className="text-on-surface-variant">Manage your plan, payment method, and invoices.</p>
        </div>
        <Link to="/pricing" className="text-sm font-medium text-primary hover:underline">
          View all plans &rarr;
        </Link>
      </div>

      <section className="mb-stack-lg rounded-2xl border border-outline-variant bg-surface-container-lowest p-stack-md">
        <div className="flex flex-wrap items-center justify-between gap-stack-md">
          <div>
            <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Current plan</p>
            <p className="mt-1 font-headline-md text-headline-md text-on-background">{billing.planName}</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              {isPaid ? (
                <>
                  {formatAmount(
                    billing.features.briefLimit === -1 ? 0 : 0,
                    "usd"
                  )}
                  {" "}— billed {billing.status === "cancelled" ? "cancelled" : "monthly"}{billing.currentPeriodEnd ? `, renews ${formatDate(billing.currentPeriodEnd)}` : ""}
                </>
              ) : (
                <>Free — upgrade anytime to unlock unlimited briefs and Brief Builder.</>
              )}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase ${statusBadgeClass(billing.status)}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" /> {billing.status}
          </span>
        </div>
        {billing.cancelAtPeriodEnd && (
          <div className="mt-stack-sm rounded-lg border border-yellow-300 bg-yellow-50 p-stack-sm text-sm text-yellow-800">
            <strong>Cancellation scheduled.</strong> You'll drop to the Free plan on {formatDate(billing.currentPeriodEnd)}.
          </div>
        )}
      </section>

      {billing.briefLimit !== -1 && (
        <section className="mb-stack-lg rounded-2xl border border-outline-variant bg-surface-container-lowest p-stack-md">
          <h2 className="mb-stack-sm font-headline-md text-headline-md text-on-background">Usage this month</h2>
          <p className="mb-stack-sm text-sm text-on-surface-variant">
            Briefs created in {new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" })}.
            The counter resets on the 1st of each month.
          </p>
          <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container">
            <div
              className={`h-full transition-all ${isLimitWarning ? "bg-error" : "bg-primary"}`}
              style={{ width: usagePct + "%" }}
            />
          </div>
          <div className="mt-stack-sm flex items-center justify-between text-sm">
            <span className="text-on-surface">
              <strong>{billing.briefsUsed}</strong> of <strong>{billing.briefLimit}</strong> briefs used
            </span>
            <Link to="/pricing" className="font-medium text-primary hover:underline">Upgrade to Pro</Link>
          </div>
        </section>
      )}

      {billing.briefLimit === -1 && (
        <section className="mb-stack-lg rounded-2xl border border-primary/30 bg-primary-container/5 p-stack-md">
          <div className="flex items-center gap-stack-sm">
            <Icon name="check_circle" className="text-[24px] text-primary" />
            <div>
              <p className="font-semibold text-on-background">Unlimited briefs</p>
              <p className="text-sm text-on-surface-variant">You're on the {billing.planName} plan — no monthly cap.</p>
            </div>
          </div>
        </section>
      )}

      <section className="mb-stack-lg rounded-2xl border border-primary/30 bg-gradient-to-br from-primary-container/20 to-secondary-container/10 p-stack-md">
        <div className="flex flex-wrap items-center justify-between gap-stack-md">
          <div className="flex items-center gap-stack-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary">
              <Icon name="redeem" className="text-[22px]" />
            </div>
            <div>
              <p className="font-semibold text-on-background">Earn $10 in credit for every friend you refer</p>
              <p className="text-sm text-on-surface-variant">They get 1 month free Pro. Credit is auto-applied to your next invoice.</p>
            </div>
          </div>
          <Link
            to="/dashboard/referrals"
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary/90"
          >
            Refer &amp; Earn
            <Icon name="arrow_forward" className="text-[18px]" />
          </Link>
        </div>
      </section>

      <section className="mb-stack-lg rounded-2xl border border-outline-variant bg-surface-container-lowest p-stack-md">
        <h2 className="mb-stack-sm font-headline-md text-headline-md text-on-background">Manage subscription</h2>
        <div className="flex flex-wrap gap-stack-sm">
          {!isPaid && (
            <Link to="/pricing" className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary/90">
              <Icon name="upgrade" className="text-[18px]" /> Upgrade plan
            </Link>
          )}
          {isPaid && (
            <Button onClick={manageSubscription} loading={busy === "portal"} icon="settings" variant="outline">
              Manage in Stripe portal
            </Button>
          )}
          {isPaid && billing.status !== "cancelled" && (
            <Button onClick={() => setShowCancel(true)} variant="ghost" icon="cancel">Cancel subscription</Button>
          )}
        </div>
        <p className="mt-stack-sm text-xs text-on-surface-variant">
          The Stripe portal lets you update your payment method, switch plans, view past invoices, and cancel. You'll be redirected to Stripe and back here.
        </p>
      </section>

      {isPaid && (
        <section className="mb-stack-lg rounded-2xl border border-outline-variant bg-surface-container-lowest p-stack-md">
          <h2 className="mb-stack-sm font-headline-md text-headline-md text-on-background">Invoices</h2>
          {invoices.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No invoices yet. Once Stripe processes your first payment, invoices will appear here.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-outline-variant">
                    <th className="py-2 font-semibold text-on-surface">Date</th>
                    <th className="py-2 font-semibold text-on-surface">Amount</th>
                    <th className="py-2 font-semibold text-on-surface">Status</th>
                    <th className="py-2 text-right font-semibold text-on-surface">PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-outline-variant last:border-0">
                      <td className="py-2 text-on-surface">{formatDate(inv.createdAt)}</td>
                      <td className="py-2 text-on-surface">{formatAmount(inv.amount, inv.currency)}</td>
                      <td className="py-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${
                          inv.status === "paid" ? "bg-primary/10 text-primary" : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {inv.status}
                        </span>
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
        </section>
      )}

      {showCancel && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-stack-md"
          onClick={() => setShowCancel(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface p-stack-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-headline-md text-headline-md text-on-background">Cancel subscription?</h3>
            <p className="mt-stack-sm text-sm text-on-surface-variant">
              You'll keep access to the {billing.planName} plan until the end of your current billing period
              {billing.currentPeriodEnd ? ` (${formatDate(billing.currentPeriodEnd)})` : ""}.
              After that, you'll drop to the Free plan (5 briefs / month).
            </p>
            <div className="mt-stack-md flex justify-end gap-stack-sm">
              <Button variant="ghost" onClick={() => setShowCancel(false)}>Keep subscription</Button>
              <Button variant="error" onClick={cancelSubscription} loading={busy === "cancel"}>Cancel subscription</Button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}
