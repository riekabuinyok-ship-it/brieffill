const { getDb } = require("../utils/db");
const { improveBrief } = require("../services/briefBuilderService");
const { emit } = require("../services/eventService");

exports.buildBrief = async (req, res) => {
  try {
    const db = getDb();
    const { data: brief, error } = await db
      .from("briefs")
      .select("id, user_id, original_text, analyzed_text, client_name, project_name")
      .eq("id", req.params.id)
      .maybeSingle();

    if (!brief) {
      return res.status(404).json({ error: "Brief not found" });
    }

    if (brief.user_id !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to build this brief" });
    }

    const originalBrief = brief.original_text;
    const analysis = brief.analyzed_text;

    if (!analysis) {
      return res.status(400).json({ error: "Brief has not been analyzed yet" });
    }

    const { improvedBrief, summaryOfChanges, fieldFixes, fallback } = await improveBrief({
      originalBrief,
      analysis,
    });

    emit("brief.rebuilt", {
      userId: req.user.id,
      briefId: req.params.id,
      clientName: brief.client_name,
      projectName: brief.project_name,
    });

    res.json({
      originalBrief,
      improvedBrief,
      summaryOfChanges,
      fieldFixes,
      fallback: !!fallback,
    });
  } catch (err) {
    console.error("buildBrief error:", err);
    res.status(500).json({ error: "Failed to build improved brief" });
  }
};

exports.saveImprovedBrief = async (req, res) => {
  try {
    const { improvedBrief } = req.body;
    if (!improvedBrief || typeof improvedBrief !== "string") {
      return res.status(400).json({ error: "improvedBrief is required" });
    }

    const db = getDb();
    const { data: brief, error } = await db
      .from("briefs")
      .select("user_id")
      .eq("id", req.params.id)
      .maybeSingle();

    if (!brief) {
      return res.status(404).json({ error: "Brief not found" });
    }

    if (brief.user_id !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await db
      .from("briefs")
      .update({ original_text: improvedBrief, status: "draft" })
      .eq("id", req.params.id);

    emit("brief.rebuilt", {
      userId: req.user.id,
      briefId: req.params.id,
      saved: true,
    });

    res.json({ success: true, message: "Improved brief saved" });
  } catch (err) {
    console.error("saveImprovedBrief error:", err);
    res.status(500).json({ error: "Failed to save improved brief" });
  }
};
