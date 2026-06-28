const { getDb } = require("../utils/db");
const { maskSecret, unmaskSecret, maskPreview } = require("../utils/secrets");

const VALID_PROVIDERS = ["notion", "clickup", "airtable", "webhook"];

const NOTION_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

const CLICKUP_BASE = "https://api.clickup.com/api/v2";
const AIRTABLE_BASE = "https://api.airtable.com/v0";

async function getUserIntegration(userId, provider) {
  if (!VALID_PROVIDERS.includes(provider)) return null;
  const db = getDb();
  const { data, error } = await db
    .from("user_integrations")
    .select("api_key, target_id, target_id_2, webhook_url, webhook_events, updated_at")
    .eq("user_id", userId)
    .eq("provider", provider)
    .maybeSingle();
  if (!data) return null;
  const events = Array.isArray(data.webhook_events) ? data.webhook_events : [];
  return {
    provider,
    hasKey: !!data.api_key,
    apiKeyPreview: maskPreview(data.api_key),
    targetId: data.target_id || null,
    targetId2: data.target_id_2 || null,
    webhookUrl: data.webhook_url || null,
    webhookEvents: events,
    updatedAt: data.updated_at,
  };
}

async function getAllUserIntegrations(userId) {
  const results = await Promise.all(
    VALID_PROVIDERS.map((p) => getUserIntegration(userId, p))
  );
  return results.filter(Boolean);
}

async function setUserIntegration(userId, provider, fields) {
  if (!VALID_PROVIDERS.includes(provider)) {
    throw new Error(`Unknown provider: ${provider}`);
  }
  const db = getDb();
  const existing = await getUserIntegration(userId, provider);

  const { data: keyRow } = await db
    .from("user_integrations")
    .select("api_key")
    .eq("user_id", userId)
    .eq("provider", provider)
    .maybeSingle();
  const existingKey = keyRow?.api_key || null;

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
    ? (Array.isArray(fields.webhookEvents) ? fields.webhookEvents : [])
    : (existing ? existing.webhookEvents : []);

  const now = new Date().toISOString();
  const payload = {
    api_key: storedKey,
    target_id: targetId,
    target_id_2: targetId2,
    webhook_url: webhookUrl,
    webhook_events: webhookEvents,
    updated_at: now,
  };

  if (existing) {
    await db
      .from("user_integrations")
      .update(payload)
      .eq("user_id", userId)
      .eq("provider", provider);
  } else {
    await db
      .from("user_integrations")
      .insert({ ...payload, user_id: userId, provider });
  }

  return getUserIntegration(userId, provider);
}

async function deleteUserIntegration(userId, provider) {
  if (!VALID_PROVIDERS.includes(provider)) return false;
  const db = getDb();
  const { data, error } = await db
    .from("user_integrations")
    .delete()
    .eq("user_id", userId)
    .eq("provider", provider)
    .select();
  if (error) throw error;
  return (data || []).length > 0;
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
  const stored = await getUserIntegration(userId, "notion");
  const apiKey = stored?.hasKey ? unmaskSecret(await dbKey(userId, "notion")) : null;
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

async function dbKey(userId, provider) {
  const db = getDb();
  const { data, error } = await db
    .from("user_integrations")
    .select("api_key")
    .eq("user_id", userId)
    .eq("provider", provider)
    .maybeSingle();
  return data?.api_key || null;
}

async function testClickUp(userId) {
  const stored = await getUserIntegration(userId, "clickup");
  if (!stored?.hasKey) return { ok: false, message: "ClickUp API key not configured" };
  if (!stored.targetId) return { ok: false, message: "ClickUp list ID not configured" };
  const apiKey = unmaskSecret(await dbKey(userId, "clickup"));
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
  const stored = await getUserIntegration(userId, "airtable");
  if (!stored?.hasKey) return { ok: false, message: "Airtable API key not configured" };
  if (!stored.targetId) return { ok: false, message: "Airtable base ID not configured" };
  if (!stored.targetId2) return { ok: false, message: "Airtable table ID not configured" };
  const apiKey = unmaskSecret(await dbKey(userId, "airtable"));
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
  const stored = await getUserIntegration(userId, "webhook");
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

async function logDelivery(userId, event, url, statusCode, responseSnippet, durationMs, error) {
  try {
    const db = getDb();
    await db
      .from("webhook_deliveries")
      .insert({
        user_id: userId,
        event,
        url,
        status_code: statusCode,
        response_snippet: (responseSnippet || "").slice(0, 500),
        duration_ms: durationMs,
        error: error || null,
      });
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
  const { data, error } = await db
    .from("user_integrations")
    .select("webhook_url, webhook_events")
    .eq("user_id", userId)
    .eq("provider", "webhook")
    .not("webhook_url", "is", null);

  const results = [];
  for (const row of data || []) {
    const events = Array.isArray(row.webhook_events) ? row.webhook_events : [];
    if (!events.includes(event)) continue;
    const r = await fireWebhookOnce(userId, row.webhook_url, event, payload);
    results.push({ url: row.webhook_url, ...r });
  }
  return results;
}

async function listDeliveries(userId, limit = 20) {
  const db = getDb();
  const { data, error } = await db
    .from("webhook_deliveries")
    .select("id, event, url, status_code, response_snippet, duration_ms, error, created_at")
    .eq("user_id", userId)
    .order("id", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    event: row.event,
    url: row.url,
    statusCode: row.status_code,
    responseSnippet: row.response_snippet,
    durationMs: row.duration_ms,
    error: row.error,
    createdAt: row.created_at,
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
