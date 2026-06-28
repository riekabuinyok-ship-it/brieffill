const { getDb } = require("../utils/db");
const { qualifyReferralOnPlanChange } = require("./referralService");

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const PORTAL_RETURN_URL = process.env.STRIPE_PORTAL_RETURN_URL || "http://localhost:5000/dashboard/billing";
const FRONTEND_BASE = process.env.FRONTEND_BASE_URL || "http://localhost:5173";

let stripe = null;
function getStripe() {
  if (!STRIPE_KEY) return null;
  if (!stripe) {
    const Stripe = require("stripe");
    stripe = new Stripe(STRIPE_KEY, { apiVersion: "2024-06-20" });
  }
  return stripe;
}

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
    monthlyPrice: 1900,
    annualPrice: 18200,
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

function currentMonthKey() {
  const d = new Date();
  return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0");
}

async function getUserBilling(userId) {
  const db = getDb();
  const { data, error } = await db.from('users')
    .select('plan, subscription_status, stripe_customer_id, stripe_subscription_id, brief_count_this_month, brief_count_month, current_period_end, cancel_at_period_end, trial_end_date')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const plan = data.plan || "free";
  const status = data.subscription_status || "active";
  const stripeCustomerId = data.stripe_customer_id;
  const stripeSubscriptionId = data.stripe_subscription_id;
  let briefsUsed = data.brief_count_this_month || 0;
  const briefMonth = data.brief_count_month;
  const currentPeriodEnd = data.current_period_end;
  const cancelAtPeriodEnd = data.cancel_at_period_end === true;
  const trialEndDate = data.trial_end_date;

  const thisMonth = currentMonthKey();
  if (briefMonth !== thisMonth) {
    briefsUsed = 0;
    await db.from('users').update({ brief_count_this_month: 0, brief_count_month: thisMonth }).eq('id', userId);
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

async function enforceBriefLimit(userId) {
  const billing = await getUserBilling(userId);
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

async function recordBriefCreated(userId) {
  const billing = await getUserBilling(userId);
  if (billing.briefLimit === -1) return billing;
  const db = getDb();
  const thisMonth = currentMonthKey();
  const newCount = billing.briefsUsed + 1;
  await db.from('users').update({ brief_count_this_month: newCount, brief_count_month: thisMonth }).eq('id', userId);
  return { ...billing, briefsUsed: newCount };
}

async function applyPlanChange(userId, { plan, status, stripeCustomerId, stripeSubscriptionId, currentPeriodEnd, cancelAtPeriodEnd }) {
  const db = getDb();
  const next = {
    plan: plan || "free",
    subscription_status: status || "active",
    stripe_customer_id: stripeCustomerId || null,
    stripe_subscription_id: stripeSubscriptionId || null,
    current_period_end: currentPeriodEnd || null,
    cancel_at_period_end: cancelAtPeriodEnd === true,
    brief_count_this_month: 0,
    brief_count_month: currentMonthKey(),
  };
  await db.from('users').update(next).eq('id', userId);

  if (plan && plan !== "free") {
    try {
      await qualifyReferralOnPlanChange({ referredUserId: userId, newPlan: plan });
    } catch (err) {
      console.error("qualifyReferralOnPlanChange error:", err.message);
    }
  }

  return getUserBilling(userId);
}

async function recordInvoice(userId, { stripeInvoiceId, amount, currency, status, invoicePdf, periodStart, periodEnd }) {
  if (!stripeInvoiceId) return null;
  const db = getDb();
  const { data: existing } = await db.from('invoices')
    .select('id')
    .eq('stripe_invoice_id', stripeInvoiceId)
    .maybeSingle();
  if (existing) {
    await db.from('invoices').update({
      amount, currency: currency || "usd", status, invoice_pdf: invoicePdf, period_start: periodStart, period_end: periodEnd,
    }).eq('id', existing.id);
  } else {
    await db.from('invoices').insert({
      user_id: userId, stripe_invoice_id: stripeInvoiceId, amount, currency: currency || "usd", status, invoice_pdf: invoicePdf, period_start: periodStart, period_end: periodEnd,
    });
  }
  return getInvoiceByStripeId(stripeInvoiceId);
}

async function getInvoiceByStripeId(stripeInvoiceId) {
  const db = getDb();
  const { data } = await db.from('invoices')
    .select('id, user_id, stripe_invoice_id, amount, currency, status, invoice_pdf, period_start, period_end, created_at')
    .eq('stripe_invoice_id', stripeInvoiceId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    userId: data.user_id,
    stripeInvoiceId: data.stripe_invoice_id,
    amount: data.amount,
    currency: data.currency,
    status: data.status,
    invoicePdf: data.invoice_pdf,
    periodStart: data.period_start,
    periodEnd: data.period_end,
    createdAt: data.created_at,
  };
}

async function listInvoices(userId, limit = 20) {
  const db = getDb();
  const { data } = await db.from('invoices')
    .select('id, stripe_invoice_id, amount, currency, status, invoice_pdf, period_start, period_end, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data || []).map((r) => ({
    id: r.id,
    stripeInvoiceId: r.stripe_invoice_id,
    amount: r.amount,
    currency: r.currency,
    status: r.status,
    invoicePdf: r.invoice_pdf,
    periodStart: r.period_start,
    periodEnd: r.period_end,
    createdAt: r.created_at,
  }));
}

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
  const billing = await getUserBilling(userId);
  let customerId = billing.stripeCustomerId;
  if (!customerId) {
    const customer = await s.customers.create({ email, name: email.split("@")[0] });
    customerId = customer.id;
    const db = getDb();
    await db.from('users').update({ stripe_customer_id: customerId }).eq('id', userId);
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
  const billing = await getUserBilling(userId);
  if (!billing.stripeCustomerId) throw httpErr(400, "No Stripe customer for this user");
  const session = await s.billingPortal.sessions.create({
    customer: billing.stripeCustomerId,
    return_url: PORTAL_RETURN_URL,
  });
  return { portalUrl: session.url };
}

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
      await applyPlanChange(userId, {
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
    const userId = await findUserIdByStripeCustomer(customerId);
    if (!userId) return { ignored: true, reason: "no user for customer" };
    const planId = mapStripePriceToPlan(sub.items.data[0]?.price?.id, "monthly");
    if (event.type === "customer.subscription.deleted" || sub.status === "canceled" || sub.status === "incomplete_expired") {
      await applyPlanChange(userId, { plan: "free", status: "cancelled" });
    } else {
      await applyPlanChange(userId, {
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
    const userId = await findUserIdByStripeCustomer(customerId);
    if (!userId) return { ignored: true, reason: "no user for customer" };
    await recordInvoice(userId, {
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

async function findUserIdByStripeCustomer(stripeCustomerId) {
  if (!stripeCustomerId) return null;
  const db = getDb();
  const { data } = await db.from('users')
    .select('id')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle();
  return data ? data.id : null;
}

function httpErr(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

module.exports = {
  PLANS,
  listPlans,
  getPlan,
  planRequires,
  getUserBilling,
  enforceBriefLimit,
  recordBriefCreated,
  applyPlanChange,
  recordInvoice,
  listInvoices,
  getStripe: () => getStripe(),
  createCheckoutSession,
  verifyCheckoutSession,
  createPortalSession,
  verifyWebhookSignature,
  handleWebhookEvent,
};
