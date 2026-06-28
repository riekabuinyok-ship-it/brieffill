const {
  getAllUserIntegrations,
  setUserIntegration,
  deleteUserIntegration,
  testProvider,
  listDeliveries,
  VALID_PROVIDERS,
  exportToClickUp,
  exportToAirtable,
  exportToNotionUser,
} = require("../services/integrationService");
const { getDb } = require("../utils/db");
const { unmaskSecret } = require("../utils/secrets");

function shapeForFrontend(row) {
  if (!row) return { configured: false };
  const configured = providerConfigured(row.provider, row);
  return {
    configured,
    hasKey: row.hasKey,
    apiKeyPreview: row.apiKeyPreview,
    targetId: row.targetId,
    targetId2: row.targetId2,
    webhookUrl: row.webhookUrl,
    webhookEvents: row.webhookEvents,
    updatedAt: row.updatedAt,
  };
}

function providerConfigured(provider, row) {
  if (!row) return false;
  if (provider === "notion") {
    return !!row.hasKey && !!row.targetId;
  } else if (provider === "clickup") {
    return !!row.hasKey && !!row.targetId;
  } else if (provider === "airtable") {
    return !!row.hasKey && !!row.targetId && !!row.targetId2;
  } else if (provider === "webhook") {
    return !!row.webhookUrl && Array.isArray(row.webhookEvents) && row.webhookEvents.length > 0;
  }
  return false;
}

exports.getIntegrationsStatus = (req, res) => {
  const all = getAllUserIntegrations(req.user.id);
  const out = {};
  for (const p of VALID_PROVIDERS) {
    const row = all.find((r) => r.provider === p);
    out[p] = shapeForFrontend(row);
  }
  res.json({ integrations: out, deliveries: listDeliveries(req.user.id, 20) });
};

exports.upsertIntegration = async (req, res) => {
  try {
    const { provider } = req.params;
    if (!VALID_PROVIDERS.includes(provider)) {
      return res.status(400).json({ error: "Unknown provider" });
    }
    const body = req.body || {};
    if (provider === "webhook" && body.webhookUrl) {
      try { new URL(body.webhookUrl); } catch {
        return res.status(400).json({ error: "webhookUrl must be a valid URL" });
      }
    }
    if (Array.isArray(body.webhookEvents)) {
      for (const e of body.webhookEvents) {
        if (typeof e !== "string") return res.status(400).json({ error: "webhookEvents must be an array of strings" });
      }
    }
    const row = setUserIntegration(req.user.id, provider, {
      apiKey: body.apiKey,
      targetId: body.targetId,
      targetId2: body.targetId2,
      webhookUrl: body.webhookUrl,
      webhookEvents: body.webhookEvents,
    });
    res.json({ integration: shapeForFrontend(row) });
  } catch (err) {
    console.error("upsertIntegration error:", err);
    res.status(500).json({ error: "Failed to save integration" });
  }
};

exports.deleteIntegration = (req, res) => {
  const { provider } = req.params;
  if (!VALID_PROVIDERS.includes(provider)) {
    return res.status(400).json({ error: "Unknown provider" });
  }
  const ok = deleteUserIntegration(req.user.id, provider);
  res.json({ success: ok });
};

exports.testIntegration = async (req, res) => {
  try {
    const { provider } = req.params;
    if (!VALID_PROVIDERS.includes(provider)) {
      return res.status(400).json({ error: "Unknown provider" });
    }
    const result = await testProvider(req.user.id, provider);
    res.json(result);
  } catch (err) {
    console.error("testIntegration error:", err);
    res.status(500).json({ ok: false, message: "Test failed" });
  }
};

function loadBriefForUser(briefId, userId) {
  const db = getDb();
  const row = db.exec(
    "SELECT id, user_id, client_name, project_name, original_text, completeness_score FROM briefs WHERE id = ?",
    [briefId]
  )[0]?.values?.[0];
  if (!row) return { error: "not_found" };
  if (row[1] !== userId) return { error: "forbidden" };
  return {
    id: row[0],
    clientName: row[2],
    projectName: row[3],
    content: row[4],
    score: row[5],
  };
}

