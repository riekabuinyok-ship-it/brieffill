const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  analyzeBrief,
  listBriefs,
  getBrief,
  generateEmail,
  getFields,
  getDashboardStats,
} = require("../controllers/briefController");

router.post("/analyze", auth, analyzeBrief);
router.get("/", auth, listBriefs);
router.get("/dashboard-stats", auth, getDashboardStats);
router.get("/:id", auth, getBrief);
router.post("/:id/email", auth, generateEmail);
router.post("/:id/generate-email", auth, generateEmail);
router.get("/fields", getFields);

module.exports = router;
