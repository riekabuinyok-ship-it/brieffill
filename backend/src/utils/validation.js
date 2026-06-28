const REQUIRED_FIELDS = [
  "Project Overview", "Target Audience", "Core Problem", "Solution/Offer",
  "Key Benefits", "Tone of Voice", "Brand Guidelines", "Deliverables",
  "Timeline", "Budget", "Competitors", "Call to Action",
];

const VALID_STATUSES = ["present", "partial", "missing"];

function validateAiResponse(response) {
  if (!response || typeof response !== "object") {
    return { valid: false, errors: ["Response must be a non-null object"] };
  }

  const errors = [];

  if (typeof response.completenessScore !== "number" || response.completenessScore < 0 || response.completenessScore > 100) {
    errors.push("completenessScore must be a number between 0 and 100");
  }

  if (!Array.isArray(response.fields)) {
    errors.push("fields must be an array");
  } else {
    const fieldNames = response.fields.map((f) => f.name);

    for (const required of REQUIRED_FIELDS) {
      if (!fieldNames.includes(required)) {
        errors.push(`Missing required field: "${required}"`);
      }
    }

    response.fields.forEach((f, i) => {
      if (!f.name || typeof f.name !== "string") {
        errors.push(`fields[${i}]: missing or invalid "name"`);
      }
      if (!VALID_STATUSES.includes(f.status)) {
        errors.push(`fields[${i}] ("${f.name || "?"}"): status must be one of ${VALID_STATUSES.join(", ")}`);
      }
      if (typeof f.question !== "string") {
        errors.push(`fields[${i}] ("${f.name || "?"}"): "question" must be a string`);
      }
    });
  }

  if (!Array.isArray(response.clarificationQuestions)) {
    errors.push("clarificationQuestions must be an array");
  } else if (response.clarificationQuestions.length < 1) {
    errors.push("clarificationQuestions must contain at least 1 question");
  }

  if (typeof response.suggestedTone !== "string" || response.suggestedTone.trim().length === 0) {
    errors.push("suggestedTone must be a non-empty string");
  }

  return { valid: errors.length === 0, errors };
}

function sanitizeAiResponse(raw) {
  const validation = validateAiResponse(raw);
  if (validation.valid) {
    return raw;
  }

  const safe = {
    completenessScore: typeof raw?.completenessScore === "number" ? raw.completenessScore : 0,
    fields: Array.isArray(raw?.fields)
      ? raw.fields.filter((f) => f?.name && VALID_STATUSES.includes(f.status)).map((f) => ({
          name: f.name,
          status: f.status,
          question: typeof f.question === "string" ? f.question : "",
        }))
      : [],
    clarificationQuestions: Array.isArray(raw?.clarificationQuestions)
      ? raw.clarificationQuestions.filter((q) => typeof q === "string").slice(0, 5)
      : [],
    suggestedTone: typeof raw?.suggestedTone === "string" ? raw.suggestedTone : "professional and collaborative",
  };

  return safe;
}

module.exports = { validateAiResponse, sanitizeAiResponse };
