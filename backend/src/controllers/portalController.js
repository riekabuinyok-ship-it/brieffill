const { getDb } = require("../utils/db");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");

const PORTAL_UPLOAD_DIR = process.env.VERCEL
  ? path.join("/tmp/uploads/portal")
  : path.join(__dirname, "..", "..", "uploads", "portal");

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

exports.createPortal = async (req, res) => {
  try {
    const db = getDb();

    const { data: brief, error: bErr } = await db
      .from("briefs")
      .select("id, user_id, client_name, project_name")
      .eq("id", req.params.id)
      .maybeSingle();
    if (bErr) return res.status(500).json({ error: bErr.message });
    if (!brief) return res.status(404).json({ error: "Brief not found" });
    if (brief.user_id !== req.user.id) return res.status(403).json({ error: "Not authorized" });

    const { data: existing } = await db
      .from("collaboration_portals")
      .select("id, token, created_at, view_count, is_active, last_activity, expires_at")
      .eq("brief_id", req.params.id)
      .eq("is_active", true)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      return res.json({
        id: existing.id, token: existing.token, createdAt: existing.created_at,
        viewCount: existing.view_count, isActive: existing.is_active,
        lastActivity: existing.last_activity, expiresAt: existing.expires_at,
      });
    }

    const token = generateToken();
    const { data: portal, error: pErr } = await db
      .from("collaboration_portals")
      .insert({ brief_id: req.params.id, token })
      .select("id, token, created_at")
      .single();
    if (pErr) return res.status(500).json({ error: pErr.message });

    res.status(201).json({
      id: portal.id, token: portal.token, createdAt: portal.created_at,
      viewCount: 0, isActive: true, lastActivity: null, expiresAt: null,
    });
  } catch (err) {
    console.error("createPortal error:", err);
    res.status(500).json({ error: "Failed to create portal" });
  }
};

exports.getPortal = async (req, res) => {
  try {
    const db = getDb();

    const { data: portal, error: pErr } = await db
      .from("collaboration_portals")
      .select("id, brief_id, token, view_count, is_active, last_activity, created_at, expires_at, briefs ( client_name, project_name, analyzed_text )")
      .eq("token", req.params.token)
      .maybeSingle();
    if (pErr || !portal) return res.status(404).json({ error: "Portal not found" });
    if (!portal.is_active) return res.status(410).json({ error: "This portal is no longer active" });

    const newViewCount = (portal.view_count || 0) + 1;
    await db
      .from("collaboration_portals")
      .update({ view_count: newViewCount, last_activity: new Date().toISOString() })
      .eq("id", portal.id);

    const analysis = tryParseJson(portal.briefs.analyzed_text);
    const fields = (analysis?.fields || []).map((f, i) => ({
      id: `field_${i}`,
      name: f.name,
      question: f.question || `Please provide information about: ${f.name}`,
      status: f.status,
    }));

    const { data: responses } = await db
      .from("portal_responses")
      .select("field_name, response, updated_at")
      .eq("portal_id", portal.id);
    const responseMap = {};
    (responses || []).forEach((r) => {
      responseMap[r.field_name] = { response: r.response, updatedAt: r.updated_at };
    });

    const { data: files } = await db
      .from("portal_files")
      .select("id, field_name, file_name, file_size, mime_type, uploaded_at")
      .eq("portal_id", portal.id)
      .order("uploaded_at", { ascending: false });

    res.json({
      id: portal.id,
      briefId: portal.brief_id,
      token: portal.token,
      clientName: portal.briefs.client_name,
      projectName: portal.briefs.project_name,
      fields,
      responses: responseMap,
      files: (files || []).map((f) => ({
        id: f.id, fieldName: f.field_name, fileName: f.file_name,
        fileSize: f.file_size, mimeType: f.mime_type, uploadedAt: f.uploaded_at,
      })),
      viewCount: newViewCount,
      isActive: portal.is_active,
      lastActivity: portal.last_activity,
      createdAt: portal.created_at,
      expiresAt: portal.expires_at,
    });
  } catch (err) {
    console.error("getPortal error:", err);
    res.status(500).json({ error: "Failed to load portal" });
  }
};

