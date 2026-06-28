const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getPlans,
  getMySubscription,
  createCheckout,
  bypassPayment,
  cancelSubscription,
} = require("../controllers/subscriptionController");

router.get("/plans", getPlans);
router.get("/my", auth, getMySubscription);
router.post("/checkout", auth, createCheckout);
router.post("/bypass", auth, bypassPayment);
router.post("/cancel", auth, cancelSubscription);

module.exports = router;
