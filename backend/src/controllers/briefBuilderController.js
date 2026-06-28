const { getDb, save } = require("../utils/db");
const { improveBrief } = require("../services/briefBuilderService");
const { emit } = require("../services/eventService");

exports.buildBrief = async (req, res) => {
  try {
    const db = getDb();
    const result = db.exec(
      `SELECT id, user_id, original_text, analyzed_text, client_name, project_name
       FROM briefs WHERE id = ?`,
      [req.params.id]
    );

    if (!result[0]?.values.length) {
      return res.status(404).json({ error: "Brief not found" });
    }

    const row = result[0].values[0];
    if (row[1] !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to build this brief" });
    }

    const originalBrief = row[2];
    const analysis = row[3] ? JSON.parse(row[3]) : null;

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
      clientName: row[4],
      projectName: row[5],
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

exports.saveImprovedBrief = (req, res) => {
  try {
    const { improvedBrief } = req.body;
    if (!improvedBrief || typeof improvedBrief !== "string") {
      return res.status(400).json({ error: "improvedBrief is required" });
    }

    const db = getDb();
    const result = db.exec(
      `SELECT user_id FROM briefs WHERE id = ?`,
      [req.params.id]
    );

    if (!result[0]?.values.length) {
      return res.status(404).json({ error: "Brief not found" });
    }

    if (result[0].values[0][0] !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    db.run("UPDATE briefs SET original_text = ?, status = 'draft' WHERE id = ?", [improvedBrief, req.params.id]);
    save();

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
