const app = require("../server");
const { ensureInit } = require("../src/utils/db");

module.exports = async (req, res) => {
  await ensureInit();
  app(req, res);
};
