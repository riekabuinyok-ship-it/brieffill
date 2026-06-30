import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import Icon from "../components/Icon";
import Button from "../components/Button";
import Toast from "../components/Toast";

const FAQ = [
  { q: "What happens if I exceed my brief limit?", a: "You'll be charged per-brief overage at the rate listed below the plan. You can also upgrade to the next plan from the Billing page." },
  { q: "Can I downgrade or upgrade later?", a: "Yes, you can change your plan at any time from the Billing page." },
  { q: "Do you offer an annual discount?", a: "Yes, annual plans are 20% off. Pro: $182/year ($15.20/month), Team: $566/year ($47.20/month), Agency: $1,430/year ($119.20/month)." },
  { q: "What's included in the Free plan?", a: "5 briefs/month with AI gap detection, completeness scores, specific clarifying questions, and watermarked PDF exports." },
  { q: "Can I cancel anytime?", a: "Yes, you can cancel your subscription at any time with a 14-day money-back guarantee." },
  { q: "What payment methods do you accept?", a: "All major credit cards via Stripe. ACH/wire for Agency plan (contact support)." },
];

const CARD_FEATURES = {
  free: ["5 briefs / month", "AI gap detection", "Completeness score", "Specific clarifying questions", "PDF export (watermarked)"],
  pro: ["150 briefs / month", "$0.50/brief overage", "Brief Builder", "Industry-specific questions", "AI template generation", "42+ templates", "Create custom templates", "PDF + clipboard export"],
  team: ["500 briefs / month", "$0.40/brief overage", "5 team members", "Team collaboration", "Client portal", "Google Docs + Notion export", "Slack integration", "Priority support"],
  agency: ["2,000 briefs / month", "$0.30/brief overage", "15 team members", "Competitor analysis", "API access", "White-label export", "Custom branding", "Zapier integration", "Priority support"],
};

const COMPARISON_SECTIONS = [
  {
    heading: "Brief Analysis",
    rows: [
      { row: "Briefs / month", free: "5", pro: "150 pooled", team: "500 pooled", agency: "2,000 pooled" },
      { row: "Overage", free: "—", pro: "$0.50/brief", team: "$0.40/brief", agency: "$0.30/brief" },
      { row: "AI gap detection", free: true, pro: true, team: true, agency: true },
      { row: "Completeness score", free: true, pro: true, team: true, agency: true },
      { row: "Specific clarifying questions", free: true, pro: true, team: true, agency: true },
      { row: "Industry-specific questions", free: false, pro: true, team: true, agency: true },
      { row: "File upload", free: true, pro: true, team: true, agency: true },
    ],
  },
  {
    heading: "Templates",
    rows: [
      { row: "Template library", free: "10", pro: "42+", team: "42+", agency: "42+" },
      { row: "Create custom templates", free: false, pro: true, team: true, agency: true },
      { row: "Save brief as template", free: false, pro: true, team: true, agency: true },
      { row: "Team template sharing", free: false, pro: false, team: true, agency: true },
      { row: "AI template generation", free: false, pro: true, team: true, agency: true },
    ],
  },
  {
    heading: "Brief Builder",
    rows: [
      { row: "Fix low-scoring briefs", free: false, pro: true, team: true, agency: true },
      { row: "Side-by-side comparison", free: false, pro: true, team: true, agency: true },
      { row: "AI-generated improvements", free: false, pro: true, team: true, agency: true },
      { row: "Clarification email drafts", free: false, pro: true, team: true, agency: true },
    ],
  },
  {
    heading: "Exports & Integrations",
    rows: [
      { row: "Export to PDF", free: true, pro: true, team: true, agency: true },
      { row: "Copy to clipboard", free: true, pro: true, team: true, agency: true },
      { row: "Export to Google Docs", free: false, pro: false, team: true, agency: true },
      { row: "Export to Notion", free: false, pro: false, team: true, agency: true },
      { row: "Slack integration", free: false, pro: false, team: true, agency: true },
      { row: "Zapier integration", free: false, pro: false, team: false, agency: true },
    ],
  },
  {
    heading: "Team & Collaboration",
    rows: [
      { row: "Team members", free: "1", pro: "1", team: "5", agency: "15" },
      { row: "Team collaboration", free: false, pro: false, team: true, agency: true },
      { row: "Client portal", free: false, pro: false, team: true, agency: true },
      { row: "Collaboration Portal", free: false, pro: false, team: true, agency: true },
      { row: "Role-based access", free: false, pro: false, team: false, agency: true },
      { row: "Team analytics", free: false, pro: false, team: true, agency: true },
    ],
  },
  {
    heading: "Advanced Features",
    rows: [
      { row: "Competitor analysis", free: false, pro: false, team: false, agency: true },
      { row: "API access", free: false, pro: false, team: false, agency: true },
      { row: "Priority support", free: false, pro: false, team: true, agency: true },
      { row: "White-label export", free: false, pro: false, team: false, agency: true },
      { row: "Custom branding", free: false, pro: false, team: false, agency: true },
    ],
  },
];

