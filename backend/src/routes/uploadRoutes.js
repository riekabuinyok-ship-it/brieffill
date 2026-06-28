const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { uploadMiddleware, extractText } = require("../controllers/uploadController");

router.post("/extract", auth, uploadMiddleware, extractText);

module.exports = router;
