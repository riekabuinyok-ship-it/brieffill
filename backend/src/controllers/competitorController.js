const { analyzeCompetitors, getCompetitorAnalysis, verifyBriefOwnership } = require("../services/competitorService");
const { emit } = require("../services/eventService");

const MIN_TEXT = 50;
const MAX_TEXT = 20000;
const MAX_NAME = 80;
const MAX_COMPETITORS = 3;
const MIN_COMPETITORS = 1;

exports.runCompetitorAnalysis = async (req, res) => {
  try {
    const briefId = req.params.id;
    if (!verifyBriefOwnership(briefId, req.user.id)) {
      return res.status(404).json({ error: "Brief not found" });
    }

    const raw = Array.isArray(req.body?.competitors) ? req.body.competitors : [];
    if (raw.length < MIN_COMPETITORS || raw.length > MAX_COMPETITORS) {
      return res.status(400).json({ error: `Provide between ${MIN_COMPETITORS} and ${MAX_COMPETITORS} competitor briefs` });
    }

    const cleaned = raw.map((c, i) => {
      if (!c || typeof c !== "object") throw new Error(`competitor[${i}] invalid`);
      const text = typeof c.text === "string" ? c.text.trim() : "";
      const name = typeof c.name === "string" ? c.name.trim().slice(0, MAX_NAME) : "";
      if (text.length < MIN_TEXT) {
        throw new Error(`Competitor ${i + 1} text must be at least ${MIN_TEXT} characters`);
      }
      if (text.length > MAX_TEXT) {
        throw new Error(`Competitor ${i + 1} text must be at most ${MAX_TEXT} characters`);
      }
      return { name, text };
    });

    const result = await analyzeCompetitors({
      userId: req.user.id,
      briefId,
      competitors: cleaned,
    });

    emit("brief.competitor_analysis_run", {
      userId: req.user.id,
      briefId,
      competitorCount: cleaned.length,
    });

    res.json({ analysis: result });
  } catch (err) {
    if (err.message && (err.message.includes("Competitor") || err.message.includes("competitor"))) {
      return res.status(400).json({ error: err.message });
    }
    console.error("runCompetitorAnalysis error:", err);
    res.status(500).json({ error: "Failed to run competitor analysis" });
  }
};

exports.getCompetitorAnalysis = (req, res) => {
  try {
    const briefId = req.params.id;
    if (!verifyBriefOwnership(briefId, req.user.id)) {
      return res.status(404).json({ error: "Brief not found" });
    }
    const analysis = getCompetitorAnalysis(briefId);
    res.json({ analysis });
  } catch (err) {
    console.error("getCompetitorAnalysis error:", err);
    res.status(500).json({ error: "Failed to fetch competitor analysis" });
  }
};