function formatPrice(cents) {
  if (cents === 0) return "$0";
  return "$" + (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function planHighlight(planId) {
  return planId === "pro";
}

export default function Pricing() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [cycle, setCycle] = useState("monthly");
  const [busy, setBusy] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    api.get("/billing/plans").then((res) => setPlans(res.data.plans || [])).catch(() => setToast({ message: "Failed to load plans", type: "error" }));
  }, []);

  const currentPlan = user?.billing?.plan || "free";

  const choosePlan = async (planId) => {
    if (planId === "free") {
      if (user) navigate("/dashboard");
      else navigate("/register");
      return;
    }
    if (!user) { navigate("/register"); return; }
    setBusy(planId);
    try {
      try {
        const res = await api.post("/billing/checkout", { plan: planId, billingCycle: cycle });
        if (res.data.checkoutUrl) { window.location.href = res.data.checkoutUrl; return; }
      } catch (err) {
        if (err.response?.status !== 503) throw err;
      }
      await api.post("/billing/bypass", { plan: planId, billingCycle: cycle });
      await refreshUser();
      setToast({ message: "You're now on " + planId + ".", type: "success" });
      setTimeout(() => navigate("/dashboard/billing"), 800);
    } catch (err) {
      setToast({ message: err.response?.data?.error || err.message || "Failed to upgrade", type: "error" });
    } finally {
      setBusy(null);
    }
  };

  const planOrder = ["free", "pro", "team", "agency"];

  return (
    <div className="min-h-screen bg-surface">
      <header className="px-margin-mobile md:px-margin-desktop pt-0 pb-stack-lg text-center">
        <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Pricing</p>
        <h1 className="mt-2 font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-background">Pricing that grows with you</h1>
        <p className="mx-auto mt-3 max-w-2xl text-on-surface-variant">BriefFill turns rough client briefs into structured, client-ready specs. Pick the plan that fits your team — switch or cancel anytime.</p>
        <div className="mt-stack-md inline-flex items-center rounded-full border border-outline-variant bg-surface-container-lowest p-1 text-sm">
          <button type="button" onClick={() => setCycle("monthly")}
            className={`rounded-full px-4 py-1 font-medium ${cycle === "monthly" ? "bg-primary text-on-primary" : "text-on-surface-variant"}`}>Monthly</button>
          <button type="button" onClick={() => setCycle("annual")}
            className={`rounded-full px-4 py-1 font-medium ${cycle === "annual" ? "bg-primary text-on-primary" : "text-on-surface-variant"}`}>Annual <span className="ml-1 text-xs opacity-80">(save 20%)</span></button>
        </div>
      </header>

      {/* Pricing Cards */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-stack-md px-margin-mobile pb-stack-lg md:grid-cols-4 md:px-margin-desktop">
        {plans.sort((a, b) => planOrder.indexOf(a.id) - planOrder.indexOf(b.id)).map((p) => {
          const price = cycle === "annual" ? p.annualPrice : p.monthlyPrice;
          const monthly = cycle === "annual" ? Math.round(p.annualPrice / 12) : p.monthlyPrice;
          const isCurrent = currentPlan === p.id;
          const highlighted = planHighlight(p.id);
          const features = CARD_FEATURES[p.id] || [];
          return (
            <div key={p.id}
              className={`relative flex flex-col rounded-2xl border p-stack-md ${
                highlighted ? "border-primary bg-primary-container/5 shadow-lg" : "border-outline-variant bg-surface-container-lowest"
              }`}>
              {highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-on-primary">Most popular</span>
              )}
              {isCurrent && (
                <span className="absolute -top-3 right-3 rounded-full bg-on-surface px-3 py-1 text-xs font-semibold uppercase tracking-wider text-surface">Current</span>
              )}
              <h3 className="font-headline-md text-headline-md text-on-background">{p.name}</h3>
              <p className="mt-1 text-sm text-on-surface-variant">{p.description}</p>
              <div className="mt-stack-sm flex items-baseline gap-1">
                <span className="font-display text-display text-on-background">{formatPrice(price)}</span>
                <span className="text-sm text-on-surface-variant">{price === 0 ? "" : cycle === "annual" ? "/year" : "/month"}</span>
              </div>
              {cycle === "annual" && price > 0 && (
                <p className="text-xs text-on-surface-variant">{formatPrice(monthly)}/mo billed annually</p>
              )}
              <Button onClick={() => choosePlan(p.id)} loading={busy === p.id}
                variant={highlighted ? "primary" : "outline"} className="mt-stack-sm w-full"
                disabled={isCurrent && p.id === currentPlan}>
                {isCurrent ? "Current plan" : p.id === "free" ? "Get started" : "Choose " + p.name}
              </Button>
              <ul className="mt-stack-sm space-y-stack-sm text-sm text-on-surface">
                {features.map((perk, i) => (
                  <li key={i} className="flex items-start gap-stack-sm">
                    <Icon name="check_circle" className="mt-0.5 flex-shrink-0 text-[18px] text-primary" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      {/* Feature Comparison */}
      <section className="mx-auto max-w-6xl px-margin-mobile pb-stack-lg md:px-margin-desktop">
        <h2 className="mb-stack-md text-center font-headline-md text-headline-md text-on-background">Feature comparison</h2>
        <div className="overflow-x-auto rounded-2xl border border-outline-variant bg-surface-container-lowest">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container">
                <th className="p-stack-sm font-semibold text-on-background">Feature</th>
                {["Free", "Pro", "Team", "Agency"].map((name) => (
                  <th key={name} className="p-stack-sm text-center font-semibold text-on-background">{name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_SECTIONS.flatMap((section) => [
                <tr key={section.heading} className="border-b border-outline-variant bg-primary/5">
                  <td colSpan={5} className="p-stack-sm font-bold text-on-surface uppercase tracking-wider text-xs">{section.heading}</td>
                </tr>,
                ...section.rows.map((row) => (
                  <tr key={row.row} className="border-b border-outline-variant last:border-0">
                    <td className="p-stack-sm font-medium text-on-surface">{row.row}</td>
                    {[row.free, row.pro, row.team, row.agency].map((v, i) => (
                      <td key={i} className="p-stack-sm text-center text-on-surface">
                        {typeof v === "boolean" ? (
                          v ? <Icon name="check" className="text-[20px] text-primary" /> : <Icon name="remove" className="text-[20px] text-outline-variant" />
                        ) : (
                          v
                        )}
                      </td>
                    ))}
                  </tr>
                )),
              ])}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-margin-mobile pb-stack-lg md:px-margin-desktop">
        <h2 className="mb-stack-md text-center font-headline-md text-headline-md text-on-background">Frequently asked questions</h2>
        <div className="space-y-stack-md">
          {FAQ.map((f, i) => (
            <details key={i} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md">
              <summary className="cursor-pointer font-semibold text-on-background">{f.q}</summary>
              <p className="mt-stack-sm text-sm text-on-surface-variant">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-margin-mobile pb-stack-lg text-center md:px-margin-desktop">
        <div className="rounded-2xl border border-outline-variant bg-gradient-to-br from-primary-container/10 to-secondary-container/10 p-stack-lg">
          <h2 className="font-headline-md text-headline-md text-on-background">Try BriefFill free</h2>
          <p className="mx-auto mt-2 max-w-xl text-on-surface-variant">5 briefs per month, no credit card required. Upgrade only when you need more.</p>
          <div className="mt-stack-md flex justify-center gap-stack-sm">
            <Button onClick={() => choosePlan("free")} variant="outline">{user ? "Go to dashboard" : "Get started"}</Button>
            <Link to="/guide" className="inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-primary hover:underline">
              Read the guide <Icon name="arrow_forward" className="text-[16px]" />
            </Link>
          </div>
        </div>
      </section>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}
