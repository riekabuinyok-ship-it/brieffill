const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { requireCapability } = require("../middleware/planGate");
const ctrl = require("../controllers/apiKeyController");

router.post("/", auth, requireCapability("apiAccess"), ctrl.create);
router.get("/", auth, ctrl.list);
router.delete("/:id", auth, requireCapability("apiAccess"), ctrl.revoke);

module.exports = router;
