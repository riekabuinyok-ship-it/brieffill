// BriefFill — Referral service.
// Handles unique-code generation, attribution at signup, qualification when
// the referred user activates a paid plan, and credit issuance to the
// referrer. Email sending is delegated to emailService (no-op transport in
// dev; pluggable for SendGrid/Mailgun in prod).

const { getDb, save } = require("../utils/db");
const { sendEmail } = require("./emailService");

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // omit confusable chars
const REFERRER_CREDIT_CENTS = 1000; // $10
const FRIEND_REWARD_DESCRIPTION = "1 month free Pro (credited after qualifying)";

function generateReferralCode() {
  let s = "";
  for (let i = 0; i < 8; i++) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return s;
}

function ensureReferralCode(userId) {
  const db = getDb();
  const row = db.exec("SELECT referral_code FROM users WHERE id = ?", [userId])[0]?.values?.[0];
  if (row && row[0]) return row[0];
  // Try a few times in case of collision
  for (let i = 0; i < 5; i++) {
    const code = generateReferralCode();
    try {
      db.run("UPDATE users SET referral_code = ? WHERE id = ?", [code, userId]);
      save();
      return code;
    } catch (err) {
      if (!String(err.message).includes("UNIQUE") && !String(err.message).includes("unique")) throw err;
    }
  }
  throw new Error("Failed to generate a unique referral code");
}

function getReferralCode(userId) {
  const db = getDb();
  const row = db.exec("SELECT referral_code FROM users WHERE id = ?", [userId])[0]?.values?.[0];
  return row ? row[0] : null;
}

function resolveReferrerByCode(code) {
  if (!code || typeof code !== "string") return null;
  const db = getDb();
  const row = db.exec("SELECT id, email, name, plan FROM users WHERE referral_code = ?", [code.trim().toUpperCase()])[0]?.values?.[0];
  if (!row) return null;
  return { id: row[0], email: row[1], name: row[2], plan: row[3] };
}

// Called by authController at signup. Returns the friend reward description if
// attribution succeeded, or null if no code / code invalid / self-referral /
// anti-abuse rejection.
function attributeReferralOnSignup({ referredUserId, referredEmail, referralCode, ipAddress }) {
  if (!referralCode) return null;
  const referrer = resolveReferrerByCode(referralCode);
  if (!referrer) return null;
  if (referrer.id === referredUserId) return null; // self-referral

  const db = getDb();

  // Anti-abuse: same email-domain as the referrer
  if (referrer.email && referredEmail) {
    const referrerDomain = referrer.email.split("@")[1]?.toLowerCase();
    const referredDomain = referredEmail.split("@")[1]?.toLowerCase();
    if (referrerDomain && referredDomain && referrerDomain === referredDomain) {
      db.run(
        "INSERT OR IGNORE INTO referrals (referrer_user_id, referred_user_id, referral_code, status, rejected_reason, ip_address) VALUES (?, ?, ?, 'rejected', 'same_email_domain', ?)",
        [referrer.id, referredUserId, referralCode.trim().toUpperCase(), ipAddress || null]
      );
      save();
      return null;
    }
  }

  // Mark the referred user with the referrer
  db.run("UPDATE users SET referred_by_user_id = ? WHERE id = ?", [referrer.id, referredUserId]);
  db.run(
    "INSERT OR IGNORE INTO referrals (referrer_user_id, referred_user_id, referral_code, status, referrer_credit_cents, friend_reward, ip_address) VALUES (?, ?, ?, 'signed_up', ?, ?, ?)",
    [referrer.id, referredUserId, referralCode.trim().toUpperCase(), REFERRER_CREDIT_CENTS, FRIEND_REWARD_DESCRIPTION, ipAddress || null]
  );
  db.run("UPDATE users SET last_referral_activity_at = datetime('now') WHERE id = ?", [referrer.id]);
  save();

  return {
    referrerId: referrer.id,
    referrerName: referrer.name,
    friendReward: FRIEND_REWARD_DESCRIPTION,
  };
}

