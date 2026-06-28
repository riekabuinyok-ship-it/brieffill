const { findUserByApiKey } = require("../services/apiKeyService");

/**
 * Middleware that authenticates requests using a BriefFill API key (bfk_xxx).
 * Used by the browser extension and external integrations.
 *
 * Accepts the API key in the Authorization header as a Bearer token:
 *   Authorization: Bearer bfk_xxxxxxxxxxxx
 */
async function apiKeyAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed authorization header" });
  }

  const token = authHeader.split(" ")[1];

  // Only handle bfk_ prefixed keys; pass through for JWT tokens
  if (!token.startsWith("bfk_")) {
    // Not an API key — skip this middleware
    return next();
  }

  try {
    const userId = await findUserByApiKey(token);
    if (!userId) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    req.user = { id: userId };
    req.authMethod = "api_key";
    next();
  } catch (err) {
    console.error("apiKeyAuth error:", err);
    res.status(500).json({ error: "Authentication failed" });
  }
}

module.exports = apiKeyAuth;
