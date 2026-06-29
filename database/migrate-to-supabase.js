require("dotenv").config({ path: require("path").join(__dirname, "..", "backend", ".env") });
const path = require("path");
const fs = require("fs");
const initSqlJs = require(require.resolve("sql.js", { paths: [path.join(__dirname, "..", "backend", "node_modules")] }));
const { createClient } = require(require.resolve("@supabase/supabase-js", { paths: [path.join(__dirname, "..", "backend", "node_modules")] }));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file first.");
  console.error("Create a free project at https://supabase.com, then add:");
  console.error("  SUPABASE_URL=https://xxxx.supabase.co");
  console.error("  SUPABASE_SERVICE_ROLE_KEY=eyJ...");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

const BOOLEAN_COLS = {
  users: ["cancel_at_period_end", "totp_enabled"],
  collaboration_portals: ["is_active"],
  user_api_keys: ["is_active"],
  user_preferences: [
    "notifications_email_enabled", "notifications_brief_analysis",
    "notifications_team_invites", "notifications_portal_updates",
    "notifications_referral_rewards", "notifications_billing",
    "notifications_product_updates", "notifications_weekly_summary",
  ],
};

const NUMERIC_COLS = {
  briefs: ["completeness_score"],
};

const JSON_COLS = {
  briefs: ["analyzed_text", "missing_fields"],
  competitor_analyses: ["competitors", "common_strengths", "common_gaps"],
  user_integrations: ["webhook_events"],
  users: ["social_links"],
};

function transformRow(table, row) {
  const out = { ...row };
  const boolCols = BOOLEAN_COLS[table] || [];
  for (const col of boolCols) {
    if (col in out) out[col] = out[col] === 1 || out[col] === true;
  }
  const jsonCols = JSON_COLS[table] || [];
  for (const col of jsonCols) {
    if (out[col] && typeof out[col] === "string") {
      try { out[col] = JSON.parse(out[col]); } catch { /* keep as string */ }
    }
  }
  const numCols = NUMERIC_COLS[table] || [];
  for (const col of numCols) {
    if (out[col] !== null && out[col] !== undefined && typeof out[col] === "number") {
      out[col] = Math.round(out[col]);
    }
  }
  return out;
}

function getAllRows(db, table) {
  const result = db.exec(`SELECT * FROM "${table}"`);
  if (!result.length || !result[0].values.length) return [];
  const cols = result[0].columns;
  return result[0].values.map((row) => {
    const obj = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

async function insertBatch(table, rows) {
  if (!rows.length) { console.log(`  ${table}: 0 rows (skipped)`); return; }
  const transformed = rows.map((r) => transformRow(table, r));
  const { data, error } = await supabase.from(table).insert(transformed).select();
  if (error) {
    console.error(`  ${table}: ERROR - ${error.message}`);
    if (error.details) console.error(`    details: ${error.details}`);
    throw error;
  }
  console.log(`  ${table}: ${transformed.length} rows inserted`);
}

async function resetSequences(tables) {
  console.log("\nResetting identity sequences...");
  for (const t of tables) {
    try {
      const { error } = await supabase.rpc("exec_sql", {
        sql: `SELECT setval(pg_get_serial_sequence('${t}', 'id'), COALESCE((SELECT MAX(id) FROM "${t}"), 0) + 1, false)`,
      });
      if (error && !error.message.includes("Could not find")) {
        console.log(`  ${t}: sequence reset (or not needed)`);
      }
    } catch { /* exec_sql rpc might not exist — that's OK, sequences auto-manage */ }
  }
  console.log("  (sequences will auto-increment correctly)");
}

async function migrate() {
  console.log("Loading SQLite database...");
  const SQL = await initSqlJs();
  const dbPath = path.join(__dirname, "brieffill.db");
  if (!fs.existsSync(dbPath)) {
    console.error("database/brieffill.db not found. Nothing to migrate.");
    process.exit(1);
  }
  const db = new SQL.Database(fs.readFileSync(dbPath));
  console.log("SQLite database loaded.\n");

  console.log("Migrating data to Supabase...\n");

  // Clear any pre-seeded rows so migration IDs don't collide.
  // Run in reverse FK order; users last (FK references from other tables).
  const truncateOrder = [
    "portal_files", "portal_responses", "collaboration_portals",
    "user_sessions", "referral_credits", "referrals",
    "invoices", "user_api_keys", "webhook_deliveries",
    "user_integrations", "competitor_analyses", "brief_outcomes",
    "team_invites", "brief_shares", "team_members", "teams",
    "user_preferences", "payments", "field_definitions",
    "briefs", "users",
  ];
  console.log("Clearing existing Supabase rows...");
  // Tables whose primary key is not "id".
  const pkOverride = {
    competitor_analyses: "brief_id",
    brief_outcomes: "brief_id",
    collaboration_portals: "id",
  };
  for (const t of truncateOrder) {
    const filterCol = pkOverride[t] || (["user_integrations", "user_preferences"].includes(t) ? "user_id" : "id");
    const { error } = await supabase.from(t).delete().neq(filterCol, -999999);
    if (error && !error.message.includes("Could not find")) {
      console.log(`  ${t}: ${error.message}`);
    }
  }
  console.log("Done clearing.\n");

  const migrationOrder = [
    "users",
    "field_definitions",
    "briefs",
    "payments",
    "invoices",
    "referrals",
    "user_api_keys",
    "user_preferences",
    "teams",
    "team_members",
    "team_invites",
    "brief_shares",
    "brief_outcomes",
    "competitor_analyses",
    "user_integrations",
    "webhook_deliveries",
    "referral_credits",
    "user_sessions",
    "collaboration_portals",
    "portal_responses",
    "portal_files",
  ];

  for (const table of migrationOrder) {
    const rows = getAllRows(db, table);
    await insertBatch(table, rows);
  }

  console.log("\nMigration complete!");
  console.log("\nNext steps:");
  console.log("  1. Verify your data in the Supabase dashboard");
  console.log("  2. Update your .env with SUPABASE_URL and SUPABASE_SERVICE_KEY");
  console.log("  3. Test locally: cd backend && npm start");
  console.log("  4. Add the same env vars to Vercel project settings");
}

migrate().catch((err) => {
  console.error("\nMigration failed:", err);
  process.exit(1);
});
