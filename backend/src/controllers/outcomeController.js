const { getDb } = require("../utils/db");
const { emit } = require("../services/eventService");

const VALID_STATUSES = ["success", "failure", "in_progress"];

async function verifyBriefOwnership(briefId, userId) {
  const db = getDb();
  const { data: row, error } = await db
    .from("briefs")
    .select("user_id")
    .eq("id", briefId)
    .maybeSingle();

  if (!row) return { ok: false, status: 404, error: "Brief not found" };
  if (row.user_id !== userId) return { ok: false, status: 403, error: "Not authorized" };
  return { ok: true };
}

async function upsertOutcome({ briefId, userId, rating, status, notes }) {
  const now = new Date().toISOString();
  const db = getDb();
  const { data: existing } = await db
    .from("brief_outcomes")
    .select("brief_id")
    .eq("brief_id", briefId)
    .maybeSingle();

  if (existing) {
    await db
      .from("brief_outcomes")
      .update({ rating, status, notes: notes || null, updated_at: now })
      .eq("brief_id", briefId);
  } else {
    await db
      .from("brief_outcomes")
      .insert({ brief_id: briefId, user_id: userId, rating, status, notes: notes || null, created_at: now, updated_at: now });
  }
}

async function getOutcomeForBrief(briefId) {
  const db = getDb();
  const { data: row, error } = await db
    .from("brief_outcomes")
    .select("brief_id, rating, status, notes, created_at, updated_at")
    .eq("brief_id", briefId)
    .maybeSingle();

  if (!row) return null;
  return {
    briefId: row.brief_id,
    rating: row.rating,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

exports.recordOutcome = async (req, res) => {
  const { rating, status, notes } = req.body || {};

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "rating must be an integer between 1 and 5" });
  }
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: "status must be 'success', 'failure', or 'in_progress'" });
  }
  if (notes !== undefined && notes !== null && typeof notes !== "string") {
    return res.status(400).json({ error: "notes must be a string" });
  }
  if (typeof notes === "string" && notes.length > 1000) {
    return res.status(400).json({ error: "notes must be 1000 characters or fewer" });
  }

  const ownership = await verifyBriefOwnership(req.params.id, req.user.id);
  if (!ownership.ok) return res.status(ownership.status).json({ error: ownership.error });

  await upsertOutcome({
    briefId: req.params.id,
    userId: req.user.id,
    rating,
    status,
    notes: notes || null,
  });

  emit("brief.outcome_recorded", {
    userId: req.user.id,
    briefId: req.params.id,
    status,
    rating,
  });

  const outcome = await getOutcomeForBrief(req.params.id);
  res.json({ success: true, outcome });
};

exports.getOutcome = async (req, res) => {
  const ownership = await verifyBriefOwnership(req.params.id, req.user.id);
  if (!ownership.ok) return res.status(ownership.status).json({ error: ownership.error });

  const outcome = await getOutcomeForBrief(req.params.id);
  res.json({ outcome });
};
