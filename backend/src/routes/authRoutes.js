const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const auth = require("../middleware/auth");
const { register, login, me, updateMe, uploadAvatar, changePassword, setup2fa, verify2fa, disable2fa, getSessions, revokeSession, deleteAccount } = require("../controllers/authController");

const AVATAR_DIR = process.env.VERCEL
  ? path.join("/tmp/uploads/avatars")
  : path.join(__dirname, "..", "..", "uploads", "avatars");

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR, { recursive: true });
      cb(null, AVATAR_DIR);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /\.(jpg|jpeg|png|gif)$/i.test(file.originalname);
    cb(ok ? null : new Error("Only JPG, PNG, and GIF files are allowed"), ok);
  },
});

router.post("/register", register);
router.post("/login", login);
router.get("/me", auth, me);
router.patch("/me", auth, updateMe);
router.post("/me/avatar", auth, avatarUpload.single("avatar"), uploadAvatar);

// Account & Security
router.post("/change-password", auth, changePassword);
router.post("/2fa/setup", auth, setup2fa);
router.post("/2fa/verify", auth, verify2fa);
router.post("/2fa/disable", auth, disable2fa);
router.get("/sessions", auth, getSessions);
router.delete("/sessions/:id", auth, revokeSession);
router.delete("/account", auth, deleteAccount);

module.exports = router;
