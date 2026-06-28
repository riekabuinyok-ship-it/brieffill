const { createApiKey, listApiKeys, revokeApiKey } = require("../services/apiKeyService");

exports.create = async (req, res) => {
  try {
    const name = (req.body?.name || "Google Docs add-on").toString().trim().slice(0, 60);
    if (!name) return res.status(400).json({ error: "name is required" });
    const key = await createApiKey(req.user.id, name);
    res.json({ key });
  } catch (err) {
    console.error("apiKey create error:", err);
    res.status(500).json({ error: "Failed to create API key" });
  }
};

exports.list = async (req, res) => {
  res.json({ keys: await listApiKeys(req.user.id) });
};

exports.revoke = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: "Invalid key id" });
  const ok = await revokeApiKey(req.user.id, id);
  res.json({ success: ok });
};
