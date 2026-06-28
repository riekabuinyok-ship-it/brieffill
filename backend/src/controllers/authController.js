const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getDb } = require("../utils/db");
const { getUserBilling, getPlan } = require("../services/billingService");
const { attributeReferralOnSignup } = require("../services/referralService");

async function billingShape(userId, fallbackSubscriptionStatus) {
  const b = await getUserBilling(userId);
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
    const { data: existing } = await db.from("users").select("id").eq("email", email).maybeSingle();
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const requestedLocale = typeof req.body?.locale === "string" ? req.body.locale : null;
    const initialLocale = requestedLocale && SUPPORTED_LOCALES.includes(requestedLocale) ? requestedLocale : "en";
    const { data: newUser, error: insertErr } = await db
      .from("users")
      .insert({ email, name, password_hash: passwordHash, trial_end_date: trialEnd, locale: initialLocale })
      .select()
      .single();
    if (insertErr) throw insertErr;
    const id = newUser.id;
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
        billing: await billingShape(id, "free_trial"),
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
    const { data: row } = await db
      .from("users")
      .select("id, email, name, password_hash, locale")
      .eq("email", email)
      .maybeSingle();

    if (!row) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, row.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ id: row.id, email: row.email, name: row.name }, SECRET, { expiresIn: "7d" });
    res.json({
      token,
      user: {
        id: row.id,
        email: row.email,
        name: row.name,
        locale: row.locale || "en",
        billing: await billingShape(row.id, "active"),
      },
    });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
};

exports.me = async (req, res) => {
  const db = getDb();
  const { data: row, error } = await db
    .from("users")
    .select("*")
    .eq("id", req.user.id)
    .single();
  if (error || !row) {
    return res.status(404).json({ error: "User not found" });
  }

  let socialLinks = {};
  try { socialLinks = row.social_links || {}; } catch { }

  res.json({
    user: {
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: row.created_at,
      subscriptionStatus: row.subscription_status,
      trialEndDate: row.trial_end_date,
      locale: row.locale || "en",
      avatarUrl: row.avatar_url || null,
      firstName: row.first_name || "",
      lastName: row.last_name || "",
      displayName: row.display_name || row.name || "",
      bio: row.bio || "",
      company: row.company || "",
      jobTitle: row.job_title || "",
      location: row.location || "",
      website: row.website || "",
      socialLinks,
      totpEnabled: !!row.totp_enabled,
      passwordChangedAt: row.password_changed_at || null,
      billing: await billingShape(row.id, row.subscription_status),
    },
  });
};

exports.updateMe = async (req, res) => {
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
      updates.social_links = sl;
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No supported fields to update" });
  }

  if (updates.locale && !SUPPORTED_LOCALES.includes(updates.locale)) {
    return res.status(400).json({ error: "Unsupported locale" });
  }

  const { error: updateErr } = await db.from("users").update(updates).eq("id", req.user.id);
  if (updateErr) throw updateErr;
  exports.me(req, res);
};

