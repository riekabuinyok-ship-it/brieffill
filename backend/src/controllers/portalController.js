const { getDb, save } = require("../utils/db");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");

const PORTAL_UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads", "portal");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = [
      "text/plain", "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ].includes(file.mimetype)
      || /\.(txt|docx|pdf|jpg|jpeg|png|gif|webp|xls|xlsx|csv|zip)$/i.test(file.originalname);
    cb(ok ? null : new Error("Unsupported file type"), ok);
  },
});

function generateToken() {
  return crypto.randomUUID();
}

function tryParseJson(str) {
  if (!str) return null;
  try { return JSON.parse(str); } catch { return str; }
}

exports.createPortal = (req, res) => {
  try {
    const db = getDb();
    const brief = db.exec(
      "SELECT id, user_id, client_name, project_name FROM briefs WHERE id = ?",
      [req.params.id]
    );
    if (!brief[0]?.values.length) return res.status(404).json({ error: "Brief not found" });
    if (brief[0].values[0][1] !== req.user.id) return res.status(403).json({ error: "Not authorized" });

    const existing = db.exec(
      "SELECT id, token, created_at, view_count, is_active, last_activity, expires_at FROM collaboration_portals WHERE brief_id = ? AND is_active = 1 ORDER BY id DESC LIMIT 1",
      [req.params.id]
    );
    if (existing[0]?.values.length) {
      const row = existing[0].values[0];
      return res.json({
        id: row[0], token: row[1], createdAt: row[2],
        viewCount: row[3], isActive: !!row[4], lastActivity: row[5], expiresAt: row[6],
      });
    }

    const token = generateToken();
    db.run(
      "INSERT INTO collaboration_portals (brief_id, token) VALUES (?, ?)",
      [req.params.id, token]
    );
    const id = db.exec("SELECT last_insert_rowid() AS id")[0].values[0][0];
    save();
    res.status(201).json({ id, token, createdAt: new Date().toISOString(), viewCount: 0, isActive: true, lastActivity: null, expiresAt: null });
  } catch (err) {
    console.error("createPortal error:", err);
    res.status(500).json({ error: "Failed to create portal" });
  }
};

exports.getPortal = (req, res) => {
  try {
    const db = getDb();
    const portal = db.exec(
      `SELECT cp.id, cp.brief_id, cp.token, cp.view_count, cp.is_active, cp.last_activity, cp.created_at, cp.expires_at,
              b.client_name, b.project_name, b.analyzed_text
       FROM collaboration_portals cp JOIN briefs b ON b.id = cp.brief_id
       WHERE cp.token = ?`,
      [req.params.token]
    );
    if (!portal[0]?.values.length) return res.status(404).json({ error: "Portal not found" });

    const row = portal[0].values[0];
    if (!row[4]) return res.status(410).json({ error: "This portal is no longer active" });

    db.run("UPDATE collaboration_portals SET view_count = view_count + 1, last_activity = datetime('now') WHERE id = ?", [row[0]]);
    save();

    const analysis = tryParseJson(row[10]);
    const fields = (analysis?.fields || []).map((f, i) => ({
      id: `field_${i}`,
      name: f.name,
      question: f.question || `Please provide information about: ${f.name}`,
      status: f.status,
    }));

    const responses = db.exec(
      "SELECT field_name, response, updated_at FROM portal_responses WHERE portal_id = ?",
      [row[0]]
    );
    const responseMap = {};
    (responses[0]?.values || []).forEach((r) => {
      responseMap[r[0]] = { response: r[1], updatedAt: r[2] };
    });

    const files = db.exec(
      "SELECT id, field_name, file_name, file_size, mime_type, uploaded_at FROM portal_files WHERE portal_id = ? ORDER BY uploaded_at DESC",
      [row[0]]
    );

    res.json({
      id: row[0],
      briefId: row[1],
      token: row[2],
      clientName: row[7],
      projectName: row[8],
      fields,
      responses: responseMap,
      files: (files[0]?.values || []).map((f) => ({
        id: f[0], fieldName: f[1], fileName: f[2], fileSize: f[3], mimeType: f[4], uploadedAt: f[5],
      })),
      viewCount: row[3] + 1,
      isActive: !!row[4],
      lastActivity: row[5],
      createdAt: row[6],
      expiresAt: row[8],
    });
  } catch (err) {
    console.error("getPortal error:", err);
    res.status(500).json({ error: "Failed to load portal" });
  }
};

