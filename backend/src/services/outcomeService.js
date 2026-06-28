const { getDb, save } = require("../utils/db");

function upsertOutcome({ briefId, userId, rating, status, notes }) {
  const db = getDb();
  db.run(
    `INSERT INTO brief_outcomes (brief_id, user_id, rating, status, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
     ON CONFLICT(brief_id) DO UPDATE SET
       rating = excluded.rating,
       status = excluded.status,
       notes = excluded.notes,
       updated_at = datetime('now')`,
    [briefId, userId, rating, status, notes || null]
  );
  save();
}

function getOutcomeForBrief(briefId) {
  const db = getDb();
  const result = db.exec(
    `SELECT brief_id, rating, status, notes, created_at, updated_at
     FROM brief_outcomes WHERE brief_id = ?`,
    [briefId]
  );
  if (!result[0]?.values.length) return null;
  const row = result[0].values[0];
  return {
    briefId: row[0],
    rating: row[1],
    status: row[2],
    notes: row[3],
    createdAt: row[4],
    updatedAt: row[5],
  };
}

function computeOutcomeStats(userId) {
  const db = getDb();
  const result = db.exec(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN bo.status = 'success' THEN 1 ELSE 0 END) AS successCount,
       SUM(CASE WHEN bo.status = 'failure' THEN 1 ELSE 0 END) AS failureCount,
       SUM(CASE WHEN bo.status = 'in_progress' THEN 1 ELSE 0 END) AS inProgressCount,
       AVG(bo.rating) AS averageRating
     FROM brief_outcomes bo
     JOIN briefs b ON b.id = bo.brief_id
     WHERE bo.user_id = ?`,
    [userId]
  );
  const row = result[0]?.values[0] || [0, 0, 0, 0, null];
  const total = row[0] || 0;
  const successCount = row[1] || 0;
  const failureCount = row[2] || 0;
  const inProgressCount = row[3] || 0;
  const avgRaw = row[4];
  const averageRating = avgRaw ? Math.round(avgRaw * 10) / 10 : 0;
  const successRate = total > 0 ? Math.round((successCount / total) * 100) : 0;
  return { total, successCount, failureCount, inProgressCount, averageRating, successRate };
}

module.exports = { upsertOutcome, getOutcomeForBrief, computeOutcomeStats };
