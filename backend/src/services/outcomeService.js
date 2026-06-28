const { getDb } = require("../utils/db");

async function upsertOutcome({ briefId, userId, rating, status, notes }) {
  const db = getDb();
  const { data: existing } = await db
    .from("brief_outcomes")
    .select("brief_id")
    .eq("brief_id", briefId)
    .maybeSingle();

  const now = new Date().toISOString();
  const payload = {
    brief_id: briefId,
    user_id: userId,
    rating,
    status,
    notes: notes || null,
    updated_at: now,
  };

  if (existing) {
    await db
      .from("brief_outcomes")
      .update(payload)
      .eq("brief_id", briefId);
  } else {
    payload.created_at = now;
    await db
      .from("brief_outcomes")
      .insert(payload);
  }
}

async function getOutcomeForBrief(briefId) {
  const db = getDb();
  const { data, error } = await db
    .from("brief_outcomes")
    .select("brief_id, rating, status, notes, created_at, updated_at")
    .eq("brief_id", briefId)
    .maybeSingle();
  if (!data) return null;
  return {
    briefId: data.brief_id,
    rating: data.rating,
    status: data.status,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

async function computeOutcomeStats(userId) {
  const db = getDb();
  const { data, error } = await db
    .from("brief_outcomes")
    .select("rating, status")
    .eq("user_id", userId);

  const rows = data || [];
  const total = rows.length;
  const successCount = rows.filter((r) => r.status === "success").length;
  const failureCount = rows.filter((r) => r.status === "failure").length;
  const inProgressCount = rows.filter((r) => r.status === "in_progress").length;
  const ratings = rows.filter((r) => r.rating != null).map((r) => r.rating);
  const avgRaw = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
  const averageRating = avgRaw ? Math.round(avgRaw * 10) / 10 : 0;
  const successRate = total > 0 ? Math.round((successCount / total) * 100) : 0;
  return { total, successCount, failureCount, inProgressCount, averageRating, successRate };
}

module.exports = { upsertOutcome, getOutcomeForBrief, computeOutcomeStats };
