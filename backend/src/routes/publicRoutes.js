const express = require("express");
const router = express.Router();
const { findUserByApiKey } = require("../services/apiKeyService");
const { planRequires } = require("../services/billingService");
const { analyzeBrief: runAnalysis } = require("../services/aiService");
const { sanitizeAiResponse } = require("../utils/validation");

function apiKeyAuth(req, res, next) {
  const header = req.headers["x-brieffill-api-key"] || req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!header) {
    return res.status(401).json({ error: "Missing API key. Set X-BriefFill-Api-Key header." });
  }
  const userId = findUserByApiKey(header.trim());
  if (!userId) {
    return res.status(401).json({ error: "Invalid or revoked API key" });
  }
  req.user = { id: userId };
  next();
}

function requireApiAccess(req, res, next) {
  const { getUserBilling } = require("../services/billingService");
  const billing = getUserBilling(req.user.id);
  if (!billing || !planRequires(billing.plan, "apiAccess")) {
    return res.status(403).json({
      error: "API access is not available on your current plan.",
      code: "plan_upgrade_required",
      currentPlan: billing ? billing.plan : "free",
      requiredCapability: "apiAccess",
    });
  }
  next();
}

router.post("/analyze", apiKeyAuth, requireApiAccess, async (req, res) => {
  try {
    const { briefText } = req.body || {};
    if (!briefText || typeof briefText !== "string" || briefText.trim().length < 20) {
      return res.status(400).json({ error: "briefText is required (min 20 characters)" });
    }
    if (briefText.length > 20000) {
      return res.status(400).json({ error: "briefText must be 20000 characters or fewer" });
    }
    const raw = await runAnalysis(briefText);
    const analysis = sanitizeAiResponse(raw);
    res.json({
      completenessScore: analysis.completenessScore,
      fields: analysis.fields,
      clarificationQuestions: analysis.clarificationQuestions,
      suggestedTone: analysis.suggestedTone,
      summary: analysis.summary,
    });
  } catch (err) {
    console.error("public/analyze error:", err);
    res.status(500).json({ error: "Analysis failed" });
  }
});

module.exports = router;
