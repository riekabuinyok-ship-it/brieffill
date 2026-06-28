const { getDb, save } = require("../utils/db");
const { maskSecret, unmaskSecret, maskPreview } = require("../utils/secrets");

const VALID_PROVIDERS = ["notion", "clickup", "airtable", "webhook"];

const NOTION_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

const CLICKUP_BASE = "https://api.clickup.com/api/v2";
const AIRTABLE_BASE = "https://api.airtable.com/v0";

function getUserIntegration(userId, provider) {
  if (!VALID_PROVIDERS.includes(provider)) return null;
  const db = getDb();
  const row = db.exec(
    "SELECT api_key, target_id, target_id_2, webhook_url, webhook_events, updated_at FROM user_integrations WHERE user_id = ? AND provider = ?",
    [userId, provider]
  )[0]?.values?.[0];
  if (!row) return null;
  let events = [];
  if (row[4]) {
    try { events = JSON.parse(row[4]); } catch { events = []; }
  }
  return {
    provider,
    hasKey: !!row[0],
    apiKeyPreview: maskPreview(row[0]),
    targetId: row[1] || null,
    targetId2: row[2] || null,
    webhookUrl: row[3] || null,
    webhookEvents: events,
    updatedAt: row[5],
  };
}

function getAllUserIntegrations(userId) {
  return VALID_PROVIDERS.map((p) => getUserIntegration(userId, p)).filter(Boolean);
}

