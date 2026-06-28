const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/integrationController");

router.get("/integrations/status", auth, ctrl.getIntegrationsStatus);
router.put("/integrations/:provider", auth, ctrl.upsertIntegration);
router.delete("/integrations/:provider", auth, ctrl.deleteIntegration);
router.post("/integrations/:provider/test", auth, ctrl.testIntegration);

module.exports = router;
