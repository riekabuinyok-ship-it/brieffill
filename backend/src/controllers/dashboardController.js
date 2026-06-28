const { getDb } = require("../utils/db");

exports.getStats = async (req, res) => {
  try {
    const uid = req.user.id;
    const db = getDb();

    const { data: briefs } = await db
      .from("briefs")
      .select("completeness_score")
      .eq("user_id", uid);

    const total = briefs.length;
    const scores = briefs.map((r) => r.completeness_score).filter((s) => s != null);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const successCount = scores.filter((s) => s >= 80).length;
    const successRate = scores.length > 0 ? Math.round((successCount / scores.length) * 100) : 0;
    const timeSaved = total > 0 ? `${Math.round(total * 0.5)}h` : "0h";

    const half = Math.max(1, Math.floor(total / 2));
    const { data: recent } = await db
      .from("briefs")
      .select("id")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(half);

    const recentCount = recent?.length || 0;
    const change = total > 0 && recentCount > 0
      ? `+${Math.round(((total - recentCount) / recentCount) * 100)}%`
      : "+0%";

    res.json({ totalBriefs: total, avgScore, timeSaved, successRate, change, userName: req.user.name });
  } catch (err) {
    console.error("getStats error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

exports.getRecentBriefs = async (req, res) => {
  try {
    const db = getDb();
    const { data: rows } = await db
      .from("briefs")
      .select("id, project_name, client_name, completeness_score, status, created_at")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    const briefs = (rows || []).map((r) => ({
      id: r.id, projectName: r.project_name, clientName: r.client_name,
      score: r.completeness_score, status: r.status, createdAt: r.created_at,
    }));
    res.json(briefs);
  } catch (err) {
    console.error("getRecentBriefs error:", err);
    res.status(500).json({ error: "Failed to fetch recent briefs" });
  }
};

exports.getScoreTrend = async (req, res) => {
  try {
    const db = getDb();
    const { data: rows } = await db
      .from("briefs")
      .select("project_name, completeness_score, created_at")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(4);

    const trend = (rows || []).reverse().map((r) => ({
      briefName: r.project_name, score: r.completeness_score,
      date: r.created_at ? r.created_at.slice(0, 10) : "",
    }));
    res.json(trend);
  } catch (err) {
    console.error("getScoreTrend error:", err);
    res.status(500).json({ error: "Failed to fetch score trend" });
  }
};

exports.getIndustryBreakdown = async (req, res) => {
  try {
    const uid = req.user.id;
    const db = getDb();

    const { data: overall } = await db
      .from("briefs")
      .select("completeness_score")
      .eq("user_id", uid);

    const scores = (overall || []).map((r) => r.completeness_score).filter((s) => s != null);
    const overallAvg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    const { data: rows } = await db
      .from("briefs")
      .select("industry, completeness_score")
      .eq("user_id", uid)
      .not("industry", "is", null);

    const map = {};
    (rows || []).forEach((r) => {
      const ind = r.industry || "Other";
      if (!map[ind]) map[ind] = { scores: [], count: 0 };
      map[ind].scores.push(r.completeness_score);
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
