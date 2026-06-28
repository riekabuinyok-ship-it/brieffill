const {
  listPlans,
  getUserBilling,
  getPlan,
  createCheckoutSession,
  verifyCheckoutSession,
  createPortalSession,
  handleWebhookEvent,
  verifyWebhookSignature,
  applyPlanChange,
  listInvoices,
  recordInvoice,
} = require("../services/billingService");
const { getDb } = require("../utils/db");

// ============================================================
// Plan catalog (public — used by /pricing page)
// ============================================================
exports.getPlans = (req, res) => {
  res.json({ plans: listPlans() });
};

// ============================================================
// Current user billing state
// ============================================================
exports.getMe = (req, res) => {
  const billing = getUserBilling(req.user.id);
  if (!billing) return res.status(404).json({ error: "User not found" });
  const invoices = listInvoices(req.user.id, 12);
  res.json({ billing, invoices });
};

// ============================================================
// Create Stripe Checkout session
// ============================================================
exports.createCheckout = async (req, res) => {
  try {
    const { plan, billingCycle = "monthly" } = req.body || {};
    if (!plan) return res.status(400).json({ error: "plan is required" });
    const result = await createCheckoutSession({
      userId: req.user.id,
      email: req.user.email,
      planId: plan,
      billingCycle,
    });
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error("createCheckout error:", err);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
};

// ============================================================
// Verify a Checkout session after the user returns from Stripe
// ============================================================
exports.verifyCheckout = async (req, res) => {
  try {
    const { sessionId } = req.body || {};
    if (!sessionId) return res.status(400).json({ error: "sessionId is required" });
    const billing = await verifyCheckoutSession(req.user.id, sessionId);
    res.json({ billing });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error("verifyCheckout error:", err);
    res.status(500).json({ error: "Failed to verify checkout" });
  }
};

// ============================================================
// Stripe Customer Portal (self-service billing)
// ============================================================
exports.openPortal = async (req, res) => {
  try {
    const result = await createPortalSession(req.user.id);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error("openPortal error:", err);
    res.status(500).json({ error: "Failed to open billing portal" });
  }
};

// ============================================================
// Webhook (public — verified via Stripe signature)
// ============================================================
exports.webhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const rawBody = req.rawBody || (req.body && Buffer.from(JSON.stringify(req.body)));
  const event = verifyWebhookSignature(rawBody, sig);
  if (!event) {
    return res.status(400).json({ error: "Invalid signature or Stripe not configured" });
  }
  try {
    const result = await handleWebhookEvent(event);
    res.json({ received: true, ...result });
  } catch (err) {
    console.error("webhook error:", err);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};

// ============================================================
// Invoices
// ============================================================
exports.getInvoices = (req, res) => {
  const invoices = listInvoices(req.user.id, 50);
  res.json({ invoices });
};

// ============================================================
// Dev-only bypass (no Stripe required)
// ============================================================
exports.bypass = (req, res) => {
  const { plan, billingCycle = "monthly" } = req.body || {};
  if (!plan) return res.status(400).json({ error: "plan is required" });
  const valid = ["free", "pro", "team", "agency"];
  if (!valid.includes(plan)) return res.status(400).json({ error: "Invalid plan" });
  const billing = applyPlanChange(req.user.id, {
    plan,
    status: "active",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  });
  // Record a fake invoice so the billing page shows history
  const planDef = getPlan(plan);
  const amount = billingCycle === "annual" ? planDef.annualPrice : planDef.monthlyPrice;
  if (amount > 0) {
    recordInvoice(req.user.id, {
      stripeInvoiceId: "bypass_" + Date.now(),
      amount,
      currency: "usd",
      status: "paid",
      invoicePdf: null,
      periodStart: new Date().toISOString(),
      periodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
    });
  }
  res.json({ billing, invoices: listInvoices(req.user.id, 50) });
};

// ============================================================
// Cancel subscription (sets status='cancelled', keeps plan until period end)
// ============================================================
exports.cancel = (req, res) => {
  const db = getDb();
  db.run("UPDATE users SET subscription_status = 'cancelled', cancel_at_period_end = 1 WHERE id = ?", [req.user.id]);
  res.json({ ok: true, billing: getUserBilling(req.user.id) });
};