function setUserIntegration(userId, provider, fields) {
  if (!VALID_PROVIDERS.includes(provider)) {
    throw new Error(`Unknown provider: ${provider}`);
  }
  const db = getDb();
  const existing = getUserIntegration(userId, provider);
  const existingKey = db.exec(
    "SELECT api_key FROM user_integrations WHERE user_id = ? AND provider = ?",
    [userId, provider]
  )[0]?.values?.[0]?.[0];

  let storedKey = existingKey || null;
  if (fields.apiKey !== undefined && fields.apiKey !== null) {
    if (fields.apiKey === "") {
      storedKey = null;
    } else if (typeof fields.apiKey === "string") {
      storedKey = maskSecret(fields.apiKey);
    }
  }

  const targetId = fields.targetId !== undefined ? (fields.targetId || null) : (existing?.targetId || null);
  const targetId2 = fields.targetId2 !== undefined ? (fields.targetId2 || null) : (existing?.targetId2 || null);
  const webhookUrl = fields.webhookUrl !== undefined ? (fields.webhookUrl || null) : (existing?.webhookUrl || null);
  const webhookEvents = fields.webhookEvents !== undefined
    ? JSON.stringify(Array.isArray(fields.webhookEvents) ? fields.webhookEvents : [])
    : (existing ? JSON.stringify(existing.webhookEvents) : "[]");

  if (existing) {
    db.run(
      `UPDATE user_integrations SET api_key = ?, target_id = ?, target_id_2 = ?, webhook_url = ?, webhook_events = ?, updated_at = datetime('now')
       WHERE user_id = ? AND provider = ?`,
      [storedKey, targetId, targetId2, webhookUrl, webhookEvents, userId, provider]
    );
  } else {
    db.run(
      `INSERT INTO user_integrations (user_id, provider, api_key, target_id, target_id_2, webhook_url, webhook_events, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [userId, provider, storedKey, targetId, targetId2, webhookUrl, webhookEvents]
    );
  }
  save();
  return getUserIntegration(userId, provider);
}

function deleteUserIntegration(userId, provider) {
  if (!VALID_PROVIDERS.includes(provider)) return false;
  const db = getDb();
  db.run("DELETE FROM user_integrations WHERE user_id = ? AND provider = ?", [userId, provider]);
  const changes = db.exec("SELECT changes() AS n")[0]?.values?.[0]?.[0] || 0;
  save();
  return changes > 0;
}

async function testProvider(userId, provider) {
  if (provider === "notion") {
    return testNotion(userId);
  } else if (provider === "clickup") {
    return testClickUp(userId);
  } else if (provider === "airtable") {
    return testAirtable(userId);
  } else if (provider === "webhook") {
    return testWebhook(userId);
  }
  throw new Error(`Unknown provider: ${provider}`);
}

async function fetchOk(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();
  return { ok: res.ok, status: res.status, text, json: safeJson(text) };
}

function safeJson(s) {
  try { return JSON.parse(s); } catch { return null; }
}

async function testNotion(userId) {
  const stored = getUserIntegration(userId, "notion");
  const apiKey = stored?.hasKey ? unmaskSecret(dbKey(userId, "notion")) : null;
  const key = apiKey || process.env.NOTION_API_KEY;
  const dbId = stored?.targetId || process.env.NOTION_DATABASE_ID;
  if (!key) return { ok: false, message: "No Notion API key configured" };
  if (!dbId) return { ok: false, message: "No Notion database ID configured" };
  try {
    const r = await fetchOk(`${NOTION_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${key}`, "Notion-Version": NOTION_VERSION },
    });
    if (!r.ok) return { ok: false, message: `Notion rejected the key (${r.status})` };
    const botName = r.json?.bot?.workspace_name || r.json?.name || "Notion";
    return { ok: true, message: `Connected to ${botName}` };
  } catch (err) {
    return { ok: false, message: `Network error: ${err.message}` };
  }
}

function dbKey(userId, provider) {
  const db = getDb();
  return db.exec(
    "SELECT api_key FROM user_integrations WHERE user_id = ? AND provider = ?",
    [userId, provider]
  )[0]?.values?.[0]?.[0] || null;
}

async function testClickUp(userId) {
  const stored = getUserIntegration(userId, "clickup");
  if (!stored?.hasKey) return { ok: false, message: "ClickUp API key not configured" };
  if (!stored.targetId) return { ok: false, message: "ClickUp list ID not configured" };
  const apiKey = unmaskSecret(dbKey(userId, "clickup"));
  try {
    const r = await fetchOk(`${CLICKUP_BASE}/list/${stored.targetId}`, {
      headers: { Authorization: apiKey },
    });
    if (!r.ok) return { ok: false, message: `ClickUp rejected the key or list (${r.status})` };
    const name = r.json?.name || "list";
    return { ok: true, message: `Connected to list "${name}"` };
  } catch (err) {
    return { ok: false, message: `Network error: ${err.message}` };
  }
}

async function testAirtable(userId) {
  const stored = getUserIntegration(userId, "airtable");
  if (!stored?.hasKey) return { ok: false, message: "Airtable API key not configured" };
  if (!stored.targetId) return { ok: false, message: "Airtable base ID not configured" };
  if (!stored.targetId2) return { ok: false, message: "Airtable table ID not configured" };
  const apiKey = unmaskSecret(dbKey(userId, "airtable"));
  try {
    const r = await fetchOk(`${AIRTABLE_BASE}/${stored.targetId}/${stored.targetId2}?maxRecords=1`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!r.ok) return { ok: false, message: `Airtable rejected the key, base, or table (${r.status})` };
    return { ok: true, message: "Connected to Airtable base/table" };
  } catch (err) {
    return { ok: false, message: `Network error: ${err.message}` };
  }
}

async function testWebhook(userId) {
  const stored = getUserIntegration(userId, "webhook");
  if (!stored?.webhookUrl) return { ok: false, message: "Webhook URL not configured" };
  return fireWebhookOnce(userId, stored.webhookUrl, "webhook.test", { hello: "world" });
}

function chunkNotionBlocks(text, maxLen = 2000) {
  if (!text) return [];
  const blocks = [];
  const paragraphs = text.split(/\n\n+/);
  for (const para of paragraphs) {
    if (para.length <= maxLen) {
      blocks.push(para);
    } else {
      for (let i = 0; i < para.length; i += maxLen) {
        blocks.push(para.slice(i, i + maxLen));
      }
    }
  }
  return blocks.map((content) => ({
    object: "block",
    type: "paragraph",
    paragraph: { rich_text: [{ type: "text", text: { content } }] },
  }));
}

async function exportToNotionUser({ userId, brief, content, databaseId, apiKey }) {
  if (!apiKey) throw httpErr(400, "Notion API key missing");
  if (!databaseId) throw httpErr(400, "Notion database ID missing");

  const title = `Brief: ${brief.clientName} — ${brief.projectName}`;
  const children = chunkNotionBlocks(content);
  const r = await fetchOk(`${NOTION_BASE}/pages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties: {
        Name: {
          title: [{ type: "text", text: { content: title } }],
        },
      },
      children: children.slice(0, 100),
    }),
  });
  if (!r.ok) {
    const detail = r.json?.message || r.text.slice(0, 200);
    throw httpErr(502, `Notion API ${r.status}: ${detail}`);
  }
  return { pageUrl: r.json.url, pageId: r.json.id };
}