// Called by billingService.applyPlanChange() when a user becomes paid.
// Idempotent: subsequent calls after the first reward are no-ops.
function qualifyReferralOnPlanChange({ referredUserId, newPlan }) {
  if (!referredUserId) return null;
  if (newPlan === "free") return null;

  const db = getDb();
  const row = db.exec(
    "SELECT id, referrer_user_id, status FROM referrals WHERE referred_user_id = ?",
    [referredUserId]
  )[0]?.values?.[0];
  if (!row) return null;
  const [refId, referrerUserId, currentStatus] = row;
  if (currentStatus === "rewarded" || currentStatus === "cancelled" || currentStatus === "rejected") {
    return null;
  }

  // Mark qualified
  db.run(
    "UPDATE referrals SET status = 'rewarded', qualified_at = datetime('now'), rewarded_at = datetime('now') WHERE id = ?",
    [refId]
  );
  // Credit the referrer
  db.run(
    "INSERT INTO referral_credits (user_id, amount_cents, reason, referral_id) VALUES (?, ?, ?, ?)",
    [referrerUserId, REFERRER_CREDIT_CENTS, "referral_reward", refId]
  );
  db.run("UPDATE users SET last_referral_activity_at = datetime('now') WHERE id = ?", [referrerUserId]);
  save();

  // Notify the referrer
  const refRow = db.exec("SELECT email, name FROM users WHERE id = ?", [referrerUserId])[0]?.values?.[0];
  if (refRow) {
    const [email, name] = refRow;
    sendEmail({
      to: email,
      subject: `You earned a $${REFERRER_CREDIT_CENTS / 100} credit on BriefFill`,
      body: `Hi ${name},\n\nGreat news — the friend you referred just activated a paid plan. We've added a $${REFERRER_CREDIT_CENTS / 100} credit to your account, which will be applied automatically to your next invoice.\n\nKeep sharing to earn more: visit /dashboard/referrals.\n\n— The BriefFill team`,
    }).catch((err) => console.error("Referral reward email failed:", err.message));
  }

  return { referralId: refId, referrerUserId, creditCents: REFERRER_CREDIT_CENTS };
}

// Returns a referrer's full referral state for the dashboard page.
function getReferralStats(userId) {
  const db = getDb();
  const code = ensureReferralCode(userId);
  const invitees = db.exec(
    `SELECT r.id, r.referred_user_id, r.status, r.referrer_credit_cents, r.friend_reward,
            r.created_at, r.qualified_at, r.rewarded_at, u.email, u.name, u.created_at AS user_created_at
     FROM referrals r
     JOIN users u ON u.id = r.referred_user_id
     WHERE r.referrer_user_id = ?
     ORDER BY r.created_at DESC`,
    [userId]
  )[0]?.values || [];

  const credits = db.exec(
    "SELECT COALESCE(SUM(amount_cents), 0) FROM referral_credits WHERE user_id = ?",
    [userId]
  )[0]?.values?.[0]?.[0] || 0;
  const pendingCredits = db.exec(
    "SELECT COUNT(*) FROM referrals WHERE referrer_user_id = ? AND status IN ('signed_up')",
    [userId]
  )[0]?.values?.[0]?.[0] || 0;

  return {
    code,
    link: buildReferralLink(code),
    totals: {
      invited: invitees.length,
      signedUp: invitees.filter((r) => ["signed_up", "paid", "rewarded"].includes(r[2])).length,
      paid: invitees.filter((r) => ["paid", "rewarded"].includes(r[2])).length,
      rewarded: invitees.filter((r) => r[2] === "rewarded").length,
    },
    creditsEarnedCents: credits,
    pendingRewards: pendingCredits,
    invitees: invitees.map((row) => ({
      id: row[0],
      referredUserId: row[1],
      status: row[2],
      creditCents: row[3],
      friendReward: row[4],
      createdAt: row[5],
      qualifiedAt: row[6],
      rewardedAt: row[7],
      friendEmail: row[8],
      friendName: row[9],
      friendSignedUpAt: row[10],
    })),
  };
}

function buildReferralLink(code) {
  const base = process.env.FRONTEND_BASE_URL || "http://localhost:5173";
  return `${base}/register?ref=${encodeURIComponent(code)}`;
}

module.exports = {
  generateReferralCode,
  ensureReferralCode,
  getReferralCode,
  resolveReferrerByCode,
  attributeReferralOnSignup,
  qualifyReferralOnPlanChange,
  getReferralStats,
  buildReferralLink,
  REFERRER_CREDIT_CENTS,
  FRIEND_REWARD_DESCRIPTION,
};
