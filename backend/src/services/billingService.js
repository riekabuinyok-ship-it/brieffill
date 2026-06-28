// BriefFill — Billing service.
// Single source of truth for plans, pricing, and feature flags.
// Also handles brief-count metering, Stripe Checkout / portal / webhooks,
// and the dev-only `bypass` flow for environments without Stripe creds.

const { getDb, save } = require("../utils/db");
const { qualifyReferralOnPlanChange } = require("./referralService");

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const PORTAL_RETURN_URL = process.env.STRIPE_PORTAL_RETURN_URL || "http://localhost:5000/dashboard/billing";
const FRONTEND_BASE = process.env.FRONTEND_BASE_URL || "http://localhost:5173";

let stripe = null;
function getStripe() {
  if (!STRIPE_KEY) return null;
  if (!stripe) {
    // Lazy-load so dev mode without STRIPE_SECRET_KEY doesn't blow up
    const Stripe = require("stripe");
    stripe = new Stripe(STRIPE_KEY, { apiVersion: "2024-06-20" });
  }
  return stripe;
}

// ============================================================
// Plan catalog — single source of truth
// ============================================================
const PLANS = {
  free: {
    id: "free",
    name: "Free",
    description: "Get a feel for BriefFill with 5 briefs per month.",
    monthlyPrice: 0,
    annualPrice: 0,
    stripePriceId: { monthly: null, annual: null },
    features: {
      briefLimit: 5,
      seats: 1,
      briefBuilder: false,
      exports: [],
      teamFeatures: false,
      competitorAnalysis: false,
      apiAccess: false,
      whiteLabel: false,
      prioritySupport: false,
    },
    perks: [
      "5 briefs / month",
      "1 user",
      "12-field analysis",
      "Email draft generation",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "For freelancers and solo creatives who need unlimited briefs.",
    monthlyPrice: 1900,    // cents
    annualPrice: 18200,    // cents ($182/yr)
    stripePriceId: {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
      annual: process.env.STRIPE_PRICE_PRO_ANNUAL || "",
    },
    features: {
      briefLimit: -1,
      seats: 1,
      briefBuilder: true,
      exports: ["pdf", "clipboard"],
      teamFeatures: false,
      competitorAnalysis: false,
      apiAccess: false,
      whiteLabel: false,
      prioritySupport: false,
    },
    perks: [
      "Unlimited briefs",
      "Brief Builder (AI rewrite)",
      "PDF + clipboard export",
      "12-field analysis",
      "Outcome tracking",
    ],
  },
  team: {
    id: "team",
    name: "Team",
    description: "For small agencies. 5 seats, team collaboration, full exports.",
    monthlyPrice: 4900,
    annualPrice: 47000,
    stripePriceId: {
      monthly: process.env.STRIPE_PRICE_TEAM_MONTHLY || "",
      annual: process.env.STRIPE_PRICE_TEAM_ANNUAL || "",
    },
    features: {
      briefLimit: -1,
      seats: 5,
      briefBuilder: true,
      exports: ["pdf", "clipboard", "google-docs", "notion"],
      teamFeatures: true,
      competitorAnalysis: false,
      apiAccess: false,
      whiteLabel: false,
      prioritySupport: false,
    },
    perks: [
      "Unlimited briefs",
      "5 team members",
      "Team collaboration + client portal",
      "All Pro features",
      "Notion + Google Docs export",
    ],
  },
  agency: {
    id: "agency",
    name: "Agency",
    description: "For agencies at scale. 15 seats, competitor analysis, API access, white-label.",
    monthlyPrice: 9900,
    annualPrice: 95000,
    stripePriceId: {
      monthly: process.env.STRIPE_PRICE_AGENCY_MONTHLY || "",
      annual: process.env.STRIPE_PRICE_AGENCY_ANNUAL || "",
    },
    features: {
      briefLimit: -1,
      seats: 15,
      briefBuilder: true,
      exports: ["pdf", "clipboard", "google-docs", "notion", "clickup", "airtable"],
      teamFeatures: true,
      competitorAnalysis: true,
      apiAccess: true,
      whiteLabel: true,
      prioritySupport: true,
    },
    perks: [
      "Unlimited briefs",
      "15 team members",
      "Competitor analysis",
      "API access (REST + webhooks)",
      "White-label exports",
      "Priority support",
    ],
  },
};

function listPlans() {
  return Object.values(PLANS).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    monthlyPrice: p.monthlyPrice,
    annualPrice: p.annualPrice,
    features: p.features,
    perks: p.perks,
  }));
}

