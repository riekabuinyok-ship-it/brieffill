const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  createPortal, getPortal, saveResponses, uploadFile, getFile,
  regenerateToken, deactivatePortal, getPortalStatus, getResponses,
} = require("../controllers/portalController");

// Protected routes (brief owner)
router.post("/briefs/:id/create-portal", auth, createPortal);
router.get("/briefs/:id/portal-status", auth, getPortalStatus);

// Public routes (portal token-based)
router.get("/portal/:token", getPortal);
router.post("/portal/:token/responses", saveResponses);
router.post("/portal/:token/files", uploadFile);
router.get("/portal/:token/files/:fileId", getFile);

// Protected portal management
router.get("/portal/:token/responses", auth, getResponses);
router.put("/portal/:token/regenerate", auth, regenerateToken);
router.delete("/portal/:token", auth, deactivatePortal);

module.exports = router;