exports.exportToClickUp = async (req, res) => {
  try {
    const brief = loadBriefForUser(req.params.id, req.user.id);
    if (brief.error === "not_found") return res.status(404).json({ error: "Brief not found" });
    if (brief.error === "forbidden") return res.status(403).json({ error: "Not authorized" });

    const db = getDb();
    const stored = db.exec(
      "SELECT api_key, target_id FROM user_integrations WHERE user_id = ? AND provider = 'clickup'",
      [req.user.id]
    )[0]?.values?.[0];
    if (!stored || !stored[0] || !stored[1]) {
      return res.status(400).json({ error: "ClickUp is not configured. Add it in Integrations." });
    }
    const apiKey = unmaskSecret(stored[0]);
    const listId = req.body?.listId || stored[1];
    const improvedText = typeof req.body?.improvedText === "string" ? req.body.improvedText : null;
    const content = improvedText || brief.content;

    const r = await exportToClickUp({
      apiKey, listId, content,
      clientName: brief.clientName, projectName: brief.projectName, score: brief.score,
    });
    res.json({ ok: true, ...r });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error("exportToClickUp error:", err);
    res.status(500).json({ error: "Failed to send to ClickUp" });
  }
};

exports.exportToAirtable = async (req, res) => {
  try {
    const brief = loadBriefForUser(req.params.id, req.user.id);
    if (brief.error === "not_found") return res.status(404).json({ error: "Brief not found" });
    if (brief.error === "forbidden") return res.status(403).json({ error: "Not authorized" });

    const db = getDb();
    const stored = db.exec(
      "SELECT api_key, target_id, target_id_2 FROM user_integrations WHERE user_id = ? AND provider = 'airtable'",
      [req.user.id]
    )[0]?.values?.[0];
    if (!stored || !stored[0] || !stored[1] || !stored[2]) {
      return res.status(400).json({ error: "Airtable is not configured. Add it in Integrations." });
    }
    const apiKey = unmaskSecret(stored[0]);
    const baseId = req.body?.baseId || stored[1];
    const tableId = req.body?.tableId || stored[2];
    const improvedText = typeof req.body?.improvedText === "string" ? req.body.improvedText : null;
    const content = improvedText || brief.content;

    const r = await exportToAirtable({
      apiKey, baseId, tableId, content,
      clientName: brief.clientName, projectName: brief.projectName, score: brief.score,
    });
    res.json({ ok: true, ...r });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error("exportToAirtable error:", err);
    res.status(500).json({ error: "Failed to send to Airtable" });
  }
};

exports.exportToNotionUser = async (req, res) => {
  try {
    const brief = loadBriefForUser(req.params.id, req.user.id);
    if (brief.error === "not_found") return res.status(404).json({ error: "Brief not found" });
    if (brief.error === "forbidden") return res.status(403).json({ error: "Not authorized" });

    const db = getDb();
    const stored = db.exec(
      "SELECT api_key, target_id FROM user_integrations WHERE user_id = ? AND provider = 'notion'",
      [req.user.id]
    )[0]?.values?.[0];
    if (!stored || !stored[0] || !stored[1]) {
      return res.status(400).json({ error: "Notion (per-user) is not configured. Add it in Integrations or use the server-wide Notion." });
    }
    const apiKey = unmaskSecret(stored[0]);
    const databaseId = req.body?.databaseId || stored[1];
    const improvedText = typeof req.body?.improvedText === "string" ? req.body.improvedText : null;
    const content = improvedText || brief.content;

    const r = await exportToNotionUser({ userId: req.user.id, brief, content, databaseId, apiKey });
    res.json({ ok: true, ...r });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error("exportToNotionUser error:", err);
    res.status(500).json({ error: "Failed to send to Notion" });
  }
};
