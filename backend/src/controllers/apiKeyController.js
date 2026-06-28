const { createApiKey, listApiKeys, revokeApiKey } = require("../services/apiKeyService");

exports.create = (req, res) => {
  try {
    const name = (req.body?.name || "Google Docs add-on").toString().trim().slice(0, 60);
    if (!name) return res.status(400).json({ error: "name is required" });
    const key = createApiKey(req.user.id, name);
    res.json({ key });
  } catch (err) {
    console.error("apiKey create error:", err);
    res.status(500).json({ error: "Failed to create API key" });
  }
};

exports.list = (req, res) => {
  res.json({ keys: listApiKeys(req.user.id) });
};

exports.revoke = (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: "Invalid key id" });
  const ok = revokeApiKey(req.user.id, id);
  res.json({ success: ok });
};
