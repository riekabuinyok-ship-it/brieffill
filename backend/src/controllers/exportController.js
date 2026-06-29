const { getDb } = require("../utils/db");
const { getGoogleDocsUrl, createGoogleDoc, exportToNotion, getNotionStatus } = require("../services/exportService");

async function loadBrief(id, userId) {
  const db = getDb();
  const { data: brief, error } = await db
    .from("briefs")
    .select("id, user_id, original_text, analyzed_text, client_name, project_name")
    .eq("id", id)
    .maybeSingle();

  if (!brief) return { error: "not_found" };
  if (brief.user_id !== userId) return { error: "forbidden" };
  return {
    id: brief.id,
    clientName: brief.client_name,
    projectName: brief.project_name,
    originalText: brief.original_text,
    analyzedText: brief.analyzed_text,
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

exports.getGoogleDocsExport = async (req, res) => {
  const brief = await loadBrief(req.params.id, req.user.id);
  if (brief.error === "not_found") return res.status(404).json({ error: "Brief not found" });
  if (brief.error === "forbidden") return res.status(403).json({ error: "Not authorized" });

  const improvedText = resolveContent(brief, req.query.improvedText);
  const title = `Brief: ${brief.clientName} — ${brief.projectName}`;
  const userEmail = req.user.email;

  console.log("Google Docs export requested:", { briefId: req.params.id, title, contentLength: improvedText?.length, userEmail });

  // Try Google Docs API (service account) first
  try {
    const apiResult = await createGoogleDoc({ title, body: improvedText, userEmail });
    console.log("Google Docs API success:", apiResult.url);
    return res.json({ url: apiResult.url, truncated: false, method: "api" });
  } catch (apiErr) {
    if (apiErr.code === "NOT_CONFIGURED") {
      console.log("Google Docs API not configured, falling back to URL trick");
    } else {
      console.error("Google Docs API error:", apiErr.message);
    }
  }

  // Fallback: URL trick (title only — body param is unreliable, frontend copies content)
  const result = getGoogleDocsUrl({ title, body: improvedText });
  console.log("Google Docs URL trick fallback: title URL length =", result.length);

  res.json({ url: result.url, truncated: false, method: "url", pasteHint: true });
};

exports.postNotionExport = async (req, res) => {
  const brief = await loadBrief(req.params.id, req.user.id);
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
