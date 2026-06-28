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

exports.getPlans = (req, res) => {
  res.json({ plans: listPlans() });
};

exports.getMe = async (req, res) => {
  const billing = await getUserBilling(req.user.id);
  if (!billing) return res.status(404).json({ error: "User not found" });
  const invoices = await listInvoices(req.user.id, 12);
  res.json({ billing, invoices });
};

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

exports.getInvoices = async (req, res) => {
  const invoices = await listInvoices(req.user.id, 50);
  res.json({ invoices });
};

exports.bypass = async (req, res) => {
  const { plan, billingCycle = "monthly" } = req.body || {};
  if (!plan) return res.status(400).json({ error: "plan is required" });
  const valid = ["free", "pro", "team", "agency"];
  if (!valid.includes(plan)) return res.status(400).json({ error: "Invalid plan" });
  const billing = await applyPlanChange(req.user.id, {
    plan,
    status: "active",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  });
  const planDef = getPlan(plan);
  const amount = billingCycle === "annual" ? planDef.annualPrice : planDef.monthlyPrice;
  if (amount > 0) {
    await recordInvoice(req.user.id, {
      stripeInvoiceId: "bypass_" + Date.now(),
      amount,
      currency: "usd",
      status: "paid",
      invoicePdf: null,
      periodStart: new Date().toISOString(),
      periodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
    });
  }
  const invoices = await listInvoices(req.user.id, 50);
  res.json({ billing, invoices });
};

exports.cancel = async (req, res) => {
  const db = getDb();
  await db.from('users').update({ subscription_status: 'cancelled', cancel_at_period_end: true }).eq('id', req.user.id);
  const billing = await getUserBilling(req.user.id);
  res.json({ ok: true, billing });
};
