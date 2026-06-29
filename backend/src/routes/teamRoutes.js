const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const auth = require("../middleware/auth");
const { requireCapability } = require("../middleware/planGate");
const {
  createTeam, listTeams, getTeam, inviteToTeam,
  acceptInvite, shareBrief, listTeamBriefs,
  updateMemberRole, removeMember, listMyTeamsForBrief,
  updateTeam, uploadTeamLogo, transferOwnership, deleteTeam,
} = require("../controllers/teamController");

const teamOnly = requireCapability("teamFeatures");

const LOGO_DIR = process.env.VERCEL
  ? path.join("/tmp/uploads/team-logos")
  : path.join(__dirname, "..", "..", "uploads", "team-logos");

const logoUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      if (!fs.existsSync(LOGO_DIR)) fs.mkdirSync(LOGO_DIR, { recursive: true });
      cb(null, LOGO_DIR);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".png";
      cb(null, `logo-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /\.(jpg|jpeg|png|gif|svg)$/i.test(file.originalname);
    cb(ok ? null : new Error("Only JPG, PNG, GIF, and SVG files are allowed"), ok);
  },
});

router.post("/", auth, teamOnly, createTeam);
router.get("/", auth, teamOnly, listTeams);
router.get("/:id", auth, teamOnly, getTeam);
router.get("/:id/briefs", auth, teamOnly, listTeamBriefs);
router.post("/:id/invite", auth, teamOnly, inviteToTeam);
router.put("/:id/members/:userId/role", auth, teamOnly, updateMemberRole);
router.delete("/:id/members/:userId", auth, teamOnly, removeMember);
router.put("/:id", auth, teamOnly, updateTeam);
router.post("/:id/logo", auth, teamOnly, logoUpload.single("logo"), uploadTeamLogo);
router.post("/:id/transfer", auth, teamOnly, transferOwnership);
router.delete("/:id", auth, teamOnly, deleteTeam);
router.post("/:id/share/:briefId", auth, teamOnly, shareBrief);
router.post("/accept", auth, teamOnly, acceptInvite);

module.exports = router;
