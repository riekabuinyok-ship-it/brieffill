const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/billingController");

// Public
router.get("/plans", ctrl.getPlans);

// Webhook (public, signature-verified)
router.post("/webhook", express.raw({ type: "application/json" }), ctrl.webhook);

// Authenticated
router.get("/me", auth, ctrl.getMe);
router.post("/checkout", auth, ctrl.createCheckout);
router.post("/checkout/verify", auth, ctrl.verifyCheckout);
router.post("/portal", auth, ctrl.openPortal);
router.post("/bypass", auth, ctrl.bypass);
router.post("/cancel", auth, ctrl.cancel);
router.get("/invoices", auth, ctrl.getInvoices);

module.exports = router;
