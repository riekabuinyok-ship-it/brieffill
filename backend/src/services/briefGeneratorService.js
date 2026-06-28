// BriefFill — Brief Generator service.
// Given a 1-2 sentence user intent, produce a complete structured brief
// that hits all 12 fields. Optionally refine an existing draft with feedback.

const { getDb } = require("../utils/db");

const AI_URL = process.env.GEMINI_API_URL || "https://api.groq.com/openai/v1/chat/completions";
const AI_KEY = process.env.GROQ_API_KEY || "";
const AI_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

const FIELD_NAMES = [
  "Project Overview",
  "Target Audience",
  "Core Problem",
  "Solution/Offer",
  "Key Benefits",
  "Tone of Voice",
  "Brand Guidelines",
  "Deliverables",
  "Timeline",
  "Budget",
  "Competitors",
  "Call to Action",
];

const SYSTEM_PROMPT = `You are BriefFill's senior creative strategist. Given a user's intent (1-2 sentences), write a complete, client-ready creative brief that hits ALL 12 of these fields:

${FIELD_NAMES.map((n, i) => `${i + 1}. ${n}`).join("\n")}

Rules:
- Output a single JSON object with EXACTLY this shape (no prose outside the JSON):
{
  "briefText": "<the full brief as a plain-text document with clear field headings like 'Project Overview:', 'Target Audience:', etc.>",
  "fields": [
    {"name": "Project Overview", "status": "present"},
    ...one entry per field, in the same order as above...
  ],
  "completenessScore": <integer 0-100, typically 80-95 since you fill all fields>,
  "suggestedTone": "<e.g. confident and conversational, formal and precise, playful and bold>",
  "summary": "<one sentence describing the brief's purpose>"
}

Brief text rules:
- Length: 400-1500 words. Be specific and realistic — make up placeholder details (e.g. realistic budget ranges, plausible dates, named-but-fictional competitor brands) rather than generic filler.
- Use field headings as plain text ("Project Overview:" on its own line, then a paragraph). Separate sections with a blank line.
- If the user provides clientName or projectName, weave them into the Project Overview naturally.
- Bias toward specificity: name concrete deliverables, concrete dates ("Q1 2026"), concrete budget ranges ("$12k-$18k"). Avoid "TBD" and "to be discussed".
- The brief should be ready to send to a freelancer or agency with minimal editing.
- The 12 fields array MUST contain every field with status 'present' (the brief is generated, not analyzed — every field is filled).`;

const REFINE_SYSTEM_PROMPT = `You are BriefFill's senior creative strategist refining an existing brief. The user has an existing draft and wants changes. Apply their feedback while keeping ALL 12 fields intact.

The 12 fields are:
${FIELD_NAMES.map((n, i) => `${i + 1}. ${n}`).join("\n")}

Output a single JSON object with EXACTLY this shape:
{
  "briefText": "<the full revised brief>",
  "fields": [
    {"name": "Project Overview", "status": "present"},
    ...one entry per field, in the same order as above...
  ],
  "completenessScore": <integer 0-100>,
  "suggestedTone": "<updated tone>",
  "summary": "<updated one-sentence summary>"
}

Rules:
- Apply the user's feedback faithfully. If they say "shorter", cut the brief to ~50% of its current length while keeping all field headings. If they say "add KPIs", add 3-5 specific measurable metrics.
- Keep every field heading present in the brief text.
- Output JSON only, no prose.`;

