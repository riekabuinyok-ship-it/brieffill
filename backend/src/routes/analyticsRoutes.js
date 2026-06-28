const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getScoreTimeline, getBenchmarks, getOutcomeSummary } = require("../controllers/analyticsController");

router.get("/score-timeline", auth, getScoreTimeline);
router.get("/benchmarks", auth, getBenchmarks);
router.get("/outcome-summary", auth, getOutcomeSummary);

module.exports = router;
