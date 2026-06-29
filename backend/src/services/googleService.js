const jwt = require("jsonwebtoken");

const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "";
const PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const API_KEY = process.env.GOOGLE_DOCS_API_KEY || "";

const SCOPES = [
  "https://www.googleapis.com/auth/documents",
  "https://www.googleapis.com/auth/drive.file",
];

function isConfigured() {
  return Boolean(SERVICE_ACCOUNT_EMAIL && PRIVATE_KEY);
}

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: SERVICE_ACCOUNT_EMAIL,
    scope: SCOPES.join(" "),
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const assertion = jwt.sign(payload, PRIVATE_KEY, { algorithm: "RS256" });
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google OAuth failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  return data.access_token;
}

async function createDocument({ title, content, userEmail }) {
  const token = await getAccessToken();

  // 1. Create the document
  const createRes = await fetch("https://docs.googleapis.com/v1/documents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title: title || "BriefFill Brief" }),
  });
  if (!createRes.ok) {
    const text = await createRes.text();
    throw new Error(`Google Docs create failed (${createRes.status}): ${text}`);
  }
  const doc = await createRes.json();
  console.log("Google doc created:", doc.documentId, "title:", doc.title);

  // 2. Write content into the document
  if (content) {
    const updateRes = await fetch(
      `https://docs.googleapis.com/v1/documents/${doc.documentId}:batchUpdate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: content,
              },
            },
          ],
        }),
      }
    );
    if (!updateRes.ok) {
      const text = await updateRes.text();
      console.error("Google Docs batchUpdate failed:", text);
    } else {
      console.log("Google doc content written:", doc.documentId);
    }
  }

  // 3. Share the document with the user
  if (userEmail) {
    const shareRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${doc.documentId}/permissions?sendNotificationEmail=false`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "writer",
          type: "user",
          emailAddress: userEmail,
        }),
      }
    );
    if (!shareRes.ok) {
      const text = await shareRes.text();
      console.error("Google Drive share failed:", text);
    } else {
      console.log("Google doc shared with:", userEmail);
    }
  }

  return {
    url: `https://docs.google.com/document/d/${doc.documentId}/edit`,
    documentId: doc.documentId,
  };
}

module.exports = { isConfigured, createDocument, getAccessToken };