exports.uploadAvatar = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  const db = getDb();
  await db.from("users").update({ avatar_url: avatarUrl }).eq("id", req.user.id);
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
    const { data: row } = await db.from("users").select("password_hash").eq("id", req.user.id).maybeSingle();
    if (!row) {
      return res.status(404).json({ error: "User not found" });
    }

    const valid = await bcrypt.compare(currentPassword, row.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await db.from("users").update({ password_hash: passwordHash, password_changed_at: new Date().toISOString() }).eq("id", req.user.id);
    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("changePassword error:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
};

exports.setup2fa = async (req, res) => {
  try {
    const db = getDb();
    const { data: row } = await db.from("users").select("totp_secret, totp_enabled").eq("id", req.user.id).maybeSingle();
    if (!row) {
      return res.status(404).json({ error: "User not found" });
    }

    if (row.totp_enabled) {
      return res.status(400).json({ error: "2FA is already enabled. Disable it first to reconfigure." });
    }

    const otplib = require("otplib");
    const secret = otplib.generateSecret();
    const otpauth = otplib.generateURI({ type: "totp", issuer: "BriefFill", label: req.user.email, secret });

    await db.from("users").update({ totp_secret: secret }).eq("id", req.user.id);

    res.json({ secret, otpauth });
  } catch (err) {
    console.error("setup2fa error:", err);
    res.status(500).json({ error: "Failed to setup 2FA" });
  }
};

exports.verify2fa = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: "Verification token is required" });
    }

    const db = getDb();
    const { data: row } = await db.from("users").select("totp_secret").eq("id", req.user.id).maybeSingle();
    if (!row) {
      return res.status(404).json({ error: "User not found" });
    }

    const secret = row.totp_secret;
    if (!secret) {
      return res.status(400).json({ error: "2FA has not been set up. Call setup first." });
    }

    const otplib = require("otplib");
    const isValid = otplib.verify({ token, secret });
    if (!isValid) {
      return res.status(401).json({ error: "Invalid verification code" });
    }

    await db.from("users").update({ totp_enabled: true }).eq("id", req.user.id);
    res.json({ success: true, message: "2FA enabled successfully" });
  } catch (err) {
    console.error("verify2fa error:", err);
    res.status(500).json({ error: "Failed to verify 2FA" });
  }
};

exports.disable2fa = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: "Password is required to disable 2FA" });
    }

    const db = getDb();
    const { data: row } = await db.from("users").select("password_hash").eq("id", req.user.id).maybeSingle();
    if (!row) {
      return res.status(404).json({ error: "User not found" });
    }

    const valid = bcrypt.compareSync(password, row.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Password is incorrect" });
    }

    await db.from("users").update({ totp_secret: null, totp_enabled: false }).eq("id", req.user.id);
    res.json({ success: true, message: "2FA disabled" });
  } catch (err) {
    console.error("disable2fa error:", err);
    res.status(500).json({ error: "Failed to disable 2FA" });
  }
};

exports.getSessions = async (req, res) => {
  try {
    const db = getDb();
    const { data: rows, error } = await db
      .from("user_sessions")
      .select("id, user_agent, ip_address, last_active_at, created_at")
      .eq("user_id", req.user.id)
      .order("last_active_at", { ascending: false });

    if (error) throw error;
    const sessions = (rows || []).map((row) => ({
      id: row.id,
      userAgent: row.user_agent || "",
      ipAddress: row.ip_address || "",
      lastActiveAt: row.last_active_at,
      createdAt: row.created_at,
    }));

    res.json({ sessions });
  } catch (err) {
    console.error("getSessions error:", err);
    res.status(500).json({ error: "Failed to load sessions" });
  }
};

exports.revokeSession = async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id, 10);
    if (!Number.isFinite(sessionId) || sessionId <= 0) {
      return res.status(400).json({ error: "Invalid session id" });
    }

    const db = getDb();
    const { data: session } = await db.from("user_sessions").select("id").eq("id", sessionId).eq("user_id", req.user.id).maybeSingle();
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    await db.from("user_sessions").delete().eq("id", sessionId);
    res.json({ success: true });
  } catch (err) {
    console.error("revokeSession error:", err);
    res.status(500).json({ error: "Failed to revoke session" });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: "Password is required to delete your account" });
    }

    const db = getDb();
    const { data: row } = await db.from("users").select("password_hash").eq("id", req.user.id).maybeSingle();
    if (!row) {
      return res.status(404).json({ error: "User not found" });
    }

    const valid = bcrypt.compareSync(password, row.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Password is incorrect" });
    }

    await db.from("users").delete().eq("id", req.user.id);
    res.json({ success: true, message: "Account permanently deleted" });
  } catch (err) {
    console.error("deleteAccount error:", err);
    res.status(500).json({ error: "Failed to delete account" });
  }
};