exports.saveResponses = async (req, res) => {
  try {
    const { responses } = req.body;
    if (!responses || !Array.isArray(responses)) return res.status(400).json({ error: "responses array is required" });

    const db = getDb();
    const { data: portal, error: pErr } = await db
      .from("collaboration_portals")
      .select("id, is_active")
      .eq("token", req.params.token)
      .maybeSingle();
    if (pErr || !portal) return res.status(404).json({ error: "Portal not found" });
    if (!portal.is_active) return res.status(410).json({ error: "Portal is no longer active" });

    for (const r of responses) {
      const { fieldName, response } = r;
      if (!fieldName) continue;

      const { data: existing } = await db
        .from("portal_responses")
        .select("id")
        .eq("portal_id", portal.id)
        .eq("field_name", fieldName)
        .maybeSingle();

      if (existing) {
        await db
          .from("portal_responses")
          .update({ response, updated_at: new Date().toISOString() })
          .eq("portal_id", portal.id)
          .eq("field_name", fieldName);
      } else {
        await db
          .from("portal_responses")
          .insert({ portal_id: portal.id, field_name: fieldName, response });
      }
    }

    await db
      .from("collaboration_portals")
      .update({ last_activity: new Date().toISOString() })
      .eq("id", portal.id);

    res.json({ saved: true });
  } catch (err) {
    console.error("saveResponses error:", err);
    res.status(500).json({ error: "Failed to save responses" });
  }
};

exports.uploadFile = (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    try {
      const db = getDb();
      const { data: portal, error: pErr } = await db
        .from("collaboration_portals")
        .select("id, is_active")
        .eq("token", req.params.token)
        .maybeSingle();
      if (pErr || !portal) return res.status(404).json({ error: "Portal not found" });
      if (!portal.is_active) return res.status(410).json({ error: "Portal is no longer active" });

      const fieldName = req.body.fieldName || null;
      const ext = path.extname(req.file.originalname);
      const storedName = `${crypto.randomUUID()}${ext}`;

      if (!fs.existsSync(PORTAL_UPLOAD_DIR)) fs.mkdirSync(PORTAL_UPLOAD_DIR, { recursive: true });
      fs.writeFileSync(path.join(PORTAL_UPLOAD_DIR, storedName), req.file.buffer);

      const { data: file, error: fErr } = await db
        .from("portal_files")
        .insert({
          portal_id: portal.id, field_name: fieldName, file_name: req.file.originalname,
          stored_name: storedName, file_size: req.file.buffer.length, mime_type: req.file.mimetype,
        })
        .select("id")
        .single();
      if (fErr) return res.status(500).json({ error: fErr.message });

      await db
        .from("collaboration_portals")
        .update({ last_activity: new Date().toISOString() })
        .eq("id", portal.id);

      res.status(201).json({
        id: file.id, fileName: req.file.originalname,
        fileSize: req.file.buffer.length, mimeType: req.file.mimetype,
      });
    } catch (e) {
      console.error("uploadFile error:", e);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });
};

exports.getFile = async (req, res) => {
  try {
    const db = getDb();
    const { data: file, error: fErr } = await db
      .from("portal_files")
      .select("stored_name, file_name, mime_type, file_size, portal_id")
      .eq("id", req.params.fileId)
      .maybeSingle();
    if (fErr || !file) return res.status(404).json({ error: "File not found" });

    const { data: portal, error: cpErr } = await db
      .from("collaboration_portals")
      .select("token, is_active")
      .eq("id", file.portal_id)
      .eq("token", req.params.token)
      .maybeSingle();
    if (cpErr || !portal) return res.status(404).json({ error: "File not found" });
    if (!portal.is_active) return res.status(410).json({ error: "Portal is no longer active" });

    const filePath = path.join(PORTAL_UPLOAD_DIR, file.stored_name);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found on disk" });

    res.download(filePath, file.file_name, { headers: { "Content-Type": file.mime_type } });
  } catch (err) {
    console.error("getFile error:", err);
    res.status(500).json({ error: "Failed to download file" });
  }
};

exports.regenerateToken = async (req, res) => {
  try {
    const db = getDb();
    const { data: portal, error: pErr } = await db
      .from("collaboration_portals")
      .select("id, briefs ( user_id )")
      .eq("token", req.params.token)
      .maybeSingle();
    if (pErr || !portal) return res.status(404).json({ error: "Portal not found" });
    if (portal.briefs.user_id !== req.user.id) return res.status(403).json({ error: "Not authorized" });

    const newToken = generateToken();
    await db.from("collaboration_portals").update({ token: newToken }).eq("id", portal.id);

    res.json({ token: newToken });
  } catch (err) {
    console.error("regenerateToken error:", err);
    res.status(500).json({ error: "Failed to regenerate token" });
  }
};