function getPlan(planId) {
  return PLANS[planId] || PLANS.free;
}

function planRequires(planId, capability) {
  const p = getPlan(planId);
  const v = p.features[capability];
  if (Array.isArray(v)) return v.length > 0;
  return Boolean(v);
}

// ============================================================
// User billing state
// ============================================================
function currentMonthKey() {
  const d = new Date();
  return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0");
}

function getUserBilling(userId) {
  const db = getDb();
  const row = db.exec(
    `SELECT plan, subscription_status, stripe_customer_id, stripe_subscription_id,
            brief_count_this_month, brief_count_month, current_period_end, cancel_at_period_end,
            trial_end_date
     FROM users WHERE id = ?`,
    [userId]
  )[0]?.values?.[0];
  if (!row) return null;

  const plan = row[0] || "free";
  const status = row[1] || "active";
  const stripeCustomerId = row[2];
  const stripeSubscriptionId = row[3];
  let briefsUsed = row[4] || 0;
  const briefMonth = row[5];
  const currentPeriodEnd = row[6];
  const cancelAtPeriodEnd = row[7] === 1;
  const trialEndDate = row[8];

  // Reset counter if month changed
  const thisMonth = currentMonthKey();
  if (briefMonth !== thisMonth) {
    briefsUsed = 0;
    db.run("UPDATE users SET brief_count_this_month = 0, brief_count_month = ? WHERE id = ?", [thisMonth, userId]);
    save();
  }

  const planDef = getPlan(plan);
  return {
    plan,
    planName: planDef.name,
    status,
    stripeCustomerId,
    stripeSubscriptionId,
    hasStripeCustomer: Boolean(stripeCustomerId),
    currentPeriodEnd,
    cancelAtPeriodEnd,
    trialEndDate,
    briefsUsed,
    briefLimit: planDef.features.briefLimit,
    monthlyResetAt: thisMonth + "-01",
    perks: planDef.perks,
    features: planDef.features,
  };
}

// ============================================================
// Brief-count enforcement
// ============================================================
function enforceBriefLimit(userId) {
  const billing = getUserBilling(userId);
  // Unlimited plans: -1
  if (billing.briefLimit === -1) {
    return { allowed: true, used: billing.briefsUsed, limit: -1, plan: billing.plan };
  }
  if (billing.briefsUsed >= billing.briefLimit) {
    const err = new Error("Free plan limit reached. Upgrade to Pro for unlimited briefs.");
    err.status = 402;
    err.code = "plan_limit_reached";
    err.payload = {
      error: err.message,
      code: err.code,
      limit: billing.briefLimit,
      used: billing.briefsUsed,
      plan: billing.plan,
    };
    throw err;
  }
  return { allowed: true, used: billing.briefsUsed, limit: billing.briefLimit, plan: billing.plan };
}

function recordBriefCreated(userId) {
  const billing = getUserBilling(userId);
  if (billing.briefLimit === -1) return billing; // No-op for unlimited plans
  const db = getDb();
  const thisMonth = currentMonthKey();
  const newCount = billing.briefsUsed + 1;
  db.run(
    "UPDATE users SET brief_count_this_month = ?, brief_count_month = ? WHERE id = ?",
    [newCount, thisMonth, userId]
  );
  save();
  return { ...billing, briefsUsed: newCount };
}

// ============================================================
// Plan changes (used by both Stripe webhook and dev bypass)
// ============================================================
function applyPlanChange(userId, { plan, status, stripeCustomerId, stripeSubscriptionId, currentPeriodEnd, cancelAtPeriodEnd }) {
  const db = getDb();
  const next = {
    plan: plan || "free",
    subscription_status: status || "active",
    stripe_customer_id: stripeCustomerId || null,
    stripe_subscription_id: stripeSubscriptionId || null,
    current_period_end: currentPeriodEnd || null,
    cancel_at_period_end: cancelAtPeriodEnd ? 1 : 0,
    brief_count_this_month: 0,
    brief_count_month: currentMonthKey(),
  };
  const sets = Object.keys(next).map((k) => `${k} = ?`).join(", ");
  const vals = Object.values(next);
  db.run(`UPDATE users SET ${sets} WHERE id = ?`, [...vals, userId]);
  save();

  // Referral qualification: if the user is becoming paid, this is the
  // qualifying event. Idempotent — safe to call on every plan change.
  if (plan && plan !== "free") {
    try {
      qualifyReferralOnPlanChange({ referredUserId: userId, newPlan: plan });
    } catch (err) {
      console.error("qualifyReferralOnPlanChange error:", err.message);
    }
  }

  return getUserBilling(userId);
}

