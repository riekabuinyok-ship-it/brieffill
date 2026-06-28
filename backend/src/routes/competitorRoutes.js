const express = require("express");
const router = express.Router({ mergeParams: true });
const auth = require("../middleware/auth");
const { requireCapability } = require("../middleware/planGate");
const { runCompetitorAnalysis, getCompetitorAnalysis } = require("../controllers/competitorController");

router.post("/:id/competitor-analysis", auth, requireCapability("competitorAnalysis"), runCompetitorAnalysis);
router.get("/:id/competitor-analysis", auth, requireCapability("competitorAnalysis"), getCompetitorAnalysis);

module.exports = router;
