const { getDb } = require("../utils/db");
const { getGoogleDocsUrl, exportToNotion, getNotionStatus } = require("../services/exportService");

function loadBrief(id, userId) {
  const db = getDb();
  const result = db.exec(
    `SELECT id, user_id, original_text, analyzed_text, client_name, project_name
     FROM briefs WHERE id = ?`,
    [id]
  );
  if (!result[0]?.values.length) return { error: "not_found" };
  const row = result[0].values[0];
  if (row[1] !== userId) return { error: "forbidden" };
  return {
    id: row[0],
    clientName: row[4],
    projectName: row[5],
    originalText: row[2],
    analyzedText: row[3] ? JSON.parse(row[3]) : null,
    improvedText: null,
  };
}

function resolveContent(brief, providedImproved) {
  if (providedImproved && typeof providedImproved === "string") {
    return providedImproved;
  }
  return brief.originalText;
}

exports.getIntegrationsStatus = (req, res) => {
  res.json(getNotionStatus());
};

exports.getGoogleDocsExport = (req, res) => {
  const brief = loadBrief(req.params.id, req.user.id);
  if (brief.error === "not_found") return res.status(404).json({ error: "Brief not found" });
  if (brief.error === "forbidden") return res.status(403).json({ error: "Not authorized" });

  const improvedText = resolveContent(brief, req.query.improvedText);
  const title = `Brief: ${brief.clientName} — ${brief.projectName}`;
  const result = getGoogleDocsUrl({ title, body: improvedText });

  if (result.truncated) {
    return res.json({
      url: null,
      truncated: true,
      length: result.length,
      limit: result.limit,
      message: `Brief is ${result.length} chars (limit ${result.limit}). Open a blank Google Doc and paste the content instead.`,
      blankDocUrl: "https://docs.google.com/document/create",
    });
  }

  res.json({ url: result.url, truncated: false });
};

exports.postNotionExport = async (req, res) => {
  const brief = loadBrief(req.params.id, req.user.id);
  if (brief.error === "not_found") return res.status(404).json({ error: "Brief not found" });
  if (brief.error === "forbidden") return res.status(403).json({ error: "Not authorized" });

  const improvedText = resolveContent(brief, req.body?.improvedText);
  const title = `Brief: ${brief.clientName} — ${brief.projectName}`;

  try {
    const result = await exportToNotion({ title, content: improvedText });
    res.json({ success: true, pageId: result.pageId, pageUrl: result.pageUrl });
  } catch (err) {
    if (err.code === "NOT_CONFIGURED") {
      return res.status(503).json({
        error: "Notion is not configured",
        code: "NOT_CONFIGURED",
        message: "Set NOTION_API_KEY and NOTION_DATABASE_ID in backend/.env and restart the server.",
      });
    }
    console.error("Notion export error:", err);
    res.status(err.status || 500).json({
      error: "Failed to save to Notion",
      message: err.message,
    });
  }
};