// ============================================================
// Invoices
// ============================================================
function recordInvoice(userId, { stripeInvoiceId, amount, currency, status, invoicePdf, periodStart, periodEnd }) {
  if (!stripeInvoiceId) return null;
  const db = getDb();
  // Upsert by stripe_invoice_id
  const existing = db.exec("SELECT id FROM invoices WHERE stripe_invoice_id = ?", [stripeInvoiceId])[0]?.values?.[0];
  if (existing) {
    db.run(
      `UPDATE invoices SET amount = ?, currency = ?, status = ?, invoice_pdf = ?, period_start = ?, period_end = ? WHERE id = ?`,
      [amount, currency || "usd", status, invoicePdf, periodStart, periodEnd, existing[0]]
    );
  } else {
    db.run(
      `INSERT INTO invoices (user_id, stripe_invoice_id, amount, currency, status, invoice_pdf, period_start, period_end)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, stripeInvoiceId, amount, currency || "usd", status, invoicePdf, periodStart, periodEnd]
    );
  }
  save();
  return getInvoiceByStripeId(stripeInvoiceId);
}

function getInvoiceByStripeId(stripeInvoiceId) {
  const db = getDb();
  const row = db.exec(
    `SELECT id, user_id, stripe_invoice_id, amount, currency, status, invoice_pdf, period_start, period_end, created_at
     FROM invoices WHERE stripe_invoice_id = ?`,
    [stripeInvoiceId]
  )[0]?.values?.[0];
  if (!row) return null;
  return {
    id: row[0],
    userId: row[1],
    stripeInvoiceId: row[2],
    amount: row[3],
    currency: row[4],
    status: row[5],
    invoicePdf: row[6],
    periodStart: row[7],
    periodEnd: row[8],
    createdAt: row[9],
  };
}

function listInvoices(userId, limit = 20) {
  const db = getDb();
  const rows = db.exec(
    `SELECT id, stripe_invoice_id, amount, currency, status, invoice_pdf, period_start, period_end, created_at
     FROM invoices WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
    [userId, limit]
  )[0]?.values || [];
  return rows.map((r) => ({
    id: r[0],
    stripeInvoiceId: r[1],
    amount: r[2],
    currency: r[3],
    status: r[4],
    invoicePdf: r[5],
    periodStart: r[6],
    periodEnd: r[7],
    createdAt: r[8],
  }));
}

// ============================================================
// Stripe Checkout + Portal
// ============================================================
async function createCheckoutSession({ userId, email, planId, billingCycle }) {
  const plan = getPlan(planId);
  if (plan.id === "free") {
    const err = new Error("Free plan does not require checkout");
    err.status = 400;
    throw err;
  }
  const s = getStripe();
  if (!s) {
    const err = new Error("Stripe is not configured (missing STRIPE_SECRET_KEY)");
    err.status = 503;
    throw err;
  }
  const priceId = plan.stripePriceId[billingCycle === "annual" ? "annual" : "monthly"];
  if (!priceId) {
    const err = new Error("Stripe price ID is not configured for " + planId + " / " + billingCycle);
    err.status = 503;
    throw err;
  }
  // Reuse existing customer if any
  const billing = getUserBilling(userId);
  let customerId = billing.stripeCustomerId;
  if (!customerId) {
    const customer = await s.customers.create({ email, name: email.split("@")[0] });
    customerId = customer.id;
    db_run(
      "UPDATE users SET stripe_customer_id = ? WHERE id = ?",
      [customerId, userId]
    );
  }
  const session = await s.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: FRONTEND_BASE + "/dashboard/billing?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: FRONTEND_BASE + "/dashboard/billing?canceled=1",
    metadata: { userId: String(userId), planId, billingCycle },
  });
  return { checkoutUrl: session.url, sessionId: session.id };
}

function db_run(sql, params) {
  const db = getDb();
  db.run(sql, params);
  save();
}

async function verifyCheckoutSession(userId, sessionId) {
  const s = getStripe();
  if (!s) throw httpErr(503, "Stripe is not configured");
  const session = await s.checkout.sessions.retrieve(sessionId);
  if (!session || session.metadata?.userId !== String(userId)) {
    throw httpErr(403, "Session does not belong to this user");
  }
  if (session.payment_status !== "paid" && session.status !== "complete") {
    throw httpErr(402, "Checkout not completed");
  }
  const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  const sub = subId ? await s.subscriptions.retrieve(subId) : null;
  if (!sub) throw httpErr(500, "Subscription not found");
  const cycle = session.metadata?.billingCycle || "monthly";
  return applyPlanChange(userId, {
    plan: session.metadata?.planId || mapStripePriceToPlan(sub.items.data[0]?.price?.id, cycle),
    status: sub.status,
    stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
    stripeSubscriptionId: sub.id,
    currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end || false,
  });
}

