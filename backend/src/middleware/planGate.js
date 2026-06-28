const { getUserBilling, planRequires } = require("../services/billingService");

function requireCapability(capability, options = {}) {
  return async (req, res, next) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const billing = await getUserBilling(req.user.id);
    if (!billing) {
      return res.status(401).json({ error: "User not found" });
    }
    if (!planRequires(billing.plan, capability)) {
      return res.status(options.status || 403).json({
        error: options.message || `This feature requires a plan that includes "${capability}".`,
        code: options.code || "plan_upgrade_required",
        currentPlan: billing.plan,
        requiredCapability: capability,
      });
    }
    next();
  };
}

function requireExport(exportName, options = {}) {
  return async (req, res, next) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const billing = await getUserBilling(req.user.id);
    if (!billing) {
      return res.status(401).json({ error: "User not found" });
    }
    const exports = billing.features && billing.features.exports;
    const allowed = Array.isArray(exports) && exports.includes(exportName);
    if (!allowed) {
      return res.status(options.status || 403).json({
        error: options.message || `Export to ${exportName} is not available on your current plan.`,
        code: options.code || "plan_upgrade_required",
        currentPlan: billing.plan,
        requiredCapability: `exports:${exportName}`,
      });
    }
    next();
  };
}

module.exports = { requireCapability, requireExport };
