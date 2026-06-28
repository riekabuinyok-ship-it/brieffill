const express = require("express");
const router = express.Router({ mergeParams: true });
const auth = require("../middleware/auth");
const { requireCapability } = require("../middleware/planGate");
const { recordOutcome, getOutcome } = require("../controllers/outcomeController");

router.post("/:id/outcome", auth, requireCapability("briefBuilder"), recordOutcome);
router.get("/:id/outcome", auth, requireCapability("briefBuilder"), getOutcome);

module.exports = router;