function mapStripePriceToPlan(priceId, cycle) {
  for (const plan of Object.values(PLANS)) {
    if (plan.stripePriceId.monthly === priceId || plan.stripePriceId.annual === priceId) {
      return plan.id;
    }
  }
  return "pro";
}

async function createPortalSession(userId) {
  const s = getStripe();
  if (!s) throw httpErr(503, "Stripe is not configured");
  const billing = getUserBilling(userId);
  if (!billing.stripeCustomerId) throw httpErr(400, "No Stripe customer for this user");
  const session = await s.billingPortal.sessions.create({
    customer: billing.stripeCustomerId,
    return_url: PORTAL_RETURN_URL,
  });
  return { portalUrl: session.url };
}

// ============================================================
// Stripe webhook
// ============================================================
function verifyWebhookSignature(rawBody, signatureHeader) {
  if (!STRIPE_WEBHOOK_SECRET) return null;
  const s = getStripe();
  if (!s) return null;
  try {
    return s.webhooks.constructEvent(rawBody, signatureHeader, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return null;
  }
}

async function handleWebhookEvent(event) {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = parseInt(session.metadata?.userId, 10);
    if (!userId) return { ignored: true, reason: "no userId in metadata" };
    if (session.mode === "subscription" && session.subscription) {
      const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
      const sub = await getStripe().subscriptions.retrieve(subId);
      const cycle = session.metadata?.billingCycle || "monthly";
      applyPlanChange(userId, {
        plan: session.metadata?.planId || mapStripePriceToPlan(sub.items.data[0]?.price?.id, cycle),
        status: sub.status,
        stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
        stripeSubscriptionId: sub.id,
        currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
        cancelAtPeriodEnd: sub.cancel_at_period_end || false,
      });
    }
    return { ok: true, type: "checkout.session.completed" };
  }
  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const sub = event.data.object;
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
    const userId = findUserIdByStripeCustomer(customerId);
    if (!userId) return { ignored: true, reason: "no user for customer" };
    const planId = mapStripePriceToPlan(sub.items.data[0]?.price?.id, "monthly");
    if (event.type === "customer.subscription.deleted" || sub.status === "canceled" || sub.status === "incomplete_expired") {
      applyPlanChange(userId, { plan: "free", status: "cancelled" });
    } else {
      applyPlanChange(userId, {
        plan: planId,
        status: sub.status,
        stripeCustomerId: customerId,
        stripeSubscriptionId: sub.id,
        currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
        cancelAtPeriodEnd: sub.cancel_at_period_end || false,
      });
    }
    return { ok: true, type: event.type };
  }
  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    const inv = event.data.object;
    const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
    const userId = findUserIdByStripeCustomer(customerId);
    if (!userId) return { ignored: true, reason: "no user for customer" };
    recordInvoice(userId, {
      stripeInvoiceId: inv.id,
      amount: inv.amount_paid || inv.amount_due || 0,
      currency: inv.currency || "usd",
      status: event.type === "invoice.paid" ? "paid" : "failed",
      invoicePdf: inv.invoice_pdf || null,
      periodStart: inv.period_start ? new Date(inv.period_start * 1000).toISOString() : null,
      periodEnd: inv.period_end ? new Date(inv.period_end * 1000).toISOString() : null,
    });
    return { ok: true, type: event.type };
  }
  return { ignored: true, type: event.type };
}

function findUserIdByStripeCustomer(stripeCustomerId) {
  if (!stripeCustomerId) return null;
  const db = getDb();
  const row = db.exec("SELECT id FROM users WHERE stripe_customer_id = ?", [stripeCustomerId])[0]?.values?.[0];
  return row ? row[0] : null;
}

function httpErr(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

module.exports = {
  // Plans
  PLANS,
  listPlans,
  getPlan,
  planRequires,
  // User state
  getUserBilling,
  // Enforcement
  enforceBriefLimit,
  recordBriefCreated,
  // Plan changes
  applyPlanChange,
  // Invoices
  recordInvoice,
  listInvoices,
  // Stripe
  getStripe: () => getStripe(),
  createCheckoutSession,
  verifyCheckoutSession,
  createPortalSession,
  verifyWebhookSignature,
  handleWebhookEvent,
};