async function callGroq(system, user) {
  if (!AI_KEY) {
    throw new Error("AI service is not configured (missing GROQ_API_KEY)");
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(AI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Groq API ${res.status}: ${errText.slice(0, 200)}`);
    }
    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("Groq returned no content");
    return JSON.parse(content);
  } finally {
    clearTimeout(timer);
  }
}

function normalizeFields(rawFields) {
  if (!Array.isArray(rawFields)) {
    return FIELD_NAMES.map((n) => ({ name: n, status: "present" }));
  }
  return FIELD_NAMES.map((n) => {
    const found = rawFields.find((f) => f && f.name === n);
    const status = ["present", "partial", "missing"].includes(found?.status) ? found.status : "present";
    return { name: n, status, question: "" };
  });
}

function normalizeBriefText(text) {
  if (typeof text !== "string" || text.trim().length < 50) {
    // Fallback: synthesize a minimal brief from any provided context
    return "Project Overview: (draft)\n\n" + (text || "(empty)");
  }
  return text.trim();
}

function normalizeScore(raw, fields) {
  if (typeof raw === "number" && raw >= 0 && raw <= 100) {
    return Math.round(raw);
  }
  // Default: if all fields are 'present', score 85
  const present = fields.filter((f) => f.status === "present").length;
  return Math.round((present / fields.length) * 100) || 85;
}

function normalizeTone(raw) {
  if (typeof raw !== "string" || !raw.trim()) return "professional and collaborative";
  return raw.trim().slice(0, 200);
}

function normalizeSummary(raw) {
  if (typeof raw !== "string" || !raw.trim()) return "Draft brief generated from your intent.";
  return raw.trim().slice(0, 500);
}

function buildUserPrompt({ prompt, clientName, projectName }) {
  const parts = [];
  if (clientName) parts.push(`Client name: ${clientName}`);
  if (projectName) parts.push(`Project name: ${projectName}`);
  parts.push(`Intent: ${prompt}`);
  parts.push("\nWrite a complete brief that addresses all 12 fields. Be specific and realistic.");
  return parts.join("\n");
}

function buildRefinePrompt({ currentBrief, feedback }) {
  return `Existing brief:\n"""\n${currentBrief}\n"""\n\nUser feedback to apply:\n${feedback}\n\nApply the feedback and return the revised brief. Keep all 12 fields. Output JSON only.`;
}

// Build a brief deterministically when the AI service is unavailable
// (rate-limited, network error, missing API key). This keeps the feature
// usable during quota outages and on local dev without a Groq key.
function buildFallbackBrief({ prompt, clientName, projectName }) {
  const cn = (clientName || "[Client name]").trim() || "[Client name]";
  const pn = (projectName || "[Project name]").trim() || "[Project name]";
  const intent = (prompt || "").trim();
  const briefText = `Project Overview:
This brief outlines a creative project for ${cn} titled "${pn}". The project stems from the following intent: ${intent}. The goal is to translate that intent into a focused, well-scoped creative engagement with clear deliverables, a defined audience, and measurable success criteria.

Target Audience:
Describe the primary audience here. Consider their demographics, role, pain points, and what they care about. The audience should be specific enough that a creative team can make decisions for them, not a vague "everyone."

Core Problem:
What problem are we solving? What is the audience struggling with today? What is the cost of inaction? Frame this as the gap between current state and desired state.

Solution/Offer:
How does the project address the core problem? Describe the proposed approach, the assets or experiences we'll create, and the value they deliver. Be specific about what we're making.

Key Benefits:
List 3-5 concrete benefits the audience will experience. Quantify where possible. Connect each benefit to a feature or asset in the project.

Tone of Voice:
Describe the voice and feel of the project. Use 2-3 adjectives and reference an existing brand or piece of content that embodies the target tone. Avoid "modern and clean" — be specific.

Brand Guidelines:
Reference the existing brand system. List primary/secondary colors, typography, logo usage rules, and any constraints. If the project deviates from the brand, call out the deviation explicitly.

Deliverables:
List each deliverable as a numbered item. Include format, dimensions, and any production notes. Distinguish must-haves from nice-to-haves.

Timeline:
Break the project into phases: kickoff, concept, production, review, launch. Include target dates for each phase. Build in buffer for review cycles.

Budget:
State the total budget and how it's allocated across phases. If the budget is a range, give a midpoint. Note any assumptions about revisions, asset licensing, or media spend.

Competitors:
List 2-4 direct competitors and 1-2 indirect ones. For each, note what they do well and where they fall short. The goal is to position the project relative to the landscape, not to copy anyone.

Call to Action:
What should the audience do after encountering the project? Be specific: "Sign up for a free 14-day trial" beats "Learn more." The CTA shapes every other decision.`;

  return {
    briefText,
    fields: FIELD_NAMES.map((n) => ({ name: n, status: "present", question: "" })),
    completenessScore: 75,
    suggestedTone: "professional and collaborative",
    summary: "Template brief generated locally because the AI service is unavailable. Edit each section to reflect your specific project.",
    _fallback: true,
  };
}

function buildFallbackRefined({ currentBrief, feedback }) {
  const trimmed = currentBrief.trim();
  const header = `Refined based on feedback: "${feedback.trim()}".\n\n`;
  return {
    briefText: header + trimmed,
    fields: FIELD_NAMES.map((n) => ({ name: n, status: "present", question: "" })),
    completenessScore: 75,
    suggestedTone: "professional and collaborative",
    summary: "Template brief returned as-is (AI unavailable). Edit to apply the requested change.",
    _fallback: true,
  };
}

async function generateBrief({ prompt, clientName, projectName }) {
  if (!prompt || typeof prompt !== "string" || prompt.trim().length < 5) {
    throw new Error("Prompt must be at least 5 characters");
  }
  if (prompt.length > 2000) {
    throw new Error("Prompt must be 2000 characters or fewer");
  }
  const userPrompt = buildUserPrompt({
    prompt: prompt.trim(),
    clientName: (clientName || "").trim().slice(0, 80),
    projectName: (projectName || "").trim().slice(0, 120),
  });
  let raw;
  try {
    raw = await callGroq(SYSTEM_PROMPT, userPrompt);
  } catch (err) {
    // Graceful fallback for rate limits / missing key / network errors:
    // return a usable template so the feature still works today.
    if (/not configured|rate limit|429/i.test(err.message || "")) {
      return buildFallbackBrief({ prompt, clientName, projectName });
    }
    throw err;
  }
  const fields = normalizeFields(raw.fields);
  return {
    briefText: normalizeBriefText(raw.briefText),
    fields,
    completenessScore: normalizeScore(raw.completenessScore, fields),
    suggestedTone: normalizeTone(raw.suggestedTone),
    summary: normalizeSummary(raw.summary),
  };
}

async function refineBrief({ currentBrief, feedback }) {
  if (!currentBrief || typeof currentBrief !== "string" || currentBrief.trim().length < 50) {
    throw new Error("Current brief must be at least 50 characters");
  }
  if (!feedback || typeof feedback !== "string" || feedback.trim().length < 3) {
    throw new Error("Feedback must be at least 3 characters");
  }
  if (feedback.length > 1000) {
    throw new Error("Feedback must be 1000 characters or fewer");
  }
  const userPrompt = buildRefinePrompt({
    currentBrief: currentBrief.trim().slice(0, 8000),
    feedback: feedback.trim(),
  });
  let raw;
  try {
    raw = await callGroq(REFINE_SYSTEM_PROMPT, userPrompt);
  } catch (err) {
    if (/not configured|rate limit|429/i.test(err.message || "")) {
      return buildFallbackRefined({ currentBrief, feedback });
    }
    throw err;
  }
  const fields = normalizeFields(raw.fields);
  return {
    briefText: normalizeBriefText(raw.briefText),
    fields,
    completenessScore: normalizeScore(raw.completenessScore, fields),
    suggestedTone: normalizeTone(raw.suggestedTone),
    summary: normalizeSummary(raw.summary),
  };
}

// Lightweight wrapper to verify ownership of a briefId (used by the
// future "save generated brief to account" path). Currently unused but
// kept for parity with the rest of the controllers.
async function verifyBriefOwnership(briefId, userId) {
  const db = getDb();
  const { data, error } = await db
    .from("briefs")
    .select("id")
    .eq("id", briefId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

module.exports = {
  generateBrief,
  refineBrief,
  verifyBriefOwnership,
  FIELD_NAMES,
};
