const path = require("path");
const fs = require("fs");
const initSqlJs = require("sql.js");

const dbPath = process.env.DB_PATH || path.join(__dirname, "..", "..", "..", "database", "brieffill.db");
const schemaPath = path.join(__dirname, "..", "..", "..", "database", "schema.sql");

let db;

async function init() {
  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run("PRAGMA foreign_keys = ON");

  const result = db.exec("SELECT count(*) AS cnt FROM sqlite_master WHERE type='table'");
  if (!result[0] || result[0].values[0][0] === 0) {
    const schema = fs.readFileSync(schemaPath, "utf-8");
    db.run(schema);
    console.log("Database schema initialized.");
  }

  // Migration: older DBs have CHECK (role IN ('admin', 'viewer')) — rebuild the
  // team_members and team_invites tables to accept 'editor' as well. We
  // detect by inspecting the table's CREATE statement; if it doesn't mention
  // 'editor', we rebuild the table while preserving data.
  migrateRoleEnum("team_members");
  migrateRoleEnum("team_invites");

  // Additive column migrations for users table.
  ensureColumn("users", "locale", "TEXT DEFAULT 'en'");
  ensureColumn("users", "avatar_url", "TEXT");
  ensureColumn("users", "first_name", "TEXT");
  ensureColumn("users", "last_name", "TEXT");
  ensureColumn("users", "display_name", "TEXT");
  ensureColumn("users", "bio", "TEXT");
  ensureColumn("users", "company", "TEXT");
  ensureColumn("users", "job_title", "TEXT");
  ensureColumn("users", "location", "TEXT");
  ensureColumn("users", "website", "TEXT");
  ensureColumn("users", "social_links", "TEXT");

  // Additive migrations for tables added after the initial schema was deployed.
  ensureTable("brief_outcomes", `CREATE TABLE IF NOT EXISTS brief_outcomes (
    brief_id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    status TEXT NOT NULL CHECK (status IN ('success', 'failure', 'in_progress')),
    notes TEXT,
    created_at DATETIME DEFAULT (datetime('now')),
    updated_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (brief_id) REFERENCES briefs(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  ensureTable("competitor_analyses", `CREATE TABLE IF NOT EXISTS competitor_analyses (
    brief_id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    competitors JSON NOT NULL,
    common_strengths JSON NOT NULL,
    common_gaps JSON NOT NULL,
    opportunity TEXT NOT NULL,
    created_at DATETIME DEFAULT (datetime('now')),
    updated_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (brief_id) REFERENCES briefs(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  ensureTable("user_integrations", `CREATE TABLE IF NOT EXISTS user_integrations (
    user_id INTEGER NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('notion', 'clickup', 'airtable', 'webhook')),
    api_key TEXT,
    target_id TEXT,
    target_id_2 TEXT,
    webhook_url TEXT,
    webhook_events JSON,
    updated_at DATETIME DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, provider),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  ensureTable("webhook_deliveries", `CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    event TEXT NOT NULL,
    url TEXT NOT NULL,
    status_code INTEGER,
    response_snippet TEXT,
    duration_ms INTEGER,
    error TEXT,
    created_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  ensureTable("user_api_keys", `CREATE TABLE IF NOT EXISTS user_api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    last_used_at DATETIME,
    created_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  // === Billing columns on users (additive ALTER for existing DBs) ===
  ensureColumn("users", "plan", "TEXT DEFAULT 'free'");
  ensureColumn("users", "stripe_customer_id", "TEXT");
  ensureColumn("users", "stripe_subscription_id", "TEXT");
  ensureColumn("users", "brief_count_this_month", "INTEGER DEFAULT 0");
  ensureColumn("users", "brief_count_month", "TEXT");
  ensureColumn("users", "current_period_end", "DATETIME");
  ensureColumn("users", "cancel_at_period_end", "INTEGER DEFAULT 0");

  // === Referral columns on users (additive ALTER for existing DBs) ===
  // SQLite cannot add a UNIQUE constraint via ALTER TABLE ADD COLUMN, so add
  // the column plain and then ensure a unique index exists.
  ensureColumn("users", "referral_code", "TEXT");
  ensureUniqueIndex("users", "idx_users_referral_code", "referral_code");
  ensureColumn("users", "referred_by_user_id", "INTEGER");
  ensureColumn("users", "onboarding_email_sent_at", "DATETIME");
  ensureColumn("users", "reactivation_email_sent_at", "DATETIME");
  ensureColumn("users", "last_referral_activity_at", "DATETIME");

  // === Account & Security columns ===
  ensureColumn("users", "password_changed_at", "DATETIME");
  ensureColumn("users", "totp_secret", "TEXT");
  ensureColumn("users", "totp_enabled", "INTEGER DEFAULT 0");

  // Team settings columns
  ensureColumn("teams", "description", "TEXT");
  ensureColumn("teams", "logo_url", "TEXT");

  // Notification preference columns on user_preferences
  ensureColumn("user_preferences", "notifications_email_enabled", "INTEGER DEFAULT 1");
  ensureColumn("user_preferences", "notifications_brief_analysis", "INTEGER DEFAULT 1");
  ensureColumn("user_preferences", "notifications_team_invites", "INTEGER DEFAULT 1");
  ensureColumn("user_preferences", "notifications_portal_updates", "INTEGER DEFAULT 1");
  ensureColumn("user_preferences", "notifications_referral_rewards", "INTEGER DEFAULT 1");
  ensureColumn("user_preferences", "notifications_billing", "INTEGER DEFAULT 1");
  ensureColumn("user_preferences", "notifications_product_updates", "INTEGER DEFAULT 1");
  ensureColumn("user_preferences", "notifications_weekly_summary", "INTEGER DEFAULT 1");

  // Industry column on briefs for dashboard breakdown
  ensureColumn("briefs", "industry", "TEXT");

  ensureTable("user_sessions", `CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    last_active_at DATETIME DEFAULT (datetime('now')),
    created_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  // Backfill plan column from legacy subscription_status values
  migratePlanColumn();
  // Backfill referral codes for any existing users that don't have one
  backfillReferralCodes();

  // === Collaboration Portal tables ===
  ensureTable("collaboration_portals", `CREATE TABLE IF NOT EXISTS collaboration_portals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brief_id INTEGER NOT NULL REFERENCES briefs(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    view_count INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    last_activity DATETIME,
    created_at DATETIME DEFAULT (datetime('now')),
    expires_at DATETIME
  )`);

  ensureTable("portal_responses", `CREATE TABLE IF NOT EXISTS portal_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portal_id INTEGER NOT NULL REFERENCES collaboration_portals(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    response TEXT,
    created_at DATETIME DEFAULT (datetime('now')),
    updated_at DATETIME DEFAULT (datetime('now'))
  )`);

  ensureTable("portal_files", `CREATE TABLE IF NOT EXISTS portal_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portal_id INTEGER NOT NULL REFERENCES collaboration_portals(id) ON DELETE CASCADE,
    field_name TEXT,
    file_name TEXT NOT NULL,
    stored_name TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    uploaded_at DATETIME DEFAULT (datetime('now'))
  )`);

  // === Invoices table ===
  ensureTable("invoices", `CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    stripe_invoice_id TEXT UNIQUE,
    amount INTEGER,
    currency TEXT DEFAULT 'usd',
    status TEXT,
    invoice_pdf TEXT,
    period_start DATETIME,
    period_end DATETIME,
    created_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  // === Referrals table ===
  ensureTable("referrals", `CREATE TABLE IF NOT EXISTS referrals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referrer_user_id INTEGER NOT NULL,
    referred_user_id INTEGER NOT NULL UNIQUE,
    referral_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_signup' CHECK (status IN ('pending_signup', 'signed_up', 'paid', 'rewarded', 'cancelled', 'rejected')),
    referrer_credit_cents INTEGER DEFAULT 1000,
    friend_reward TEXT,
    created_at DATETIME DEFAULT (datetime('now')),
    qualified_at DATETIME,
    rewarded_at DATETIME,
    cancelled_at DATETIME,
    rejected_reason TEXT,
    ip_address TEXT,
    FOREIGN KEY (referrer_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (referred_user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  ensureIndex("idx_referrals_referrer", "CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_user_id)");
  ensureIndex("idx_referrals_code", "CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code)");
  ensureIndex("idx_referral_credits_user", "CREATE INDEX IF NOT EXISTS idx_referral_credits_user ON referral_credits(user_id)");

  // === user_api_keys columns (additive for existing tables) ===
  ensureColumn("user_api_keys", "is_active", "INTEGER DEFAULT 1");
  ensureColumn("user_api_keys", "key_prefix", "TEXT");
  ensureColumn("user_api_keys", "revoked_at", "DATETIME");

  ensureTable("referral_credits", `CREATE TABLE IF NOT EXISTS referral_credits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount_cents INTEGER NOT NULL,
    reason TEXT NOT NULL,
    referral_id INTEGER,
    applied_to_invoice_id INTEGER,
    created_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE SET NULL
  )`);

  save();
  return db;
}

function backfillReferralCodes() {
  const rows = db.exec("SELECT id FROM users WHERE referral_code IS NULL OR referral_code = ''")[0]?.values || [];
  if (rows.length === 0) return;
  const { generateReferralCode } = require("../services/referralService");
  for (const [id] of rows) {
    const code = generateReferralCode();
    try {
      db.run("UPDATE users SET referral_code = ? WHERE id = ?", [code, id]);
    } catch (err) {
      // If unique collision, try again
      const code2 = generateReferralCode();
      db.run("UPDATE users SET referral_code = ? WHERE id = ?", [code2, id]);
    }
  }
  console.log(`Backfilled referral codes for ${rows.length} users`);
}

function ensureColumn(table, column, definition) {
  const info = db.exec(`PRAGMA table_info(${table})`);
  const cols = (info[0]?.values || []).map((row) => row[1]);
  if (cols.includes(column)) return;
  try {
    db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`Added column ${table}.${column}`);
  } catch (err) {
    console.warn(`ensureColumn(${table}.${column}) failed:`, err.message);
  }
}

function ensureUniqueIndex(table, indexName, column) {
  const result = db.exec(`SELECT count(*) FROM sqlite_master WHERE type='index' AND name='${indexName}'`);
  if (result[0]?.values[0][0] > 0) return;
  try {
    db.run(`CREATE UNIQUE INDEX ${indexName} ON ${table}(${column})`);
    console.log(`Created unique index ${indexName} on ${table}(${column})`);
  } catch (err) {
    console.warn(`ensureUniqueIndex(${indexName}) failed:`, err.message);
  }
}

function ensureIndex(name, ddl) {
  const result = db.exec(`SELECT count(*) FROM sqlite_master WHERE type='index' AND name='${name}'`);
  if (result[0]?.values[0][0] > 0) return;
  try {
    db.run(ddl);
  } catch (err) {
    console.warn(`ensureIndex(${name}) failed:`, err.message);
  }
}

function migratePlanColumn() {
  // Map legacy subscription_status values to the new plan column.
  const rows = db.exec("SELECT id, plan, subscription_status FROM users")[0]?.values || [];
  let updated = 0;
  for (const [id, currentPlan, status] of rows) {
    if (currentPlan && currentPlan !== "" && currentPlan !== "free") continue;
    let mapped = "free";
    if (status === "monthly" || status === "annual") mapped = "pro";
    else if (status === "team") mapped = "team";
    else if (status === "agency") mapped = "agency";
    // free, free_trial, cancelled, active, past_due, null/empty → 'free'
    if ((currentPlan || "") !== mapped) {
      db.run("UPDATE users SET plan = ? WHERE id = ?", [mapped, id]);
      updated++;
    }
  }
  if (updated > 0) console.log(`Migrated ${updated} users to new plan column`);
}

function ensureTable(name, ddl) {
  const result = db.exec(`SELECT count(*) FROM sqlite_master WHERE type='table' AND name='${name}'`);
  const exists = result[0]?.values[0][0] > 0;
  if (!exists) {
    console.log(`Creating missing table: ${name}`);
    db.run(ddl);
  }
}

function migrateRoleEnum(tableName) {
  const sql = db.exec(`SELECT sql FROM sqlite_master WHERE type='table' AND name='${tableName}'`);
  if (!sql[0]?.values[0]?.[0]) return;
  const createSql = sql[0].values[0][0];
  if (createSql.includes("'editor'")) return; // already migrated

  console.log(`Migrating ${tableName} role enum to include 'editor'...`);

  // We have to drop the CHECK constraint by rebuilding the table.
  // SQLite does not support ALTER TABLE ... DROP CONSTRAINT, so we:
  //   1. Create a _new table with the new schema
  //   2. Copy data
  //   3. Drop old, rename new
  // We also need to handle FKs (none on these tables — they reference, not get referenced by data, except FKs from other tables that point to these — those are team_id and we keep them intact).

  const isMembers = tableName === "team_members";
  const newSchema = isMembers
    ? `CREATE TABLE team_members_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
        joined_at DATETIME DEFAULT (datetime('now')),
        UNIQUE (team_id, user_id),
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`
    : `CREATE TABLE team_invites_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_id INTEGER NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
        token TEXT NOT NULL UNIQUE,
        accepted_at DATETIME,
        created_at DATETIME DEFAULT (datetime('now')),
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
      )`;

  db.run(newSchema);
  const cols = isMembers ? "id, team_id, user_id, role, joined_at" : "id, team_id, email, role, token, accepted_at, created_at";
  db.run(`INSERT INTO ${tableName}_new (${cols}) SELECT ${cols} FROM ${tableName}`);
  db.run(`DROP TABLE ${tableName}`);
  db.run(`ALTER TABLE ${tableName}_new RENAME TO ${tableName}`);
  console.log(`  ${tableName} migration complete.`);
}

function getDb() {
  if (!db) throw new Error("Database not initialized. Call init() first.");
  return db;
}

function save() {
  if (!db) return;
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

module.exports = { init, getDb, save };
