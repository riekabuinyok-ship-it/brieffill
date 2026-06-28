const { getDb } = require("../utils/db");

exports.getStats = (req, res) => {
  try {
    const uid = req.user.id;
    const db = getDb();

    const scoreResult = db.exec("SELECT completeness_score FROM briefs WHERE user_id = ?", [uid]);
    const briefs = scoreResult[0]?.values || [];
    const total = briefs.length;
    const scores = briefs.map((r) => r[0]).filter((s) => s != null);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const successCount = scores.filter((s) => s >= 80).length;
    const successRate = scores.length > 0 ? Math.round((successCount / scores.length) * 100) : 0;
    const timeSaved = total > 0 ? `${Math.round(total * 0.5)}h` : "0h";

    const half = Math.max(1, Math.floor(total / 2));
    const recentResult = db.exec(
      "SELECT id FROM briefs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
      [uid, half]
    );
    const recentCount = recentResult[0]?.values?.length || 0;
    const change = total > 0 && recentCount > 0
      ? `+${Math.round(((total - recentCount) / recentCount) * 100)}%`
      : "+0%";

    res.json({ totalBriefs: total, avgScore, timeSaved, successRate, change, userName: req.user.name });
  } catch (err) {
    console.error("getStats error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

exports.getRecentBriefs = (req, res) => {
  try {
    const db = getDb();
    const result = db.exec(
      "SELECT id, project_name, client_name, completeness_score, status, created_at FROM briefs WHERE user_id = ? ORDER BY created_at DESC LIMIT 5",
      [req.user.id]
    );
    const briefs = (result[0]?.values || []).map((r) => ({
      id: r[0], projectName: r[1], clientName: r[2],
      score: r[3], status: r[4], createdAt: r[5],
    }));
    res.json(briefs);
  } catch (err) {
    console.error("getRecentBriefs error:", err);
    res.status(500).json({ error: "Failed to fetch recent briefs" });
  }
};

exports.getScoreTrend = (req, res) => {
  try {
    const db = getDb();
    const result = db.exec(
      "SELECT project_name, completeness_score, created_at FROM briefs WHERE user_id = ? ORDER BY created_at DESC LIMIT 4",
      [req.user.id]
    );
    const trend = (result[0]?.values || []).reverse().map((r) => ({
      briefName: r[0], score: r[1],
      date: r[2] ? r[2].slice(0, 10) : "",
    }));
    res.json(trend);
  } catch (err) {
    console.error("getScoreTrend error:", err);
    res.status(500).json({ error: "Failed to fetch score trend" });
  }
};

exports.getIndustryBreakdown = (req, res) => {
  try {
    const uid = req.user.id;
    const db = getDb();

    const overallResult = db.exec("SELECT completeness_score FROM briefs WHERE user_id = ?", [uid]);
    const scores = (overallResult[0]?.values || []).map((r) => r[0]).filter((s) => s != null);
    const overallAvg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    const indResult = db.exec(
      "SELECT industry, completeness_score FROM briefs WHERE user_id = ? AND industry IS NOT NULL",
      [uid]
    );
    const rows = indResult[0]?.values || [];

    const map = {};
    rows.forEach((r) => {
      const ind = r[0] || "Other";
      if (!map[ind]) map[ind] = { scores: [], count: 0 };
      map[ind].scores.push(r[1]);
      map[ind].count++;
    });

    const industries = Object.entries(map).map(([name, data]) => ({
      name,
      score: data.scores.filter((s) => s != null).length > 0
        ? Math.round(data.scores.filter((s) => s != null).reduce((a, b) => a + b, 0) / data.scores.filter((s) => s != null).length)
        : 0,
      count: data.count,
      difference: Math.round((data.scores.filter((s) => s != null).length > 0
        ? data.scores.filter((s) => s != null).reduce((a, b) => a + b, 0) / data.scores.filter((s) => s != null).length
        : 0) - overallAvg),
    }));

    res.json(industries);
  } catch (err) {
    console.error("getIndustryBreakdown error:", err);
    res.status(500).json({ error: "Failed to fetch industry data" });
  }
};
