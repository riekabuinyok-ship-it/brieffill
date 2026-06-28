const { getDb } = require("../utils/db");

const PLANS = [
  { id: "free_trial", name: "Free Trial", price: 0, period: "7 days", briefLimit: 5 },
  { id: "monthly", name: "Monthly Pro", price: 1900, period: "month", briefLimit: -1 },
  { id: "annual", name: "Annual Pro", price: 19000, period: "year", briefLimit: -1 },
];

exports.getPlans = (_req, res) => {
  res.json({ plans: PLANS });
};

exports.getMySubscription = async (req, res) => {
  const db = getDb();

  const { data: userData } = await db.from('users')
    .select('subscription_status, trial_end_date')
    .eq('id', req.user.id)
    .maybeSingle();
  if (!userData) {
    return res.status(404).json({ error: "User not found" });
  }

  const status = userData.subscription_status;
  const trialEnd = userData.trial_end_date;

  const { data: paymentsData } = await db.from('payments')
    .select('plan, amount, currency, status, created_at')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(10);
  const payments = (paymentsData || []).map((p) => ({
    plan: p.plan, amount: p.amount, currency: p.currency, status: p.status, createdAt: p.created_at,
  }));

  const { count: briefsUsed } = await db.from('briefs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', req.user.id);

  const currentPlan = PLANS.find((p) => p.id === status) || PLANS[0];

  res.json({
    plan: currentPlan,
    status,
    trialEndDate: trialEnd,
    briefsUsed: briefsUsed || 0,
    briefLimit: currentPlan.briefLimit,
    payments,
  });
};

exports.createCheckout = (req, res) => {
  const { planId } = req.body;
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) return res.status(400).json({ error: "Invalid plan" });
  if (plan.price === 0) return res.status(400).json({ error: "Free trial cannot be purchased" });

  res.json({
    checkoutUrl: null,
    planId: plan.id,
    amount: plan.price,
    message: "Use POST /api/subscriptions/bypass to simulate payment in development.",
  });
};

exports.bypassPayment = async (req, res) => {
  const { planId } = req.body;
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) return res.status(400).json({ error: "Invalid plan" });

  const db = getDb();
  const newStatus = planId;
  const trialEnd = planId === "free_trial"
    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    : null;

  await db.from('users').update({ subscription_status: newStatus, trial_end_date: trialEnd }).eq('id', req.user.id);
  await db.from('payments').insert({ user_id: req.user.id, amount: plan.price, currency: 'usd', plan: plan.id, status: 'bypass' });

  const { data: userData } = await db.from('users')
    .select('id, email, name, created_at, subscription_status, trial_end_date')
    .eq('id', req.user.id)
    .single();

  res.json({
    success: true,
    message: `Payment bypassed. You are now on the ${plan.name} plan.`,
    user: {
      id: userData.id, email: userData.email, name: userData.name, createdAt: userData.created_at,
      subscriptionStatus: userData.subscription_status, trialEndDate: userData.trial_end_date,
    },
  });
};

exports.cancelSubscription = async (req, res) => {
  const db = getDb();
  await db.from('users').update({ subscription_status: 'cancelled' }).eq('id', req.user.id);

  res.json({ success: true, message: "Subscription cancelled. You still have access until the end of the billing period." });
};
