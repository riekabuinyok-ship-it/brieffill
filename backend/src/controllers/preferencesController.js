const { getDb } = require("../utils/db");

const DEFAULTS = {
  theme: "light",
  email_greeting: "Hi {clientName},",
  email_signoff: "Best regards,\n{name}",
  email_template: null,
  notifications_email_enabled: true,
  notifications_brief_analysis: true,
  notifications_team_invites: true,
  notifications_portal_updates: true,
  notifications_referral_rewards: true,
  notifications_billing: true,
  notifications_product_updates: true,
  notifications_weekly_summary: true,
};

const NOTIFICATION_COLS = [
  "notifications_email_enabled",
  "notifications_brief_analysis",
  "notifications_team_invites",
  "notifications_portal_updates",
  "notifications_referral_rewards",
  "notifications_billing",
  "notifications_product_updates",
  "notifications_weekly_summary",
];

exports.getPreferences = async (req, res) => {
  const db = getDb();
  const { data: row, error } = await db
    .from("user_preferences")
    .select("theme, email_greeting, email_signoff, email_template, " + NOTIFICATION_COLS.join(", "))
    .eq("user_id", req.user.id)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!row) return res.json({ preferences: DEFAULTS });

  const prefs = {
    theme: row.theme || DEFAULTS.theme,
    email_greeting: row.email_greeting || DEFAULTS.email_greeting,
    email_signoff: row.email_signoff || DEFAULTS.email_signoff,
    email_template: row.email_template || DEFAULTS.email_template,
  };
  for (const col of NOTIFICATION_COLS) {
    prefs[col] = row[col] ?? DEFAULTS[col];
  }
  res.json({ preferences: prefs });
};

exports.updatePreferences = async (req, res) => {
  const { theme, email_greeting, email_signoff, email_template } = req.body;

  const notifVals = {};
  for (const col of NOTIFICATION_COLS) {
    if (req.body[col] !== undefined) {
      notifVals[col] = !!req.body[col];
    }
  }

  const payload = {
    theme: theme || DEFAULTS.theme,
    email_greeting: email_greeting || DEFAULTS.email_greeting,
    email_signoff: email_signoff || DEFAULTS.email_signoff,
    email_template: email_template || null,
    updated_at: new Date().toISOString(),
  };
  for (const col of NOTIFICATION_COLS) {
    payload[col] = notifVals[col] !== undefined ? notifVals[col] : DEFAULTS[col];
  }

  const db = getDb();
  const { data: existing, error: exErr } = await db
    .from("user_preferences")
    .select("user_id")
    .eq("user_id", req.user.id)
    .maybeSingle();
  if (exErr) return res.status(500).json({ error: exErr.message });

  if (existing) {
    const { error: uErr } = await db
      .from("user_preferences")
      .update(payload)
      .eq("user_id", req.user.id);
    if (uErr) return res.status(500).json({ error: uErr.message });
  } else {
    const { error: iErr } = await db
      .from("user_preferences")
      .insert({ user_id: req.user.id, ...payload });
    if (iErr) return res.status(500).json({ error: iErr.message });
  }

  res.json({ success: true });
};
