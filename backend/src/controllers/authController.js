const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getDb, save } = require("../utils/db");
const { getUserBilling, getPlan } = require("../services/billingService");
const { attributeReferralOnSignup } = require("../services/referralService");

function billingShape(userId, fallbackSubscriptionStatus) {
  const b = getUserBilling(userId);
  if (!b) return null;
  return {
    plan: b.plan,
    planName: b.planName,
    status: b.status || fallbackSubscriptionStatus,
    briefsUsed: b.briefsUsed,
    briefLimit: b.briefLimit,
    currentPeriodEnd: b.currentPeriodEnd,
    cancelAtPeriodEnd: b.cancelAtPeriodEnd,
    trialEndDate: b.trialEndDate,
  };
}

const SECRET = process.env.JWT_SECRET || "your-secret-key-here";
const SALT_ROUNDS = 10;
const SUPPORTED_LOCALES = ["en", "es", "fr", "de", "pt-BR", "it", "nl", "ja", "ko", "zh-CN", "ar"];

exports.register = async (req, res) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password) {
      return res.status(400).json({ error: "email, name, and password are required" });
    }

    const db = getDb();
    const existing = db.exec(`SELECT id FROM users WHERE email = '${email.replace(/'/g, "''")}'`);
    if (existing[0]?.values.length) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace("T", " ");
    const requestedLocale = typeof req.body?.locale === "string" ? req.body.locale : null;
    const initialLocale = requestedLocale && SUPPORTED_LOCALES.includes(requestedLocale) ? requestedLocale : "en";
    db.run("INSERT INTO users (email, name, password_hash, trial_end_date, locale) VALUES (?, ?, ?, ?, ?)", [email, name, passwordHash, trialEnd, initialLocale]);
    const id = db.exec("SELECT last_insert_rowid() AS id")[0].values[0][0];
    save();
    const token = jwt.sign({ id, email, name }, SECRET, { expiresIn: "7d" });

    const referralCode = (req.body?.ref || req.body?.referralCode || "").toString();
    const ipAddress = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").toString().split(",")[0].trim();
    const referralResult = attributeReferralOnSignup({
      referredUserId: id,
      referredEmail: email,
      referralCode,
      ipAddress,
    });

    res.status(201).json({
      token,
      user: {
        id, email, name,
        subscriptionStatus: "free_trial",
        trialEndDate: trialEnd,
        locale: initialLocale,
        billing: billingShape(id, "free_trial"),
        referredBy: referralResult ? { referrerId: referralResult.referrerId, friendReward: referralResult.friendReward } : null,
      },
    });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const db = getDb();
    const result = db.exec(`SELECT id, email, name, password_hash, locale FROM users WHERE email = '${email.replace(/'/g, "''")}'`);

    if (!result[0]?.values.length) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const row = result[0].values[0];
    const valid = await bcrypt.compare(password, row[3]);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ id: row[0], email: row[1], name: row[2] }, SECRET, { expiresIn: "7d" });
    res.json({
      token,
      user: {
        id: row[0],
        email: row[1],
        name: row[2],
        locale: row[4] || "en",
        billing: billingShape(row[0], "active"),
      },
    });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
};

exports.me = (req, res) => {
  const db = getDb();
  const result = db.exec(`SELECT id, email, name, created_at, subscription_status, trial_end_date, locale, avatar_url, first_name, last_name, display_name, bio, company, job_title, location, website, social_links, totp_enabled, password_changed_at FROM users WHERE id = ${req.user.id}`);

  if (!result[0]?.values.length) {
    return res.status(404).json({ error: "User not found" });
  }

  const row = result[0].values[0];
  let socialLinks = {};
  try { socialLinks = row[16] ? JSON.parse(row[16]) : {}; } catch { /* ignore */ }
  res.json({
    user: {
      id: row[0],
      email: row[1],
      name: row[2],
      createdAt: row[3],
      subscriptionStatus: row[4],
      trialEndDate: row[5],
      locale: row[6] || "en",
      avatarUrl: row[7] || null,
      firstName: row[8] || "",
      lastName: row[9] || "",
      displayName: row[10] || row[2] || "",
      bio: row[11] || "",
      company: row[12] || "",
      jobTitle: row[13] || "",
      location: row[14] || "",
      website: row[15] || "",
      socialLinks,
      totpEnabled: !!row[17],
      passwordChangedAt: row[18] || null,
      billing: billingShape(row[0], row[4]),
    },
  });
};

