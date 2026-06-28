const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getPreferences, updatePreferences } = require("../controllers/preferencesController");

router.get("/", auth, getPreferences);
router.put("/", auth, updatePreferences);

module.exports = router;
