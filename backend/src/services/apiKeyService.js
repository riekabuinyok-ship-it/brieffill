const crypto = require("crypto");
const { getDb } = require("../utils/db");

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

async function createApiKey(userId, name) {
  const plain = generateApiKey();
  const hash = hashKey(plain);
  const db = getDb();
  const { data, error } = await db
    .from("user_api_keys")
    .insert({ user_id: userId, name, key_hash: hash })
    .select()
    .maybeSingle();
  if (error) throw error;
  return { id: data.id, name, plain, prefix: plain.slice(0, 8), createdAt: data.created_at };
}

async function listApiKeys(userId) {
  const db = getDb();
  const { data, error } = await db
    .from("user_api_keys")
    .select("id, name, last_used_at, created_at")
    .eq("user_id", userId)
    .order("id", { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    lastUsedAt: row.last_used_at,
    createdAt: row.created_at,
  }));
}

async function revokeApiKey(userId, id) {
  const db = getDb();
  const { data, error } = await db
    .from("user_api_keys")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select();
  if (error) throw error;
  return (data || []).length > 0;
}

async function findUserByApiKey(plain) {
  if (!plain || !plain.startsWith(PREFIX)) return null;
  const hash = hashKey(plain);
  const db = getDb();
  const { data, error } = await db
    .from("user_api_keys")
    .select("user_id")
    .eq("key_hash", hash)
    .maybeSingle();
  if (error || !data) return null;
  await db
    .from("user_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("key_hash", hash);
  return data.user_id;
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