exports.deactivatePortal = async (req, res) => {
  try {
    const db = getDb();
    const { data: portal, error: pErr } = await db
      .from("collaboration_portals")
      .select("id, briefs ( user_id )")
      .eq("token", req.params.token)
      .maybeSingle();
    if (pErr || !portal) return res.status(404).json({ error: "Portal not found" });
    if (portal.briefs.user_id !== req.user.id) return res.status(403).json({ error: "Not authorized" });

    await db.from("collaboration_portals").update({ is_active: false }).eq("id", portal.id);

    res.json({ deactivated: true });
  } catch (err) {
    console.error("deactivatePortal error:", err);
    res.status(500).json({ error: "Failed to deactivate portal" });
  }
};

exports.getPortalStatus = async (req, res) => {
  try {
    const db = getDb();
    const { data: brief, error: bErr } = await db
      .from("briefs")
      .select("id, user_id")
      .eq("id", req.params.id)
      .maybeSingle();
    if (bErr || !brief) return res.status(404).json({ error: "Brief not found" });
    if (brief.user_id !== req.user.id) return res.status(403).json({ error: "Not authorized" });

    const { data: portal, error: pErr } = await db
      .from("collaboration_portals")
      .select("id, token, view_count, is_active, last_activity, created_at, expires_at")
      .eq("brief_id", req.params.id)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!portal) return res.json({ portal: null });

    const { count: completedCount } = await db
      .from("portal_responses")
      .select("*", { count: "exact", head: true })
      .eq("portal_id", portal.id);
    const completed = completedCount || 0;

    const { data: files } = await db
      .from("portal_files")
      .select("id, field_name, file_name, file_size, mime_type, uploaded_at")
      .eq("portal_id", portal.id)
      .order("uploaded_at", { ascending: false });

    res.json({
      portal: {
        id: portal.id, token: portal.token, viewCount: portal.view_count,
        isActive: portal.is_active, lastActivity: portal.last_activity,
        createdAt: portal.created_at, expiresAt: portal.expires_at,
        progress: { completed, total: 12 },
        files: (files || []).map((f) => ({
          id: f.id, fieldName: f.field_name, fileName: f.file_name,
          fileSize: f.file_size, mimeType: f.mime_type, uploadedAt: f.uploaded_at,
        })),
      },
    });
  } catch (err) {
    console.error("getPortalStatus error:", err);
    res.status(500).json({ error: "Failed to fetch portal status" });
  }
};

exports.getResponses = async (req, res) => {
  try {
    const db = getDb();
    const { data: portal, error: pErr } = await db
      .from("collaboration_portals")
      .select("id, brief_id, briefs ( user_id, client_name, project_name, analyzed_text )")
      .eq("token", req.params.token)
      .eq("briefs.user_id", req.user.id)
      .maybeSingle();
    if (pErr || !portal) return res.status(404).json({ error: "Portal not found or not authorized" });

    const analysis = tryParseJson(portal.briefs.analyzed_text);
    const fields = (analysis?.fields || []).map((f, i) => ({
      id: `field_${i}`,
      name: f.name,
      question: f.question || `Please provide information about: ${f.name}`,
    }));

    const { data: respRows } = await db
      .from("portal_responses")
      .select("field_name, response, updated_at")
      .eq("portal_id", portal.id)
      .order("id", { ascending: true });
    const responseMap = {};
    (respRows || []).forEach((r) => {
      responseMap[r.field_name] = { response: r.response, updatedAt: r.updated_at };
    });

    const { data: fileRows } = await db
      .from("portal_files")
      .select("id, field_name, file_name, file_size, mime_type, uploaded_at")
      .eq("portal_id", portal.id)
      .order("uploaded_at", { ascending: false });
    const fileMap = {};
    (fileRows || []).forEach((f) => {
      if (!fileMap[f.field_name]) fileMap[f.field_name] = [];
      fileMap[f.field_name].push({ id: f.id, fileName: f.file_name, fileSize: f.file_size, mimeType: f.mime_type, uploadedAt: f.uploaded_at });
    });

    const merged = fields.map((f) => ({
      ...f,
      ...(responseMap[f.name] || { response: "", updatedAt: null }),
      files: fileMap[f.name] || [],
    }));

    res.json({ projectName: portal.briefs.project_name, clientName: portal.briefs.client_name, fields: merged });
  } catch (err) {
    console.error("getResponses error:", err);
    res.status(500).json({ error: "Failed to fetch responses" });
  }
};
