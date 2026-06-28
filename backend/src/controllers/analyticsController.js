const { getDb } = require("../utils/db");

const INDUSTRY_KEYWORDS = [
  { name: "fintech", patterns: /\b(fintech|banking|bank|finance|financial|payment|trading|invest|wealth|loan|credit|crypto|blockchain|defi)\b/i },
  { name: "ecommerce", patterns: /\b(ecommerce|e-commerce|retail|shop|store|shopping|cart|checkout|product|sku|inventory|fulfillment|marketplace)\b/i },
  { name: "saas", patterns: /\b(saas|software|b2b|platform|api|dashboard|subscription|crm|workflow|automation|integration)\b/i },
  { name: "healthcare", patterns: /\b(health|healthcare|medical|clinical|patient|hospital|pharma|doctor|nurse|wellness|therapy|telehealth)\b/i },
  { name: "nonprofit", patterns: /\b(nonprofit|non-profit|charity|ngo|foundation|donor|donation|mission|impact|advocacy|community)\b/i },
  { name: "robotics", patterns: /\b(robot|robotic|automation|hardware|mechanical|sensor|actuator|drone|machine|iot|firmware)\b/i },
  { name: "fashion", patterns: /\b(fashion|apparel|clothing|garment|textile|wearable|wardrobe|outfit|luxury|brand identity)\b/i },
  { name: "education", patterns: /\b(education|edtech|learning|student|teacher|school|university|course|curriculum|tutoring|training)\b/i },
  { name: "real estate", patterns: /\b(real estate|property|housing|rental|listing|realtor|broker|mortgage|apartment|construction)\b/i },
  { name: "marketing", patterns: /\b(marketing|advertising|brand campaign|campaign|seo|content|social media|growth|funnel)\b/i },
];

function detectIndustry(clientName, briefText) {
  const combined = `${clientName || ""} ${briefText || ""}`;
  for (const { name, patterns } of INDUSTRY_KEYWORDS) {
    if (patterns.test(combined)) return name;
  }
  return "other";
}

function getOutcomeSummary(userId) {
  const db = getDb();
  const result = db.exec("SELECT status, rating FROM brief_outcomes WHERE user_id = ?", [userId]);
  const rows = result[0]?.values || [];
  const total = rows.length;
  if (!total) return { total: 0, success: 0, successRate: 0, avgRating: 0 };
  const success = rows.filter((r) => r[0] === "success").length;
  const avgRating = (rows.reduce((s, r) => s + r[1], 0) / total).toFixed(1);
  return { total, success, successRate: Math.round((success / total) * 100), avgRating: Number(avgRating) };
}

function getScoreTimeline(userId, limit = 30) {
  const cappedLimit = Math.max(1, Math.min(100, parseInt(limit) || 30));
  const db = getDb();
  const result = db.exec(
    "SELECT id, client_name, project_name, completeness_score, created_at FROM briefs WHERE user_id = ? AND completeness_score IS NOT NULL ORDER BY created_at ASC, id ASC LIMIT ?",
    [userId, cappedLimit]
  );
  return (result[0]?.values || []).map((row) => ({
    briefId: row[0],
    clientName: row[1],
    projectName: row[2],
    score: row[3],
    createdAt: row[4],
  }));
}

function getBenchmarks(userId) {
  const db = getDb();
  const result = db.exec(
    "SELECT id, client_name, original_text, completeness_score FROM briefs WHERE user_id = ? AND completeness_score IS NOT NULL",
    [userId]
  );
  const rows = result[0]?.values || [];
  if (!rows.length) {
    return { byIndustry: [], overallAverage: 0, total: 0 };
  }

  const byIndustryMap = new Map();
  let totalScore = 0;
  for (const row of rows) {
    const industry = detectIndustry(row[1], row[2]);
    totalScore += row[3];
    if (!byIndustryMap.has(industry)) {
      byIndustryMap.set(industry, { count: 0, totalScore: 0 });
    }
    const entry = byIndustryMap.get(industry);
    entry.count += 1;
    entry.totalScore += row[3];
  }

  const overallAverage = Math.round(totalScore / rows.length);
  const byIndustry = Array.from(byIndustryMap.entries())
    .map(([industry, { count, totalScore: sum }]) => ({
      industry,
      count,
      averageScore: Math.round(sum / count),
      delta: Math.round(sum / count) - overallAverage,
    }))
    .sort((a, b) => b.count - a.count);

  return { byIndustry, overallAverage, total: rows.length };
}

exports.getScoreTimeline = (req, res) => {
  try {
    const limit = req.query.limit;
    const points = getScoreTimeline(req.user.id, limit);
    res.json({ points });
  } catch (err) {
    console.error("getScoreTimeline error:", err);
    res.status(500).json({ error: "Failed to fetch score timeline" });
  }
};

exports.getOutcomeSummary = (req, res) => {
  try {
    const data = getOutcomeSummary(req.user.id);
    res.json(data);
  } catch (err) {
    console.error("getOutcomeSummary error:", err);
    res.status(500).json({ error: "Failed to fetch outcome summary" });
  }
};

exports.getBenchmarks = (req, res) => {
  try {
    const data = getBenchmarks(req.user.id);
    res.json(data);
  } catch (err) {
    console.error("getBenchmarks error:", err);
    res.status(500).json({ error: "Failed to fetch benchmarks" });
  }
};
