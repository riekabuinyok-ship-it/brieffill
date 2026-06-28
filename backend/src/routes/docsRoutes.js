const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { createApiKey, listApiKeys, revokeApiKey } = require("../services/apiKeyService");
const { getUserBilling } = require("../services/billingService");

const ACCESS_PLANS = {
  api: ["team", "agency"],
  integrations: ["team", "agency"],
};

// GET /api/docs/plan-access — check what the user's plan can access
router.get("/plan-access", auth, async (req, res) => {
  const billing = await getUserBilling(req.user.id);
  const plan = billing?.plan || "free";
  res.json({
    plan,
    hasApiAccess: ACCESS_PLANS.api.includes(plan),
    hasIntegrationsAccess: ACCESS_PLANS.integrations.includes(plan),
  });
});

// GET /api/docs/api-keys — list user's API keys
router.get("/api-keys", auth, async (req, res) => {
  const billing = await getUserBilling(req.user.id);
  if (!ACCESS_PLANS.api.includes(billing?.plan)) {
    return res.status(403).json({ error: "API access requires Team or Agency plan" });
  }
  res.json({ keys: listApiKeys(req.user.id) });
});

// POST /api/docs/api-keys — generate new API key
router.post("/api-keys", auth, async (req, res) => {
  const billing = await getUserBilling(req.user.id);
  if (!ACCESS_PLANS.api.includes(billing?.plan)) {
    return res.status(403).json({ error: "API access requires Team or Agency plan" });
  }
  const name = (req.body?.name || "Documentation").toString().trim().slice(0, 60);
  if (!name) return res.status(400).json({ error: "name is required" });
  const key = createApiKey(req.user.id, name);
  res.json({ key });
});

// DELETE /api/docs/api-keys/:id — revoke API key
router.delete("/api-keys/:id", auth, async (req, res) => {
  const billing = await getUserBilling(req.user.id);
  if (!ACCESS_PLANS.api.includes(billing?.plan)) {
    return res.status(403).json({ error: "API access requires Team or Agency plan" });
  }
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: "Invalid key id" });
  const ok = revokeApiKey(req.user.id, id);
  res.json({ success: ok });
});

module.exports = router;
