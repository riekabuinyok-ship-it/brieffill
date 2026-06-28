require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { init } = require("./src/utils/db");
const { notFound, errorHandler } = require("./src/middleware/errorHandler");
const { logInfo, logError } = require("./src/utils/logger");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "BriefFill API", version: "1.0.0" });
});

const authRoutes = require("./src/routes/authRoutes");
const briefRoutes = require("./src/routes/briefRoutes");
const subscriptionRoutes = require("./src/routes/subscriptionRoutes");
const usageRoutes = require("./src/routes/usageRoutes");
const uploadRoutes = require("./src/routes/uploadRoutes");
const preferencesRoutes = require("./src/routes/preferencesRoutes");
const teamRoutes = require("./src/routes/teamRoutes");
const briefBuilderRoutes = require("./src/routes/briefBuilderRoutes");
const exportRoutes = require("./src/routes/exportRoutes");
const outcomeRoutes = require("./src/routes/outcomeRoutes");
const analyticsRoutes = require("./src/routes/analyticsRoutes");
const competitorRoutes = require("./src/routes/competitorRoutes");
const integrationsRoutes = require("./src/routes/integrationsRoutes");
const apiKeyRoutes = require("./src/routes/apiKeyRoutes");
const publicRoutes = require("./src/routes/publicRoutes");
const briefGeneratorRoutes = require("./src/routes/briefGeneratorRoutes");
const billingRoutes = require("./src/routes/billingRoutes");
const referralRoutes = require("./src/routes/referralRoutes");
const portalRoutes = require("./src/routes/portalRoutes");
const docsRoutes = require("./src/routes/docsRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const { getFields } = require("./src/controllers/briefController");

app.use("/api/auth", authRoutes);
app.use("/api/briefs", briefRoutes);
app.use("/api/briefs", briefBuilderRoutes);
app.use("/api/briefs", exportRoutes);
app.use("/api/briefs", outcomeRoutes);
app.use("/api/briefs", competitorRoutes);
app.use("/api/briefs", briefGeneratorRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api", integrationsRoutes);
app.use("/api/api-keys", apiKeyRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/usage", usageRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/docs", docsRoutes);
app.use("/api/preferences", preferencesRoutes);
app.use("/api/teams", teamRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/referrals", referralRoutes);
app.use("/api", portalRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.get("/api/fields", getFields);

if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
  app.use(express.static(path.join(__dirname, "..", "frontend", "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "frontend", "dist", "index.html"));
  });
}

app.use(notFound);
app.use(errorHandler);

init()
  .then(() => {
    logInfo('Database initialized');
    if (!process.env.VERCEL) {
      app.listen(PORT, () => {
        logInfo(`BriefFill API running on http://localhost:${PORT}`);
      });
    }
  })
  .catch((err) => {
    logError(err, { context: "database initialization" });
    if (!process.env.VERCEL) process.exit(1);
  });

module.exports = app;
