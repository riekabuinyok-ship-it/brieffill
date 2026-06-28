const { fireWebhooks } = require("./integrationService");

const KNOWN_EVENTS = new Set([
  "brief.analyzed",
  "brief.rebuilt",
  "brief.outcome_recorded",
  "brief.competitor_analysis_run",
  "brief.email_generated",
]);

function emit(event, { userId, ...payload }) {
  if (!KNOWN_EVENTS.has(event)) {
    console.warn(`emit(): unknown event "${event}" — skipping`);
    return;
  }
  if (!userId) {
    console.warn(`emit(${event}): no userId — skipping`);
    return;
  }
  setImmediate(() => {
    fireWebhooks(userId, event, payload).catch((err) =>
      console.error(`fireWebhooks(${event}) error:`, err.message)
    );
  });
}

module.exports = { emit, KNOWN_EVENTS };
