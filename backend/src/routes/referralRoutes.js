const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getReferralStats, resolveReferrerByCode, REFERRER_CREDIT_CENTS, FRIEND_REWARD_DESCRIPTION } = require("../services/referralService");
const { runReferralCron } = require("../services/referralCronService");

// GET /api/referrals/stats — current user's referral state
router.get("/stats", auth, async (req, res) => {
  try {
    const stats = await getReferralStats(req.user.id);
    res.json({
      ...stats,
      referrerCreditCents: REFERRER_CREDIT_CENTS,
      friendReward: FRIEND_REWARD_DESCRIPTION,
    });
  } catch (err) {
    console.error("referral stats error:", err);
    res.status(500).json({ error: "Failed to load referral stats" });
  }
});

// GET /api/referrals/validate?code=ABC12345 — public, no auth
// Lets the registration page show a "Referred by {name}" hint before submit.
router.get("/validate", async (req, res) => {
  const code = (req.query.code || "").toString();
  if (!code) return res.json({ valid: false });
  const referrer = await resolveReferrerByCode(code);
  if (!referrer) return res.json({ valid: false });
  res.json({ valid: true, referrerName: referrer.name });
});

// POST /api/referrals/cron/run — protected by CRON_SECRET header.
// External scheduler (Vercel cron, GitHub Actions, Railway cron) hits this
// daily to send onboarding + reactivation emails.
router.post("/cron/run", async (req, res) => {
  const expected = process.env.CRON_SECRET;
  const provided = req.headers["x-cron-secret"];
  if (!expected) {
    return res.status(503).json({ error: "CRON_SECRET is not configured on the server" });
  }
  if (provided !== expected) {
    return res.status(401).json({ error: "Invalid cron secret" });
  }
  try {
    const result = await runReferralCron();
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error("referral cron error:", err);
    res.status(500).json({ error: "Cron run failed" });
  }
});

module.exports = router;