exports.updateMe = (req, res) => {
  const db = getDb();
  const updates = {};

  const STRING_FIELDS = {
    locale: { max: 10 },
    name: { max: 80 },
    first_name: { max: 50 },
    last_name: { max: 50 },
    display_name: { max: 80 },
    bio: { max: 200 },
    company: { max: 100 },
    job_title: { max: 100 },
    location: { max: 100 },
    website: { max: 500 },
    avatar_url: { max: 1000 },
  };

  for (const [field, opts] of Object.entries(STRING_FIELDS)) {
    if (req.body[field] !== undefined) {
      const val = String(req.body[field]).trim();
      if (val.length <= opts.max) {
        updates[field] = val;
      }
    }
  }

  if (req.body.social_links !== undefined) {
    const sl = req.body.social_links;
    if (typeof sl === "object" && sl !== null) {
      updates.social_links = JSON.stringify(sl);
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No supported fields to update" });
  }

  if (updates.locale && !SUPPORTED_LOCALES.includes(updates.locale)) {
    return res.status(400).json({ error: "Unsupported locale" });
  }

  const sets = Object.keys(updates).map((k) => `${k} = ?`).join(", ");
  const vals = Object.values(updates);
  db.run(`UPDATE users SET ${sets} WHERE id = ?`, [...vals, req.user.id]);
  save();
  exports.me(req, res);
};

exports.uploadAvatar = (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  const db = getDb();
  db.run("UPDATE users SET avatar_url = ? WHERE id = ?", [avatarUrl, req.user.id]);
  save();
  res.json({ avatarUrl });
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }

    const db = getDb();
    const result = db.exec(`SELECT password_hash FROM users WHERE id = ${req.user.id}`);
    if (!result[0]?.values.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const valid = await bcrypt.compare(currentPassword, result[0].values[0][0]);
    if (!valid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    db.run("UPDATE users SET password_hash = ?, password_changed_at = datetime('now') WHERE id = ?", [passwordHash, req.user.id]);
    save();
    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("changePassword error:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
};

exports.setup2fa = (req, res) => {
  try {
    const db = getDb();
    const result = db.exec(`SELECT totp_secret, totp_enabled FROM users WHERE id = ${req.user.id}`);
    if (!result[0]?.values.length) {
      return res.status(404).json({ error: "User not found" });
    }

    if (result[0].values[0][1] === 1) {
      return res.status(400).json({ error: "2FA is already enabled. Disable it first to reconfigure." });
    }

    const otplib = require("otplib");
    const secret = otplib.generateSecret();
    const otpauth = otplib.generateURI({ type: "totp", issuer: "BriefFill", label: req.user.email, secret });

    db.run("UPDATE users SET totp_secret = ? WHERE id = ?", [secret, req.user.id]);
    save();

    res.json({ secret, otpauth });
  } catch (err) {
    console.error("setup2fa error:", err);
    res.status(500).json({ error: "Failed to setup 2FA" });
  }
};

exports.verify2fa = (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: "Verification token is required" });
    }

    const db = getDb();
    const result = db.exec(`SELECT totp_secret FROM users WHERE id = ${req.user.id}`);
    if (!result[0]?.values.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const secret = result[0].values[0][0];
    if (!secret) {
      return res.status(400).json({ error: "2FA has not been set up. Call setup first." });
    }

    const otplib = require("otplib");
    const isValid = otplib.verify({ token, secret });
    if (!isValid) {
      return res.status(401).json({ error: "Invalid verification code" });
    }

    db.run("UPDATE users SET totp_enabled = 1 WHERE id = ?", [req.user.id]);
    save();
    res.json({ success: true, message: "2FA enabled successfully" });
  } catch (err) {
    console.error("verify2fa error:", err);
    res.status(500).json({ error: "Failed to verify 2FA" });
  }
};

exports.disable2fa = (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: "Password is required to disable 2FA" });
    }

    const db = getDb();
    const result = db.exec(`SELECT password_hash FROM users WHERE id = ${req.user.id}`);
    if (!result[0]?.values.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const valid = bcrypt.compareSync(password, result[0].values[0][0]);
    if (!valid) {
      return res.status(401).json({ error: "Password is incorrect" });
    }

    db.run("UPDATE users SET totp_secret = NULL, totp_enabled = 0 WHERE id = ?", [req.user.id]);
    save();
    res.json({ success: true, message: "2FA disabled" });
  } catch (err) {
    console.error("disable2fa error:", err);
    res.status(500).json({ error: "Failed to disable 2FA" });
  }
};

exports.getSessions = (req, res) => {
  try {
    const db = getDb();
    const rows = db.exec(
      `SELECT id, user_agent, ip_address, last_active_at, created_at FROM user_sessions WHERE user_id = ${req.user.id} ORDER BY last_active_at DESC`
    );

    const sessions = (rows[0]?.values || []).map((row) => ({
      id: row[0],
      userAgent: row[1] || "",
      ipAddress: row[2] || "",
      lastActiveAt: row[3],
      createdAt: row[4],
    }));

    res.json({ sessions });
  } catch (err) {
    console.error("getSessions error:", err);
    res.status(500).json({ error: "Failed to load sessions" });
  }
};

exports.revokeSession = (req, res) => {
  try {
    const sessionId = parseInt(req.params.id, 10);
    if (!Number.isFinite(sessionId) || sessionId <= 0) {
      return res.status(400).json({ error: "Invalid session id" });
    }

    const db = getDb();
    const result = db.exec(`SELECT id FROM user_sessions WHERE id = ${sessionId} AND user_id = ${req.user.id}`);
    if (!result[0]?.values.length) {
      return res.status(404).json({ error: "Session not found" });
    }

    db.run("DELETE FROM user_sessions WHERE id = ?", [sessionId]);
    save();
    res.json({ success: true });
  } catch (err) {
    console.error("revokeSession error:", err);
    res.status(500).json({ error: "Failed to revoke session" });
  }
};

exports.deleteAccount = (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: "Password is required to delete your account" });
    }

    const db = getDb();
    const result = db.exec(`SELECT password_hash FROM users WHERE id = ${req.user.id}`);
    if (!result[0]?.values.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const valid = bcrypt.compareSync(password, result[0].values[0][0]);
    if (!valid) {
      return res.status(401).json({ error: "Password is incorrect" });
    }

    db.run("DELETE FROM users WHERE id = ?", [req.user.id]);
    save();
    res.json({ success: true, message: "Account permanently deleted" });
  } catch (err) {
    console.error("deleteAccount error:", err);
    res.status(500).json({ error: "Failed to delete account" });
  }
};
