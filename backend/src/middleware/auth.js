const jwt = require("jsonwebtoken");
const { findUserByApiKey } = require("../services/apiKeyService");

const SECRET = process.env.JWT_SECRET || "your-secret-key-here";

async function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed authorization header" });
  }

  const token = authHeader.split(" ")[1];

  // Try API key auth first (bfk_ prefix)
  if (token.startsWith("bfk_")) {
    try {
      const userId = await findUserByApiKey(token);
      if (!userId) {
        return res.status(401).json({ error: "Invalid API key" });
      }
      req.user = { id: userId, email: "", name: "API User" };
      req.authMethod = "api_key";
      return next();
    } catch (err) {
      console.error("API key auth error:", err);
      return res.status(500).json({ error: "Authentication failed" });
    }
  }

  // Try JWT auth
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    req.authMethod = "jwt";
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = auth;
