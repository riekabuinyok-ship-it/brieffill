const { generateBrief, refineBrief } = require("../services/briefGeneratorService");
const { enforceBriefLimit, recordBriefCreated } = require("../services/billingService");

exports.generate = async (req, res) => {
  try {
    const { prompt, clientName, projectName } = req.body || {};
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "prompt is required" });
    }
    try {
      enforceBriefLimit(req.user.id);
    } catch (limitErr) {
      if (limitErr.payload) return res.status(limitErr.status).json(limitErr.payload);
      throw limitErr;
    }
    const result = await generateBrief({
      prompt,
      clientName: typeof clientName === "string" ? clientName : "",
      projectName: typeof projectName === "string" ? projectName : "",
    });
    // Generation itself doesn't save a brief — only saves count when the user
    // explicitly saves the draft. We do NOT call recordBriefCreated here.
    res.json(result);
  } catch (err) {
    if (err.message && /must be|at least|exceed/i.test(err.message)) {
      return res.status(400).json({ error: err.message });
    }
    console.error("generate error:", err);
    res.status(500).json({ error: "Brief generation failed. " + (err.message || "Please try again.") });
  }
};

exports.regenerate = async (req, res) => {
  try {
    const { currentBrief, feedback } = req.body || {};
    if (!currentBrief || typeof currentBrief !== "string") {
      return res.status(400).json({ error: "currentBrief is required" });
    }
    if (!feedback || typeof feedback !== "string") {
      return res.status(400).json({ error: "feedback is required" });
    }
    const result = await refineBrief({ currentBrief, feedback });
    res.json(result);
  } catch (err) {
    if (err.message && /must be|at least|exceed/i.test(err.message)) {
      return res.status(400).json({ error: err.message });
    }
    console.error("regenerate error:", err);
    res.status(500).json({ error: "Refinement failed. " + (err.message || "Please try again.") });
  }
};
