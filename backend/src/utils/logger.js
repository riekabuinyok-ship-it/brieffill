const fs = require("fs");
const path = require("path");

const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, "..", "..", "logs");
const LOG_FILE = path.join(LOG_DIR, "error.log");

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function formatLog(level, message, meta = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  });
}

function writeToFile(line) {
  try {
    fs.appendFileSync(LOG_FILE, line + "\n");
  } catch (err) {
    console.error("Failed to write to log file:", err.message);
  }
}

exports.logInfo = (message, meta) => {
  const line = formatLog("info", message, meta);
  console.log(line);
};

exports.logError = (err, meta = {}) => {
  const line = formatLog("error", err.message || String(err), {
    stack: err.stack,
    ...meta,
  });
  console.error(line);
  writeToFile(line);
};

exports.logWarn = (message, meta) => {
  const line = formatLog("warn", message, meta);
  console.warn(line);
};
