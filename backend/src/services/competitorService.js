const { getDb, save } = require("../utils/db");

const AI_URL = process.env.GEMINI_API_URL || "https://api.groq.com/openai/v1/chat/completions";
const AI_KEY = process.env.GROQ_API_KEY || "";
const AI_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

const FIELD_NAMES = [
  "Project Overview",
  "Target Audience",
  "Goals & Objectives",
  "Deliverables",
  "Brand Guidelines",
  "Budget",
  "Timeline",
  "Success Metrics",
  "Stakeholders",
  "Tone & Voice",
  "Competitors",
  "Constraints",
];

const SYSTEM_PROMPT = `You are BriefFill's Competitive Intelligence Agent. You compare a user's creative brief against 1-3 competitor briefs to find a differentiation opportunity.

For each competitor brief, score completeness 0-100 and classify each of these 12 fields as 'present', 'partial', or 'missing': ${FIELD_NAMES.join(", ")}.

Then across all competitor briefs, identify:
- commonStrengths: 2-5 short themes (5-10 words each) that appear in 2+ competitor briefs. Plain English. No quotes.
- commonGaps: 2-5 short themes (5-10 words each) that are missing in 2+ competitor briefs. Plain English. No quotes.
- opportunity: a TIGHT 1-2 sentence action the user should take. Reference what competitors are covering AND what's missing. No emojis, no marketing fluff, no exclamation marks. End with a clear next step.

Return ONLY valid JSON in this exact shape:
{
  "competitors": [
    {
      "name": "Competitor A",
      "score": 78,
      "fields": [{"name": "Project Overview", "status": "present"}, ...]
    }
  ],
  "commonStrengths": ["...", "..."],
  "commonGaps": ["...", "..."],
  "opportunity": "Your competitors are covering X but missing Y. Add Z to your brief."
}`;

function buildUserPrompt({ userBrief, competitors }) {
  const compBlock = competitors
    .map((c, i) => `[Competitor ${String.fromCharCode(65 + i)}${c.name ? ` — ${c.name}` : ""}]\n${c.text}`)
    .join("\n\n---\n\n");
  const ownBlock = userBrief
    ? `User's own brief (context for the comparison):\nClient: ${userBrief.clientName}\nProject: ${userBrief.projectName}\n\n${userBrief.originalText}`
    : "User's own brief was not provided — focus purely on cross-competitor signal.";
  return `Compare the following competitor briefs and produce the JSON analysis.\n\n${ownBlock}\n\n---\n\n${compBlock}`;
}

async function callGroq(system, user) {
  if (!AI_KEY) {
    throw new Error("GROQ_API_KEY not configured");
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
        temperature: 0.3,
        max_tokens: 2500,
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

function normalizeCompetitors(raw, inputs) {
  if (!Array.isArray(raw) || raw.length === 0) {
    return inputs.map((c) => ({
      name: c.name || "Competitor",
      score: 0,
      fields: FIELD_NAMES.map((n) => ({ name: n, status: "missing" })),
    }));
  }
  return raw.slice(0, 3).map((c, i) => {
    const input = inputs[i] || {};
    const fields = Array.isArray(c.fields)
      ? FIELD_NAMES.map((n) => {
          const found = c.fields.find((f) => f.name === n);
          const status = found?.status;
          return {
            name: n,
            status: ["present", "partial", "missing"].includes(status) ? status : "missing",
          };
        })
      : FIELD_NAMES.map((n) => ({ name: n, status: "missing" }));
    return {
      name: c.name || input.name || `Competitor ${String.fromCharCode(65 + i)}`,
      score: typeof c.score === "number" ? Math.max(0, Math.min(100, Math.round(c.score))) : 0,
      fields,
    };
  });
}

function normalizeStringList(raw, fallback) {
  if (!Array.isArray(raw)) return fallback;
  return raw
    .filter((s) => typeof s === "string" && s.trim().length > 0)
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .slice(0, 8);
}

function normalizeOpportunity(raw) {
  if (typeof raw !== "string") return "Add measurable success metrics to differentiate from competitor briefs that skip them.";
  const cleaned = raw.trim().replace(/^["']|["']$/g, "");
  return cleaned.length > 600 ? cleaned.slice(0, 600).trimEnd() + "..." : cleaned;
}

async function analyzeCompetitors({ userId, briefId, competitors }) {
  const db = getDb();
  const userBriefRow = db.exec(
    "SELECT id, client_name, project_name, original_text FROM briefs WHERE id = ? AND user_id = ?",
    [briefId, userId]
  )[0]?.values?.[0];
  const userBrief = userBriefRow
    ? {
        id: userBriefRow[0],
        clientName: userBriefRow[1],
        projectName: userBriefRow[2],
        originalText: userBriefRow[3],
      }
    : null;

  let raw;
  try {
    raw = await callGroq(SYSTEM_PROMPT, buildUserPrompt({ userBrief, competitors }));
  } catch (err) {
    console.error("Competitor analysis AI error:", err.message);
    raw = {
      competitors: competitors.map((c, i) => ({
        name: c.name || `Competitor ${String.fromCharCode(65 + i)}`,
        score: 0,
        fields: [],
      })),
      commonStrengths: [],
      commonGaps: [],
      opportunity: "Competitor analysis is temporarily unavailable. Please try again in a moment.",
    };
  }

  const normalizedCompetitors = normalizeCompetitors(raw.competitors, competitors);
  const commonStrengths = normalizeStringList(raw.commonStrengths, []);
  const commonGaps = normalizeStringList(raw.commonGaps, []);
  const opportunity = normalizeOpportunity(raw.opportunity);

  const competitorsJson = JSON.stringify(normalizedCompetitors);
  const strengthsJson = JSON.stringify(commonStrengths);
  const gapsJson = JSON.stringify(commonGaps);

  db.run(
    `INSERT INTO competitor_analyses (brief_id, user_id, competitors, common_strengths, common_gaps, opportunity, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
     ON CONFLICT(brief_id) DO UPDATE SET
       competitors = excluded.competitors,
       common_strengths = excluded.common_strengths,
       common_gaps = excluded.common_gaps,
       opportunity = excluded.opportunity,
       updated_at = datetime('now')`,
    [briefId, userId, competitorsJson, strengthsJson, gapsJson, opportunity]
  );
  save();

  return {
    competitors: normalizedCompetitors,
    commonStrengths,
    commonGaps,
    opportunity,
  };
}

function getCompetitorAnalysis(briefId) {
  const db = getDb();
  const result = db.exec(
    `SELECT competitors, common_strengths, common_gaps, opportunity, created_at, updated_at
     FROM competitor_analyses WHERE brief_id = ?`,
    [briefId]
  );
  if (!result[0]?.values.length) return null;
  const row = result[0].values[0];
  let competitors, strengths, gaps;
  try { competitors = JSON.parse(row[0]); } catch { competitors = []; }
  try { strengths = JSON.parse(row[1]); } catch { strengths = []; }
  try { gaps = JSON.parse(row[2]); } catch { gaps = []; }
  return {
    competitors,
    commonStrengths: strengths,
    commonGaps: gaps,
    opportunity: row[3] || "",
    createdAt: row[4],
    updatedAt: row[5],
  };
}

function verifyBriefOwnership(briefId, userId) {
  const db = getDb();
  const result = db.exec(
    "SELECT 1 FROM briefs WHERE id = ? AND user_id = ?",
    [briefId, userId]
  );
  return result[0]?.values?.length > 0;
}

module.exports = { analyzeCompetitors, getCompetitorAnalysis, verifyBriefOwnership };
