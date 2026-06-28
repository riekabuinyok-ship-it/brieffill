const express = require("express");
const router = express.Router({ mergeParams: true });
const auth = require("../middleware/auth");
const { requireCapability } = require("../middleware/planGate");
const { buildBrief, saveImprovedBrief } = require("../controllers/briefBuilderController");

router.post("/:id/build", auth, requireCapability("briefBuilder"), buildBrief);
router.put("/:id/build", auth, requireCapability("briefBuilder"), saveImprovedBrief);

module.exports = router;
