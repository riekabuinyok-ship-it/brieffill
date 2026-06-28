const express = require("express");
const router = express.Router({ mergeParams: true });
const auth = require("../middleware/auth");
const { requireExport } = require("../middleware/planGate");
const exportCtrl = require("../controllers/exportController");
const integrationCtrl = require("../controllers/integrationController");

router.get("/:id/export/google-docs", auth, requireExport("google-docs"), exportCtrl.getGoogleDocsExport);
router.post("/:id/export/notion", auth, requireExport("notion"), exportCtrl.postNotionExport);
router.post("/:id/export/notion-user", auth, requireExport("notion"), integrationCtrl.exportToNotionUser);
router.post("/:id/export/clickup", auth, requireExport("clickup"), integrationCtrl.exportToClickUp);
router.post("/:id/export/airtable", auth, requireExport("airtable"), integrationCtrl.exportToAirtable);

module.exports = router;
