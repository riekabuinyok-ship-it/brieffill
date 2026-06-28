const { getDb, save } = require("../utils/db");
const { emit } = require("../services/eventService");

const VALID_STATUSES = ["success", "failure", "in_progress"];

function verifyBriefOwnership(briefId, userId) {
  const db = getDb();
  const result = db.exec("SELECT user_id FROM briefs WHERE id = ?", [briefId]);
  const row = result[0]?.values?.[0];
  if (!row) return { ok: false, status: 404, error: "Brief not found" };
  if (row[0] !== userId) return { ok: false, status: 403, error: "Not authorized" };
  return { ok: true };
}

function upsertOutcome({ briefId, userId, rating, status, notes }) {
  const now = new Date().toISOString();
  const db = getDb();
  const existing = db.exec("SELECT brief_id FROM brief_outcomes WHERE brief_id = ?", [briefId]);
  const exists = existing[0]?.values?.[0];

  if (exists) {
    db.run(
      "UPDATE brief_outcomes SET rating = ?, status = ?, notes = ?, updated_at = ? WHERE brief_id = ?",
      [rating, status, notes || null, now, briefId]
    );
  } else {
    db.run(
      "INSERT INTO brief_outcomes (brief_id, user_id, rating, status, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [briefId, userId, rating, status, notes || null, now, now]
    );
  }
  save();
}

function getOutcomeForBrief(briefId) {
  const db = getDb();
  const result = db.exec(
    "SELECT brief_id, rating, status, notes, created_at, updated_at FROM brief_outcomes WHERE brief_id = ?",
    [briefId]
  );
  const row = result[0]?.values?.[0];
  if (!row) return null;
  return {
    briefId: row[0],
    rating: row[1],
    status: row[2],
    notes: row[3],
    createdAt: row[4],
    updatedAt: row[5],
  };
}

exports.recordOutcome = (req, res) => {
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

  const ownership = verifyBriefOwnership(req.params.id, req.user.id);
  if (!ownership.ok) return res.status(ownership.status).json({ error: ownership.error });

  upsertOutcome({
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

  const outcome = getOutcomeForBrief(req.params.id);
  res.json({ success: true, outcome });
};

exports.getOutcome = (req, res) => {
  const ownership = verifyBriefOwnership(req.params.id, req.user.id);
  if (!ownership.ok) return res.status(ownership.status).json({ error: ownership.error });

  const outcome = getOutcomeForBrief(req.params.id);
  res.json({ outcome });
};
