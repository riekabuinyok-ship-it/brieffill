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
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 19).replace("T", " ");
}

function runReferralCron() {
  const db = getDb();
  const onboarding = sendOnboardingEmails(db);
  const reactivation = sendReactivationEmails(db);
  return { onboarding, reactivation };
}

function sendOnboardingEmails(db) {
  const minDate = daysAgoIso(ONBOARDING_MAX_DAYS);
  const maxDate = daysAgoIso(ONBOARDING_DELAY_DAYS);
  const rows = db.exec(
    `SELECT id, email, name, created_at FROM users
     WHERE onboarding_email_sent_at IS NULL
       AND created_at <= ?
       AND created_at >= ?
       AND id NOT IN (SELECT referrer_user_id FROM referrals)
     LIMIT 100`,
    [minDate, maxDate]
  )[0]?.values || [];

  let sent = 0;
  for (const [id, email, name, createdAt] of rows) {
    const code = getReferralCode(id);
    if (!code) continue;
    const link = buildReferralLink(code);
    sendEmail({
      to: email,
      subject: `Know a freelancer who'd love BriefFill? Get $${REFERRER_REWARD_DOLLARS} for each referral`,
      body:
        `Hi ${name},\n\n` +
        `It's been a few days since you joined BriefFill — hope it's saving you time on client briefs.\n\n` +
        `Quick favor: if you know another freelancer or agency lead who'd find this useful, send them your referral link:\n\n` +
        `  ${link}\n\n` +
        `When they sign up and activate a paid plan, you get $${REFERRER_REWARD_DOLLARS} in account credit, and they get ${REFEREE_REWARD}.\n\n` +
        `Thanks for being a customer.\n\n— The BriefFill team`,
    })
      .then(() => {
        const d = getDb();
        d.run("UPDATE users SET onboarding_email_sent_at = datetime('now') WHERE id = ?", [id]);
      })
      .catch((err) => console.error("onboarding email failed:", err.message));
    sent++;
  }
  return { candidates: rows.length, sent };
}

function sendReactivationEmails(db) {
  const inactivityCutoff = daysAgoIso(REACTIVATION_INACTIVITY_DAYS);
  const reactivationCutoff = daysAgoIso(REACTIVATION_INACTIVITY_DAYS);
  const rows = db.exec(
    `SELECT u.id, u.email, u.name, u.last_referral_activity_at,
            (SELECT COUNT(*) FROM referrals WHERE referrer_user_id = u.id) AS total_referrals
     FROM users u
     WHERE (u.last_referral_activity_at IS NOT NULL AND u.last_referral_activity_at <= ?)
        OR (u.last_referral_activity_at IS NULL
            AND u.reactivation_email_sent_at IS NULL
            AND u.created_at <= ?
            AND (SELECT COUNT(*) FROM referrals WHERE referrer_user_id = u.id) > 0)
     LIMIT 100`,
    [inactivityCutoff, reactivationCutoff]
  )[0]?.values || [];

  let sent = 0;
  for (const [id, email, name] of rows) {
    const code = getReferralCode(id);
    if (!code) continue;
    const link = buildReferralLink(code);
    sendEmail({
      to: email,
      subject: `Still sharing BriefFill? Here's a reminder of your referral link`,
      body:
        `Hi ${name},\n\n` +
        `You've referred at least one friend to BriefFill in the past — thanks for the word-of-mouth!\n\n` +
        `Your referral link is still live:\n\n` +
        `  ${link}\n\n` +
        `Earn $${REFERRER_REWARD_DOLLARS} in credit for each friend who becomes a paid subscriber, and they get ${REFEREE_REWARD}.\n\n` +
        `— The BriefFill team`,
    })
      .then(() => {
        const d = getDb();
        d.run("UPDATE users SET reactivation_email_sent_at = datetime('now') WHERE id = ?", [id]);
      })
      .catch((err) => console.error("reactivation email failed:", err.message));
    sent++;
  }
  return { candidates: rows.length, sent };
}

module.exports = { runReferralCron };
