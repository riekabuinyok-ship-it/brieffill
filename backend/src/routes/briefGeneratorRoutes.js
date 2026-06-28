const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { requireCapability } = require("../middleware/planGate");
const ctrl = require("../controllers/briefGeneratorController");

router.post("/generate", auth, ctrl.generate);
router.post("/regenerate", auth, requireCapability("briefBuilder"), ctrl.regenerate);

module.exports = router;
