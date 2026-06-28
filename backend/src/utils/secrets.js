const crypto = require("crypto");

const MASK = process.env.SECRETS_MASK || "brieffill-default-mask-please-override";
const KEY = crypto.createHash("sha256").update(MASK).digest();

function maskSecret(plain) {
  if (plain == null || plain === "") return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", KEY, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return iv.toString("base64") + ":" + enc.toString("base64");
}

function unmaskSecret(stored) {
  if (!stored) return null;
  const idx = stored.indexOf(":");
  if (idx === -1) return null;
  try {
    const iv = Buffer.from(stored.slice(0, idx), "base64");
    const data = Buffer.from(stored.slice(idx + 1), "base64");
    const decipher = crypto.createDecipheriv("aes-256-cbc", KEY, iv);
    const dec = Buffer.concat([decipher.update(data), decipher.final()]);
    return dec.toString("utf8");
  } catch {
    return null;
  }
}

function maskPreview(stored) {
  const plain = unmaskSecret(stored);
  if (!plain) return null;
  if (plain.length <= 8) return "•".repeat(plain.length);
  return plain.slice(0, 4) + "…" + plain.slice(-4);
}

module.exports = { maskSecret, unmaskSecret, maskPreview };
