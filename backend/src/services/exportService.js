const { isConfigured, createDocument } = require("./googleService");

const NOTION_API_KEY = process.env.NOTION_API_KEY || "";
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || "";
const NOTION_API_VERSION = "2022-06-28";
const NOTION_BASE = "https://api.notion.com/v1";

// Fallback URL limit when service account is not configured
const GOOGLE_DOCS_URL_LIMIT = 7500;

function getNotionStatus() {
  return {
    notion: {
      configured: Boolean(NOTION_API_KEY && NOTION_DATABASE_ID),
      hasKey: Boolean(NOTION_API_KEY),
      hasDatabase: Boolean(NOTION_DATABASE_ID),
    },
  };
}

// Google Docs: prefer the API (service account), fall back to URL trick.
// The ?body= parameter is unreliable (Google often ignores it → blank doc),
// so we only pass title and let the frontend copy content to clipboard.
function getGoogleDocsUrl({ title, body }) {
  const safeTitle = (title || "BriefFill Brief").slice(0, 200);
  const titleUrl = `https://docs.google.com/document/create?title=${encodeURIComponent(safeTitle)}`;
  return { url: titleUrl, truncated: false, length: titleUrl.length, limit: GOOGLE_DOCS_URL_LIMIT };
}

async function createGoogleDoc({ title, body, userEmail }) {
  if (!isConfigured()) {
    throw Object.assign(new Error("Google Docs API not configured"), { code: "NOT_CONFIGURED" });
  }
  const result = await createDocument({ title, content: body, userEmail });
  return result;
}

// Notion: create a new page in the configured database with the brief as content.
// Splits long content into multiple text blocks (Notion's per-block limit is 2000 chars).
async function exportToNotion({ title, content }) {
  if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
    const err = new Error("Notion is not configured on the server");
    err.code = "NOT_CONFIGURED";
    throw err;
  }

  const safeTitle = (title || "BriefFill Brief").slice(0, 200);
  const blocks = chunkIntoBlocks(content || "", 2000);

  // Build the page payload. The database must have a "title" property —
  // we send the title under every common property name to be permissive.
  const payload = {
    parent: { database_id: NOTION_DATABASE_ID },
    properties: {
      Name: {
        title: [{ type: "text", text: { content: safeTitle } }],
      },
    },
    children: blocks,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(`${NOTION_BASE}/pages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NOTION_API_KEY}`,
        "Notion-Version": NOTION_API_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errBody = await res.text();
      let msg = `Notion API returned ${res.status}`;
      try {
        const parsed = JSON.parse(errBody);
        msg = parsed.message || msg;
      } catch {}
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }

    const data = await res.json();
    return {
      pageId: data.id,
      pageUrl: data.url,
    };
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      const e = new Error("Notion API request timed out after 20 seconds");
      throw e;
    }
    throw err;
  }
}

function chunkIntoBlocks(text, chunkSize) {
  const blocks = [];
  if (!text) return blocks;
  let remaining = text;
  while (remaining.length > 0) {
    const chunk = remaining.slice(0, chunkSize);
    remaining = remaining.slice(chunkSize);
    // Prefer splitting on paragraph boundaries for cleaner Notion display
    let cutPoint = chunk.length;
    if (remaining.length > 0) {
      const lastNewline = chunk.lastIndexOf("\n");
      if (lastNewline > chunkSize * 0.5) cutPoint = lastNewline + 1;
    }
    const finalChunk = chunk.slice(0, cutPoint);
    remaining = chunk.slice(cutPoint) + remaining;
    blocks.push({
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [{ type: "text", text: { content: finalChunk } }],
      },
    });
  }
  return blocks;
}

module.exports = { getGoogleDocsUrl, createGoogleDoc, exportToNotion, getNotionStatus };
