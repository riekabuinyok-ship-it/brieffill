// BriefFill — Referral lifecycle email cron.
// Called by POST /api/referrals/cron/run (header-protected).
//
//   1. Onboarding email: sent 3-5 days after signup, ONLY if the user has
//      not yet made a referral. The email is one-shot (tracked via
//      users.onboarding_email_sent_at).
//
//   2. Reactivation email: sent to users who have made >= 1 successful
//      referral in the past but have not had any referral activity in the
//      last 30 days. Capped to once every 30 days (tracked via
//      users.reactivation_email_sent_at).
//
// No real SMTP in dev: emails are logged to stdout by emailService.sendEmail.

const { getDb } = require("../utils/db");
const { sendEmail } = require("./emailService");
const { getReferralCode, buildReferralLink } = require("./referralService");

const ONBOARDING_DELAY_DAYS = 3;
const ONBOARDING_MAX_DAYS = 5;
const REACTIVATION_INACTIVITY_DAYS = 30;
const REFEREE_REWARD = "1 month free Pro";
const REFERRER_REWARD_DOLLARS = 10;

function daysAgoIso(days) {
  return new Date(Date.now() - days * 86400000).toISOString();
}

async function sendOnboardingEmails() {
  const db = getDb();
  const minDate = daysAgoIso(ONBOARDING_MAX_DAYS);
  const maxDate = daysAgoIso(ONBOARDING_DELAY_DAYS);

  const { data: referrers } = await db.from("referrals").select("referrer_user_id");
  const referrerIds = [...new Set((referrers || []).map((r) => r.referrer_user_id))];

  let query = db
    .from("users")
    .select("id, email, name, created_at")
    .is("onboarding_email_sent_at", null)
    .lte("created_at", maxDate)
    .gte("created_at", minDate)
    .limit(100);

  if (referrerIds.length > 0) {
    query = query.not("id", "in", referrerIds);
  }

  const { data: rows } = await query;
  const candidates = rows?.length || 0;
  let sent = 0;

  for (const row of rows || []) {
    const code = await getReferralCode(row.id);
    if (!code) continue;
    const link = buildReferralLink(code);
    try {
      await sendEmail({
        to: row.email,
        subject: `Know a freelancer who'd love BriefFill? Get $${REFERRER_REWARD_DOLLARS} for each referral`,
        body:
          `Hi ${row.name},\n\n` +
          `It's been a few days since you joined BriefFill — hope it's saving you time on client briefs.\n\n` +
          `Quick favor: if you know another freelancer or agency lead who'd find this useful, send them your referral link:\n\n` +
          `  ${link}\n\n` +
          `When they sign up and activate a paid plan, you get $${REFERRER_REWARD_DOLLARS} in account credit, and they get ${REFEREE_REWARD}.\n\n` +
          `Thanks for being a customer.\n\n— The BriefFill team`,
      });
      await db
        .from("users")
        .update({ onboarding_email_sent_at: new Date().toISOString() })
        .eq("id", row.id);
      sent++;
    } catch (err) {
      console.error("onboarding email failed:", err.message);
    }
  }

  return { candidates, sent };
}

async function sendReactivationEmails() {
  const db = getDb();
  const inactivityCutoff = daysAgoIso(REACTIVATION_INACTIVITY_DAYS);
  const reactivationCutoff = daysAgoIso(REACTIVATION_INACTIVITY_DAYS);

  const { data: referrers } = await db.from("referrals").select("referrer_user_id");
  const referrerIds = [...new Set((referrers || []).map((r) => r.referrer_user_id))];
  if (referrerIds.length === 0) return { candidates: 0, sent: 0 };

  const { data: rows } = await db
    .from("users")
    .select("id, email, name")
    .in("id", referrerIds)
    .or(`last_referral_activity_at.lte.${inactivityCutoff},and(last_referral_activity_at.is.null,reactivation_email_sent_at.is.null,created_at.lte.${reactivationCutoff})`)
    .limit(100);

  const candidates = rows?.length || 0;
  let sent = 0;

  for (const row of rows || []) {
    const code = await getReferralCode(row.id);
    if (!code) continue;
    const link = buildReferralLink(code);
    try {
      await sendEmail({
        to: row.email,
        subject: "Still sharing BriefFill? Here's a reminder of your referral link",
        body:
          `Hi ${row.name},\n\n` +
          `You've referred at least one friend to BriefFill in the past — thanks for the word-of-mouth!\n\n` +
          `Your referral link is still live:\n\n` +
          `  ${link}\n\n` +
          `Earn $${REFERRER_REWARD_DOLLARS} in credit for each friend who becomes a paid subscriber, and they get ${REFEREE_REWARD}.\n\n` +
          `— The BriefFill team`,
      });
      await db
        .from("users")
        .update({ reactivation_email_sent_at: new Date().toISOString() })
        .eq("id", row.id);
      sent++;
    } catch (err) {
      console.error("reactivation email failed:", err.message);
    }
  }

  return { candidates, sent };
}

async function runReferralCron() {
  const onboarding = await sendOnboardingEmails();
  const reactivation = await sendReactivationEmails();
  return { onboarding, reactivation };
}

module.exports = { runReferralCron };
