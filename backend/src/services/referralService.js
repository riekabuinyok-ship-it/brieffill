// BriefFill — Referral service.
// Handles unique-code generation, attribution at signup, qualification when
// the referred user activates a paid plan, and credit issuance to the
// referrer. Email sending is delegated to emailService (no-op transport in
// dev; pluggable for SendGrid/Mailgun in prod).

const { getDb } = require("../utils/db");
const { sendEmail } = require("./emailService");

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const REFERRER_CREDIT_CENTS = 1000;
const FRIEND_REWARD_DESCRIPTION = "1 month free Pro (credited after qualifying)";

function generateReferralCode() {
  let s = "";
  for (let i = 0; i < 8; i++) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return s;
}

async function ensureReferralCode(userId) {
  const db = getDb();
  const { data: existing } = await db
    .from("users")
    .select("referral_code")
    .eq("id", userId)
    .maybeSingle();
  if (existing?.referral_code) return existing.referral_code;
  for (let i = 0; i < 5; i++) {
    const code = generateReferralCode();
    try {
      const { error } = await db
        .from("users")
        .update({ referral_code: code })
        .eq("id", userId);
      if (error) throw error;
      return code;
    } catch (err) {
      const msg = String(err.message || err).toLowerCase();
      if (!msg.includes("unique") && !msg.includes("duplicate")) throw err;
    }
  }
  throw new Error("Failed to generate a unique referral code");
}

async function getReferralCode(userId) {
  const db = getDb();
  const { data } = await db
    .from("users")
    .select("referral_code")
    .eq("id", userId)
    .maybeSingle();
  return data?.referral_code ?? null;
}

async function resolveReferrerByCode(code) {
  if (!code || typeof code !== "string") return null;
  const db = getDb();
  const { data } = await db
    .from("users")
    .select("id, email, name, plan")
    .eq("referral_code", code.trim().toUpperCase())
    .maybeSingle();
  if (!data) return null;
  return { id: data.id, email: data.email, name: data.name, plan: data.plan };
}

async function attributeReferralOnSignup({ referredUserId, referredEmail, referralCode, ipAddress }) {
  if (!referralCode) return null;
  const referrer = await resolveReferrerByCode(referralCode);
  if (!referrer) return null;
  if (referrer.id === referredUserId) return null;

  const db = getDb();
  const code = referralCode.trim().toUpperCase();

  if (referrer.email && referredEmail) {
    const referrerDomain = referrer.email.split("@")[1]?.toLowerCase();
    const referredDomain = referredEmail.split("@")[1]?.toLowerCase();
    if (referrerDomain && referredDomain && referrerDomain === referredDomain) {
      try {
        await db.from("referrals").insert({
          referrer_user_id: referrer.id,
          referred_user_id: referredUserId,
          referral_code: code,
          status: "rejected",
          rejected_reason: "same_email_domain",
          ip_address: ipAddress || null,
        });
      } catch (e) {
        if (!String(e.message || e).toLowerCase().includes("unique") &&
            !String(e.message || e).toLowerCase().includes("duplicate")) throw e;
      }
      return null;
    }
  }

  await db
    .from("users")
    .update({ referred_by_user_id: referrer.id })
    .eq("id", referredUserId);

  try {
    await db.from("referrals").insert({
      referrer_user_id: referrer.id,
      referred_user_id: referredUserId,
      referral_code: code,
      status: "signed_up",
      referrer_credit_cents: REFERRER_CREDIT_CENTS,
      friend_reward: FRIEND_REWARD_DESCRIPTION,
      ip_address: ipAddress || null,
    });
  } catch (e) {
    if (!String(e.message || e).toLowerCase().includes("unique") &&
        !String(e.message || e).toLowerCase().includes("duplicate")) throw e;
  }

  await db
    .from("users")
    .update({ last_referral_activity_at: new Date().toISOString() })
    .eq("id", referrer.id);

  return {
    referrerId: referrer.id,
    referrerName: referrer.name,
    friendReward: FRIEND_REWARD_DESCRIPTION,
  };
}

async function qualifyReferralOnPlanChange({ referredUserId, newPlan }) {
  if (!referredUserId) return null;
  if (newPlan === "free") return null;

  const db = getDb();
  const { data: row } = await db
    .from("referrals")
    .select("id, referrer_user_id, status")
    .eq("referred_user_id", referredUserId)
    .maybeSingle();

  if (!row) return null;
  if (row.status === "rewarded" || row.status === "cancelled" || row.status === "rejected") return null;

  await db
    .from("referrals")
    .update({
      status: "rewarded",
      qualified_at: new Date().toISOString(),
      rewarded_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  await db.from("referral_credits").insert({
    user_id: row.referrer_user_id,
    amount_cents: REFERRER_CREDIT_CENTS,
    reason: "referral_reward",
    referral_id: row.id,
  });

  await db
    .from("users")
    .update({ last_referral_activity_at: new Date().toISOString() })
    .eq("id", row.referrer_user_id);

  const { data: referrer } = await db
    .from("users")
    .select("email, name")
    .eq("id", row.referrer_user_id)
    .maybeSingle();

  if (referrer) {
    sendEmail({
      to: referrer.email,
      subject: `You earned a $${REFERRER_CREDIT_CENTS / 100} credit on BriefFill`,
      body: `Hi ${referrer.name},\n\nGreat news — the friend you referred just activated a paid plan. We've added a $${REFERRER_CREDIT_CENTS / 100} credit to your account, which will be applied automatically to your next invoice.\n\nKeep sharing to earn more: visit /dashboard/referrals.\n\n— The BriefFill team`,
    }).catch((err) => console.error("Referral reward email failed:", err.message));
  }

  return { referralId: row.id, referrerUserId: row.referrer_user_id, creditCents: REFERRER_CREDIT_CENTS };
}

async function getReferralStats(userId) {
  const db = getDb();
  const code = await ensureReferralCode(userId);

  const { data: invitees } = await db
    .from("referrals")
    .select("id, referred_user_id, status, referrer_credit_cents, friend_reward, created_at, qualified_at, rewarded_at, users!inner(email, name, created_at)")
    .eq("referrer_user_id", userId)
    .order("created_at", { ascending: false });

  const { data: creditRows } = await db
    .from("referral_credits")
    .select("amount_cents")
    .eq("user_id", userId);

  const { count: pendingCredits } = await db
    .from("referrals")
    .select("*", { count: "exact", head: true })
    .eq("referrer_user_id", userId)
    .in("status", ["signed_up"]);

  const list = invitees || [];

  return {
    code,
    link: buildReferralLink(code),
    totals: {
      invited: list.length,
      signedUp: list.filter((r) => ["signed_up", "paid", "rewarded"].includes(r.status)).length,
      paid: list.filter((r) => ["paid", "rewarded"].includes(r.status)).length,
      rewarded: list.filter((r) => r.status === "rewarded").length,
    },
    creditsEarnedCents: creditRows?.reduce((sum, r) => sum + (r.amount_cents || 0), 0) || 0,
    pendingRewards: pendingCredits || 0,
    invitees: list.map((row) => ({
      id: row.id,
      referredUserId: row.referred_user_id,
      status: row.status,
      creditCents: row.referrer_credit_cents,
      friendReward: row.friend_reward,
      createdAt: row.created_at,
      qualifiedAt: row.qualified_at,
      rewardedAt: row.rewarded_at,
      friendEmail: row.users?.email,
      friendName: row.users?.name,
      friendSignedUpAt: row.users?.created_at,
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
