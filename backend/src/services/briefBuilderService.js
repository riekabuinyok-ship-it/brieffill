require("dotenv").config();

const API_URL = process.env.GEMINI_API_URL || "https://api.groq.com/openai/v1/chat/completions";
const API_KEY = process.env.GROQ_API_KEY || "";
const API_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are BriefFill Brief Builder, an AI assistant that rewrites incomplete client creative briefs into comprehensive, professional briefs.

You receive:
1. The client's original brief text
2. A field-by-field analysis showing which of the 12 critical fields are present, partial, or missing
3. The original suggested tone (if available)

Your task: generate a fully improved brief that fills in the missing/partial fields with industry-appropriate detail, while preserving the client's original voice, terminology, and any specific details they did provide.

**Rules:**
1. PRESERVE every concrete detail the client provided (names, numbers, dates, specific products, specific competitors)
2. INFER reasonable, industry-appropriate content for missing/partial fields based on the project type, industry signals, and context
3. Maintain the SAME TONE as the original (formal, casual, technical, playful) — do not make it more formal or polished than the client's voice warrants
4. Write the improved brief as a cohesive document, not as 12 separate field answers — the output should read like a real client brief
5. For fields already "present", keep the original wording unless it's clearly wrong
6. For "partial" fields, expand the existing information with reasonable specifics
7. For "missing" fields, generate content that fits the project context

**Industry-specific guidance:**
- Fintech: be specific about regulatory context, target investor profile, technical requirements
- Robotics: be specific about autonomy level, hardware vs software, use case environment
- E-commerce: be specific about conversion metrics, platform integrations, fulfillment
- Healthcare: mention compliance (HIPAA), patient data, clinical workflow integration
- Nonprofit: focus on mission impact, donor audience, measurable outcomes
- SaaS: technical stack, integration requirements, user onboarding, pricing model

**Output format:** Respond ONLY with a JSON object in this exact structure:
{
  "improved_brief": "The full rewritten brief text as a single string, preserving the original voice and filling gaps with reasonable industry-appropriate content.",
  "summary_of_changes": [
    "Added specific timeline milestones based on standard 8-week brand project workflow",
    "Inferred target audience as 25-40 year old urban professionals based on tone and project type",
    "Added budget range guidance for the inferred scope"
  ],
  "field_fixes": {
    "Project Overview": "What was added or changed",
    "Target Audience": "What was added or changed"
  }
}

Do not include any other text outside the JSON object.`;

function buildUserPrompt({ originalBrief, analysis }) {
  const fieldSummary = (analysis.fields || [])
    .map((f) => `- ${f.name}: ${f.status}${f.question ? ` (asked: ${f.question})` : ""}`)
    .join("\n");

  return `Here is the client's original brief:

---
${originalBrief}
---

Here is the analysis (12 critical fields):
${fieldSummary}

Completeness score: ${analysis.completenessScore}/100
Suggested tone: ${analysis.suggestedTone || "professional and collaborative"}

Please generate the improved brief following the system instructions.`;
}

function getFallbackImprovement({ originalBrief, analysis }) {
  // Offline fallback when Groq is unreachable. Provides a templated improvement
  // that the user can edit. Preserves the original brief verbatim and adds
  // generic prompts for each missing/partial field.
  const missing = (analysis.fields || []).filter((f) => f.status !== "present");
  const additions = missing.map((f) => `\n\n[${f.name}]: ${f.question || `Please provide details on ${f.name.toLowerCase()}.`}`).join("");

  return {
    improved_brief: `${originalBrief}${additions}\n\n---\nNote: AI improvement service was unreachable. The above includes the original brief plus suggested questions for each missing field. Please fill in the bracketed sections.`,
    summary_of_changes: [
      "AI service was unreachable; the original brief was preserved verbatim.",
      `${missing.length} missing/partial field(s) flagged with suggested questions in the output.`,
      "Edit the bracketed sections in the editor before saving.",
    ],
    field_fixes: Object.fromEntries(missing.map((f) => [f.name, `Suggested question added: ${f.question || "Needs detail"}`])),
  };
}

async function improveBrief({ originalBrief, analysis }) {
  if (!originalBrief || !analysis) {
    throw new Error("originalBrief and analysis are required");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const headers = { "Content-Type": "application/json" };
    if (API_KEY) headers.Authorization = `Bearer ${API_KEY}`;

    const response = await fetch(API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: API_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt({ originalBrief, analysis }) },
        ],
        temperature: 0.5,
        max_tokens: 3000,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`AI service returned ${response.status}: ${errBody.slice(0, 200)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in AI response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.improved_brief) {
      throw new Error("AI response missing improved_brief field");
    }

    return {
      improvedBrief: parsed.improved_brief,
      summaryOfChanges: Array.isArray(parsed.summary_of_changes) ? parsed.summary_of_changes : [],
      fieldFixes: parsed.field_fixes && typeof parsed.field_fixes === "object" ? parsed.field_fixes : {},
    };
  } catch (err) {
    clearTimeout(timeout);
    const isTimeout = err.name === "AbortError";
    console.error(`Brief Builder AI error${isTimeout ? " (20s timeout)" : ""}:`, err.message);
    const fallback = getFallbackImprovement({ originalBrief, analysis });
    return {
      improvedBrief: fallback.improved_brief,
      summaryOfChanges: fallback.summary_of_changes,
      fieldFixes: fallback.field_fixes,
      fallback: true,
    };
  }
}

module.exports = { improveBrief };
