const { getDb } = require("../utils/db");

exports.getUsage = async (req, res) => {
  try {
    const db = getDb();

    const { count: totalBriefs } = await db
      .from("briefs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", req.user.id);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthStartStr = monthStart.toISOString();

    const { count: briefsThisMonth } = await db
      .from("briefs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", req.user.id)
      .gte("created_at", monthStartStr);

    const { data: firstRow } = await db
      .from("briefs")
      .select("created_at")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const firstBrief = firstRow?.created_at || null;

    const { data: scores } = await db
      .from("briefs")
      .select("completeness_score")
      .eq("user_id", req.user.id)
      .not("completeness_score", "is", null);

    const avgScore = scores.length
      ? Math.round(scores.reduce((s, r) => s + r.completeness_score, 0) / scores.length)
      : 0;

    const { count: paymentCount } = await db
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", req.user.id);

    res.json({
      totalBriefs: totalBriefs || 0,
      briefsThisMonth: briefsThisMonth || 0,
      averageScore: avgScore,
      firstBriefAt: firstBrief,
      apiCalls: totalBriefs || 0,
      paymentCount: paymentCount || 0,
    });
  } catch (err) {
    console.error("getUsage error:", err);
    res.status(500).json({ error: "Failed to fetch usage stats" });
  }
};
