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

async function getOutcomeSummary(userId) {
  const db = getDb();
  const { data: rows } = await db
    .from("brief_outcomes")
    .select("status, rating")
    .eq("user_id", userId);

  if (!rows || rows.length === 0) return { total: 0, success: 0, successRate: 0, avgRating: 0 };
  const total = rows.length;
  const success = rows.filter((r) => r.status === "success").length;
  const avgRating = (rows.reduce((s, r) => s + r.rating, 0) / total).toFixed(1);
  return { total, success, successRate: Math.round((success / total) * 100), avgRating: Number(avgRating) };
}

async function getScoreTimeline(userId, limit = 30) {
  const cappedLimit = Math.max(1, Math.min(100, parseInt(limit) || 30));
  const db = getDb();
  const { data: rows } = await db
    .from("briefs")
    .select("id, client_name, project_name, completeness_score, created_at")
    .eq("user_id", userId)
    .not("completeness_score", "is", null)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(cappedLimit);

  return (rows || []).map((row) => ({
    briefId: row.id,
    clientName: row.client_name,
    projectName: row.project_name,
    score: row.completeness_score,
    createdAt: row.created_at,
  }));
}

async function getBenchmarks(userId) {
  const db = getDb();
  const { data: rows } = await db
    .from("briefs")
    .select("id, client_name, original_text, completeness_score")
    .eq("user_id", userId)
    .not("completeness_score", "is", null);

  if (!rows || rows.length === 0) {
    return { byIndustry: [], overallAverage: 0, total: 0 };
  }

  const byIndustryMap = new Map();
  let totalScore = 0;
  for (const row of rows) {
    const industry = detectIndustry(row.client_name, row.original_text);
    totalScore += row.completeness_score;
    if (!byIndustryMap.has(industry)) {
      byIndustryMap.set(industry, { count: 0, totalScore: 0 });
    }
    const entry = byIndustryMap.get(industry);
    entry.count += 1;
    entry.totalScore += row.completeness_score;
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

exports.getScoreTimeline = async (req, res) => {
  try {
    const limit = req.query.limit;
    const points = await getScoreTimeline(req.user.id, limit);
    res.json({ points });
  } catch (err) {
    console.error("getScoreTimeline error:", err);
    res.status(500).json({ error: "Failed to fetch score timeline" });
  }
};

exports.getOutcomeSummary = async (req, res) => {
  try {
    const data = await getOutcomeSummary(req.user.id);
    res.json(data);
  } catch (err) {
    console.error("getOutcomeSummary error:", err);
    res.status(500).json({ error: "Failed to fetch outcome summary" });
  }
};

exports.getBenchmarks = async (req, res) => {
  try {
    const data = await getBenchmarks(req.user.id);
    res.json(data);
  } catch (err) {
    console.error("getBenchmarks error:", err);
    res.status(500).json({ error: "Failed to fetch benchmarks" });
  }
};
