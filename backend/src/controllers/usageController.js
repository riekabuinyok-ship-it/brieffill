const { getDb } = require("../utils/db");

exports.getUsage = (req, res) => {
  try {
    const db = getDb();

    const totalResult = db.exec("SELECT COUNT(*) AS cnt FROM briefs WHERE user_id = ?", [req.user.id]);
    const totalBriefs = totalResult[0]?.values[0]?.[0] || 0;

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthStartStr = monthStart.toISOString();

    const thisMonthResult = db.exec(
      "SELECT COUNT(*) AS cnt FROM briefs WHERE user_id = ? AND created_at >= ?",
      [req.user.id, monthStartStr]
    );
    const briefsThisMonth = thisMonthResult[0]?.values[0]?.[0] || 0;

    const firstResult = db.exec(
      "SELECT created_at FROM briefs WHERE user_id = ? ORDER BY created_at ASC LIMIT 1",
      [req.user.id]
    );
    const firstBrief = firstResult[0]?.values?.[0]?.[0] || null;

    const avgResult = db.exec(
      "SELECT completeness_score FROM briefs WHERE user_id = ? AND completeness_score IS NOT NULL",
      [req.user.id]
    );
    const scores = avgResult[0]?.values || [];
    const avgScore = scores.length
      ? Math.round(scores.reduce((s, r) => s + r[0], 0) / scores.length)
      : 0;

    const paymentResult = db.exec("SELECT COUNT(*) AS cnt FROM payments WHERE user_id = ?", [req.user.id]);
    const paymentCount = paymentResult[0]?.values[0]?.[0] || 0;

    res.json({
      totalBriefs,
      briefsThisMonth,
      averageScore: avgScore,
      firstBriefAt: firstBrief,
      apiCalls: totalBriefs,
      paymentCount,
    });
  } catch (err) {
    console.error("getUsage error:", err);
    res.status(500).json({ error: "Failed to fetch usage stats" });
  }
};
