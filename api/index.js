const app = require("../backend/server");
const { ensureInit } = require("../backend/src/utils/db");

module.exports = async (req, res) => {
  await ensureInit();
  app(req, res);
};