async function exportToClickUp({ apiKey, listId, content, clientName, projectName, score }) {
  if (!apiKey) throw httpErr(400, "ClickUp API key missing");
  if (!listId) throw httpErr(400, "ClickUp list ID missing");

  const name = `Brief: ${clientName} — ${projectName}`;
  const description = `Completeness score: ${score}%\n\nGenerated by BriefFill on ${new Date().toISOString()}`;
  const r = await fetchOk(`${CLICKUP_BASE}/list/${listId}/task`, {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      description,
      markdown_content: content,
    }),
  });
  if (!r.ok) {
    const detail = r.json?.err || r.text.slice(0, 200);
    throw httpErr(502, `ClickUp API ${r.status}: ${detail}`);
  }
  return { taskUrl: r.json.url, taskId: r.json.id };
}

async function exportToAirtable({ apiKey, baseId, tableId, content, clientName, projectName, score }) {
  if (!apiKey) throw httpErr(400, "Airtable API key missing");
  if (!baseId || !tableId) throw httpErr(400, "Airtable base and table IDs are required");

  const r = await fetchOk(`${AIRTABLE_BASE}/${baseId}/${tableId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      records: [
        {
          fields: {
            Name: `${clientName} — ${projectName}`,
            Client: clientName,
            Project: projectName,
            Score: score,
            Content: content,
            "Imported At": new Date().toISOString(),
          },
        },
      ],
      typecast: true,
    }),
  });
  if (!r.ok) {
    const detail = r.json?.error?.message || r.text.slice(0, 200);
    throw httpErr(502, `Airtable API ${r.status}: ${detail}`);
  }
  const record = r.json?.records?.[0];
  return { recordId: record?.id };
}

function httpErr(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

function logDelivery(userId, event, url, statusCode, responseSnippet, durationMs, error) {
  try {
    const db = getDb();
    db.run(
      `INSERT INTO webhook_deliveries (user_id, event, url, status_code, response_snippet, duration_ms, error)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, event, url, statusCode, (responseSnippet || "").slice(0, 500), durationMs, error || null]
    );
    save();
  } catch (e) {
    console.error("logDelivery error:", e.message);
  }
}

async function fireWebhookOnce(userId, url, event, payload) {
  const start = Date.now();
  const body = JSON.stringify({
    event,
    deliveredAt: new Date().toISOString(),
    userId,
    payload,
  });
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-BriefFill-Event": event },
      body,
      signal: AbortSignal.timeout(10000),
    });
    const text = await r.text();
    const duration = Date.now() - start;
    logDelivery(userId, event, url, r.status, text, duration, null);
    return { ok: r.ok, status: r.status, message: r.ok ? "Webhook delivered" : `Webhook returned ${r.status}`, duration };
  } catch (err) {
    const duration = Date.now() - start;
    logDelivery(userId, event, url, null, null, duration, err.message);
    return { ok: false, message: `Webhook failed: ${err.message}`, duration };
  }
}

async function fireWebhooks(userId, event, payload) {
  const db = getDb();
  const rows = db.exec(
    "SELECT webhook_url, webhook_events FROM user_integrations WHERE user_id = ? AND provider = 'webhook' AND webhook_url IS NOT NULL",
    [userId]
  )[0]?.values || [];

  const results = [];
  for (const [url, eventsJson] of rows) {
    let events = [];
    try { events = JSON.parse(eventsJson); } catch { events = []; }
    if (!Array.isArray(events) || !events.includes(event)) continue;
    const r = await fireWebhookOnce(userId, url, event, payload);
    results.push({ url, ...r });
  }
  return results;
}

function listDeliveries(userId, limit = 20) {
  const db = getDb();
  const rows = db.exec(
    "SELECT id, event, url, status_code, response_snippet, duration_ms, error, created_at FROM webhook_deliveries WHERE user_id = ? ORDER BY id DESC LIMIT ?",
    [userId, limit]
  )[0]?.values || [];
  return rows.map((r) => ({
    id: r[0],
    event: r[1],
    url: r[2],
    statusCode: r[3],
    responseSnippet: r[4],
    durationMs: r[5],
    error: r[6],
    createdAt: r[7],
  }));
}

module.exports = {
  VALID_PROVIDERS,
  getUserIntegration,
  getAllUserIntegrations,
  setUserIntegration,
  deleteUserIntegration,
  testProvider,
  exportToNotionUser,
  exportToClickUp,
  exportToAirtable,
  fireWebhooks,
  fireWebhookOnce,
  listDeliveries,
};
