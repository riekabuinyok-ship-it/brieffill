const { getDb, save } = require("../utils/db");

const DEFAULTS = {
  theme: "light",
  email_greeting: "Hi {clientName},",
  email_signoff: "Best regards,\n{name}",
  email_template: null,
  notifications_email_enabled: 1,
  notifications_brief_analysis: 1,
  notifications_team_invites: 1,
  notifications_portal_updates: 1,
  notifications_referral_rewards: 1,
  notifications_billing: 1,
  notifications_product_updates: 1,
  notifications_weekly_summary: 1,
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

exports.getPreferences = (req, res) => {
  const db = getDb();
  const result = db.exec(
    `SELECT theme, email_greeting, email_signoff, email_template, ${NOTIFICATION_COLS.join(", ")} FROM user_preferences WHERE user_id = ?`,
    [req.user.id]
  );
  const row = result[0]?.values?.[0];
  if (!row) return res.json({ preferences: DEFAULTS });

  const prefs = {
    theme: row[0] || DEFAULTS.theme,
    email_greeting: row[1] || DEFAULTS.email_greeting,
    email_signoff: row[2] || DEFAULTS.email_signoff,
    email_template: row[3] || DEFAULTS.email_template,
  };
  for (let i = 0; i < NOTIFICATION_COLS.length; i++) {
    prefs[NOTIFICATION_COLS[i]] = row[4 + i] ?? DEFAULTS[NOTIFICATION_COLS[i]];
  }
  res.json({ preferences: prefs });
};

exports.updatePreferences = (req, res) => {
  const { theme, email_greeting, email_signoff, email_template } = req.body;

  const notifVals = {};
  for (const col of NOTIFICATION_COLS) {
    if (req.body[col] !== undefined) {
      notifVals[col] = req.body[col] ? 1 : 0;
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
  const existing = db.exec("SELECT user_id FROM user_preferences WHERE user_id = ?", [req.user.id]);
  const exists = existing[0]?.values?.[0];

  if (exists) {
    const setClauses = Object.keys(payload).map((k) => `${k} = ?`).join(", ");
    db.run(`UPDATE user_preferences SET ${setClauses} WHERE user_id = ?`, [...Object.values(payload), req.user.id]);
  } else {
    const cols = ["user_id", ...Object.keys(payload)];
    const placeholders = cols.map(() => "?").join(", ");
    db.run(`INSERT INTO user_preferences (${cols.join(", ")}) VALUES (${placeholders})`, [req.user.id, ...Object.values(payload)]);
  }
  save();

  res.json({ success: true });
};