exports.saveResponses = (req, res) => {
  try {
    const { responses } = req.body;
    if (!responses || !Array.isArray(responses)) return res.status(400).json({ error: "responses array is required" });

    const db = getDb();
    const portal = db.exec(
      "SELECT id, is_active FROM collaboration_portals WHERE token = ?",
      [req.params.token]
    );
    if (!portal[0]?.values.length) return res.status(404).json({ error: "Portal not found" });
    if (!portal[0].values[0][1]) return res.status(410).json({ error: "Portal is no longer active" });

    const portalId = portal[0].values[0][0];

    for (const r of responses) {
      const { fieldName, response } = r;
      if (!fieldName) continue;
      const existing = db.exec(
        "SELECT id FROM portal_responses WHERE portal_id = ? AND field_name = ?",
        [portalId, fieldName]
      );
      if (existing[0]?.values.length) {
        db.run(
          "UPDATE portal_responses SET response = ?, updated_at = datetime('now') WHERE portal_id = ? AND field_name = ?",
          [response, portalId, fieldName]
        );
      } else {
        db.run(
          "INSERT INTO portal_responses (portal_id, field_name, response) VALUES (?, ?, ?)",
          [portalId, fieldName, response]
        );
      }
    }

    db.run("UPDATE collaboration_portals SET last_activity = datetime('now') WHERE id = ?", [portalId]);
    save();
    res.json({ saved: true });
  } catch (err) {
    console.error("saveResponses error:", err);
    res.status(500).json({ error: "Failed to save responses" });
  }
};

exports.uploadFile = (req, res) => {
  upload.single("file")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    try {
      const db = getDb();
      const portal = db.exec(
        "SELECT id, is_active FROM collaboration_portals WHERE token = ?",
        [req.params.token]
      );
      if (!portal[0]?.values.length) return res.status(404).json({ error: "Portal not found" });
      if (!portal[0].values[0][1]) return res.status(410).json({ error: "Portal is no longer active" });

      const portalId = portal[0].values[0][0];
      const fieldName = req.body.fieldName || null;
      const ext = path.extname(req.file.originalname);
      const storedName = `${crypto.randomUUID()}${ext}`;

      if (!fs.existsSync(PORTAL_UPLOAD_DIR)) fs.mkdirSync(PORTAL_UPLOAD_DIR, { recursive: true });
      fs.writeFileSync(path.join(PORTAL_UPLOAD_DIR, storedName), req.file.buffer);

      db.run(
        "INSERT INTO portal_files (portal_id, field_name, file_name, stored_name, file_size, mime_type) VALUES (?, ?, ?, ?, ?, ?)",
        [portalId, fieldName, req.file.originalname, storedName, req.file.buffer.length, req.file.mimetype]
      );
      const fileId = db.exec("SELECT last_insert_rowid() AS id")[0].values[0][0];
      db.run("UPDATE collaboration_portals SET last_activity = datetime('now') WHERE id = ?", [portalId]);
      save();

      res.status(201).json({ id: fileId, fileName: req.file.originalname, fileSize: req.file.buffer.length, mimeType: req.file.mimetype });
    } catch (e) {
      console.error("uploadFile error:", e);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });
};

exports.getFile = (req, res) => {
  try {
    const db = getDb();
    const file = db.exec(
      `SELECT pf.stored_name, pf.file_name, pf.mime_type, pf.file_size, cp.token, cp.is_active
       FROM portal_files pf JOIN collaboration_portals cp ON cp.id = pf.portal_id
       WHERE pf.id = ? AND cp.token = ?`,
      [req.params.fileId, req.params.token]
    );
    if (!file[0]?.values.length) return res.status(404).json({ error: "File not found" });
    const row = file[0].values[0];
    if (!row[4]) return res.status(410).json({ error: "Portal is no longer active" });

    const filePath = path.join(PORTAL_UPLOAD_DIR, row[0]);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found on disk" });

    res.download(filePath, row[1], { headers: { "Content-Type": row[2] } });
  } catch (err) {
    console.error("getFile error:", err);
    res.status(500).json({ error: "Failed to download file" });
  }
};

exports.regenerateToken = (req, res) => {
  try {
    const db = getDb();
    const portal = db.exec(
      "SELECT cp.id, cp.brief_id, b.user_id FROM collaboration_portals cp JOIN briefs b ON b.id = cp.brief_id WHERE cp.token = ?",
      [req.params.token]
    );
    if (!portal[0]?.values.length) return res.status(404).json({ error: "Portal not found" });
    const row = portal[0].values[0];
    if (row[2] !== req.user.id) return res.status(403).json({ error: "Not authorized" });

    const newToken = generateToken();
    db.run("UPDATE collaboration_portals SET token = ? WHERE id = ?", [newToken, row[0]]);
    save();
    res.json({ token: newToken });
  } catch (err) {
    console.error("regenerateToken error:", err);
    res.status(500).json({ error: "Failed to regenerate token" });
  }
};

