const crypto = require("crypto");
const { getDb, save } = require("../utils/db");

const PREFIX = "bfk_";

function generateApiKey() {
  const random = crypto.randomBytes(24).toString("base64url");
  return PREFIX + random;
}

function hashKey(plain) {
  return crypto.createHash("sha256").update(plain).digest("hex");
}

function verifyKey(plain, hash) {
  if (!plain || !hash) return false;
  const computed = hashKey(plain);
  if (computed.length !== hash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
}

function createApiKey(userId, name) {
  const plain = generateApiKey();
  const hash = hashKey(plain);
  const db = getDb();
  db.run(
    "INSERT INTO user_api_keys (user_id, name, key_hash) VALUES (?, ?, ?)",
    [userId, name, hash]
  );
  const id = db.exec("SELECT last_insert_rowid() AS id")[0].values[0][0];
  save();
  return { id, name, plain, prefix: plain.slice(0, 8) };
}

function listApiKeys(userId) {
  const db = getDb();
  const rows = db.exec(
    "SELECT id, name, last_used_at, created_at FROM user_api_keys WHERE user_id = ? ORDER BY id DESC",
    [userId]
  )[0]?.values || [];
  return rows.map((r) => ({
    id: r[0],
    name: r[1],
    lastUsedAt: r[2],
    createdAt: r[3],
  }));
}

function revokeApiKey(userId, id) {
  const db = getDb();
  db.run("DELETE FROM user_api_keys WHERE id = ? AND user_id = ?", [id, userId]);
  const changes = db.exec("SELECT changes() AS n")[0]?.values?.[0]?.[0] || 0;
  save();
  return changes > 0;
}

function findUserByApiKey(plain) {
  if (!plain || !plain.startsWith(PREFIX)) return null;
  const hash = hashKey(plain);
  const db = getDb();
  const row = db.exec(
    "SELECT user_id FROM user_api_keys WHERE key_hash = ?",
    [hash]
  )[0]?.values?.[0];
  if (!row) return null;
  const userId = row[0];
  db.run("UPDATE user_api_keys SET last_used_at = datetime('now') WHERE key_hash = ?", [hash]);
  return userId;
}

module.exports = {
  generateApiKey,
  hashKey,
  verifyKey,
  createApiKey,
  listApiKeys,
  revokeApiKey,
  findUserByApiKey,
};
