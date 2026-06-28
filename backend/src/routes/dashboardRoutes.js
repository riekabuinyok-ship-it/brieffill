const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getStats, getRecentBriefs, getScoreTrend, getIndustryBreakdown } = require("../controllers/dashboardController");

router.get("/stats", auth, getStats);
router.get("/recent-briefs", auth, getRecentBriefs);
router.get("/score-trend", auth, getScoreTrend);
router.get("/industry-breakdown", auth, getIndustryBreakdown);

module.exports = router;