exports.deactivatePortal = (req, res) => {
  try {
    const db = getDb();
    const portal = db.exec(
      "SELECT cp.id, cp.brief_id, b.user_id FROM collaboration_portals cp JOIN briefs b ON b.id = cp.brief_id WHERE cp.token = ?",
      [req.params.token]
    );
    if (!portal[0]?.values.length) return res.status(404).json({ error: "Portal not found" });
    const row = portal[0].values[0];
    if (row[2] !== req.user.id) return res.status(403).json({ error: "Not authorized" });

    db.run("UPDATE collaboration_portals SET is_active = 0 WHERE id = ?", [row[0]]);
    save();
    res.json({ deactivated: true });
  } catch (err) {
    console.error("deactivatePortal error:", err);
    res.status(500).json({ error: "Failed to deactivate portal" });
  }
};

exports.getPortalStatus = (req, res) => {
  try {
    const db = getDb();
    const brief = db.exec("SELECT id, user_id FROM briefs WHERE id = ?", [req.params.id]);
    if (!brief[0]?.values.length) return res.status(404).json({ error: "Brief not found" });
    if (brief[0].values[0][1] !== req.user.id) return res.status(403).json({ error: "Not authorized" });

    const portal = db.exec(
      "SELECT id, token, view_count, is_active, last_activity, created_at, expires_at FROM collaboration_portals WHERE brief_id = ? ORDER BY id DESC LIMIT 1",
      [req.params.id]
    );
    if (!portal[0]?.values.length) return res.json({ portal: null });

    const row = portal[0].values[0];
    const portalId = row[0];

    const respCount = db.exec(
      "SELECT count(*) FROM portal_responses WHERE portal_id = ?",
      [portalId]
    );
    const completed = respCount[0]?.values[0][0] || 0;

    const files = db.exec(
      "SELECT id, field_name, file_name, file_size, mime_type, uploaded_at FROM portal_files WHERE portal_id = ? ORDER BY uploaded_at DESC",
      [portalId]
    );

    res.json({
      portal: {
        id: portalId, token: row[1], viewCount: row[2], isActive: !!row[3],
        lastActivity: row[4], createdAt: row[5], expiresAt: row[6],
        progress: { completed, total: 12 },
        files: (files[0]?.values || []).map((f) => ({
          id: f[0], fieldName: f[1], fileName: f[2], fileSize: f[3], mimeType: f[4], uploadedAt: f[5],
        })),
      }
    });
  } catch (err) {
    console.error("getPortalStatus error:", err);
    res.status(500).json({ error: "Failed to fetch portal status" });
  }
};

exports.getResponses = (req, res) => {
  try {
    const db = getDb();
    const portal = db.exec(
      `SELECT cp.id, cp.brief_id, b.user_id, b.client_name, b.project_name, b.analyzed_text
       FROM collaboration_portals cp
       JOIN briefs b ON b.id = cp.brief_id
       WHERE cp.token = ? AND b.user_id = ?`,
      [req.params.token, req.user.id]
    );
    if (!portal[0]?.values.length) return res.status(404).json({ error: "Portal not found or not authorized" });

    const row = portal[0].values[0];
    const analysis = tryParseJson(row[5]);

    // Build field list from analysis
    const fields = (analysis?.fields || []).map((f, i) => ({
      id: `field_${i}`,
      name: f.name,
      question: f.question || `Please provide information about: ${f.name}`,
    }));

    // Fetch client responses
    const respRows = db.exec(
      "SELECT field_name, response, updated_at FROM portal_responses WHERE portal_id = ? ORDER BY id",
      [row[0]]
    );
    const responseMap = {};
    (respRows[0]?.values || []).forEach((r) => {
      responseMap[r[0]] = { response: r[1], updatedAt: r[2] };
    });

    // Fetch uploaded files
    const fileRows = db.exec(
      "SELECT id, field_name, file_name, file_size, mime_type, uploaded_at FROM portal_files WHERE portal_id = ? ORDER BY uploaded_at DESC",
      [row[0]]
    );
    const fileMap = {};
    (fileRows[0]?.values || []).forEach((f) => {
      if (!fileMap[f[1]]) fileMap[f[1]] = [];
      fileMap[f[1]].push({ id: f[0], fileName: f[2], fileSize: f[3], mimeType: f[4], uploadedAt: f[5] });
    });

    const merged = fields.map((f) => ({
      ...f,
      ...(responseMap[f.name] || { response: "", updatedAt: null }),
      files: fileMap[f.name] || [],
    }));

    res.json({ projectName: row[4], clientName: row[3], fields: merged });
  } catch (err) {
    console.error("getResponses error:", err);
    res.status(500).json({ error: "Failed to fetch responses" });
  }
};
