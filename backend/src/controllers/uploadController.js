const multer = require("multer");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ["text/plain", "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.mimetype)
      || /\.(txt|docx|pdf)$/i.test(file.originalname);
    cb(ok ? null : new Error("Only .txt, .docx, and .pdf files are supported"), ok);
  },
});

exports.uploadMiddleware = upload.single("file");

exports.extractText = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const { buffer, originalname, mimetype } = req.file;
    const isPdf = mimetype === "application/pdf" || /\.pdf$/i.test(originalname);
    const isDocx = mimetype.includes("wordprocessingml") || /\.docx$/i.test(originalname);
    const isTxt = mimetype === "text/plain" || /\.txt$/i.test(originalname);

    let text = "";
    if (isTxt) {
      text = buffer.toString("utf-8");
    } else if (isDocx) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (isPdf) {
      const result = await pdfParse(buffer);
      text = result.text;
    } else {
      return res.status(400).json({ error: "Unsupported file type" });
    }

    text = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

    res.json({
      text,
      filename: originalname,
      size: buffer.length,
      charCount: text.length,
      wordCount: text.split(/\s+/).filter(Boolean).length,
    });
  } catch (err) {
    console.error("extractText error:", err.message);
    res.status(500).json({ error: "Failed to extract text from file" });
  }
};
