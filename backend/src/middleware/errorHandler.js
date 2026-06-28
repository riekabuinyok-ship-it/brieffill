const { logError } = require("../utils/logger");

function notFound(req, res) {
  res.status(404).json({ error: "Not found", path: req.path });
}

function errorHandler(err, req, res, _next) {
  logError(err, { path: req.path, method: req.method });

  if (res.headersSent) return;

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: status >= 500 ? "Internal server error" : err.message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };
