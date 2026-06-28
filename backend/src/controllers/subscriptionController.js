const { getDb, save } = require("../utils/db");

const PLANS = [
  { id: "free_trial", name: "Free Trial", price: 0, period: "7 days", briefLimit: 5 },
  { id: "monthly", name: "Monthly Pro", price: 1900, period: "month", briefLimit: -1 },
  { id: "annual", name: "Annual Pro", price: 19000, period: "year", briefLimit: -1 },
];

exports.getPlans = (_req, res) => {
  res.json({ plans: PLANS });
};

exports.getMySubscription = (req, res) => {
  const db = getDb();
  const userResult = db.exec(`SELECT subscription_status, trial_end_date FROM users WHERE id = ${req.user.id}`);
  if (!userResult[0]?.values.length) {
    return res.status(404).json({ error: "User not found" });
  }

  const row = userResult[0].values[0];
  const status = row[0];
  const trialEnd = row[1];

  const paymentsResult = db.exec(
    `SELECT plan, amount, currency, status, created_at FROM payments WHERE user_id = ${req.user.id} ORDER BY created_at DESC LIMIT 10`
  );
  const payments = paymentsResult[0]?.values.map((p) => ({
    plan: p[0], amount: p[1], currency: p[2], status: p[3], createdAt: p[4],
  })) || [];

  const briefCountResult = db.exec(`SELECT count(*) AS cnt FROM briefs WHERE user_id = ${req.user.id}`);
  const briefsUsed = briefCountResult[0]?.values[0][0] || 0;

  const currentPlan = PLANS.find((p) => p.id === status) || PLANS[0];

  res.json({
    plan: currentPlan,
    status,
    trialEndDate: trialEnd,
    briefsUsed,
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

exports.bypassPayment = (req, res) => {
  const { planId } = req.body;
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) return res.status(400).json({ error: "Invalid plan" });

  const db = getDb();
  const newStatus = planId;
  const trialEnd = planId === "free_trial"
    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace("T", " ")
    : null;

  db.run("UPDATE users SET subscription_status = ?, trial_end_date = ? WHERE id = ?", [newStatus, trialEnd, req.user.id]);
  db.run("INSERT INTO payments (user_id, amount, currency, plan, status) VALUES (?, ?, 'usd', ?, 'bypass')", [req.user.id, plan.price, plan.id]);
  save();

  const userResult = db.exec(`SELECT id, email, name, created_at, subscription_status, trial_end_date FROM users WHERE id = ${req.user.id}`);
  const row = userResult[0].values[0];

  res.json({
    success: true,
    message: `Payment bypassed. You are now on the ${plan.name} plan.`,
    user: {
      id: row[0], email: row[1], name: row[2], createdAt: row[3],
      subscriptionStatus: row[4], trialEndDate: row[5],
    },
  });
};

exports.cancelSubscription = (req, res) => {
  const db = getDb();
  db.run("UPDATE users SET subscription_status = 'cancelled' WHERE id = ?", [req.user.id]);
  save();

  res.json({ success: true, message: "Subscription cancelled. You still have access until the end of the billing period." });
};
