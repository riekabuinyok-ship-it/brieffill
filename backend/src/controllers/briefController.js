const { getDb, save } = require("../utils/db");
const { analyzeBrief: runAnalysis } = require("../services/aiService");
const { sanitizeAiResponse } = require("../utils/validation");
const { generateClarificationEmail } = require("../services/emailService");
const { emit } = require("../services/eventService");
const { enforceBriefLimit, recordBriefCreated } = require("../services/billingService");

const FIELDS = [
  { name: "Project Overview", description: "A high-level summary of the project scope and objectives.", example_question: "Can you describe the overall goal and scope of this project?" },
  { name: "Target Audience", description: "The specific group of people the campaign or deliverable is intended to reach.", example_question: "Who is the primary audience you are trying to reach with this project?" },
  { name: "Core Problem", description: "The main challenge or pain point the project aims to solve for the client or their audience.", example_question: "What specific problem or challenge is this project expected to address?" },
  { name: "Solution/Offer", description: "The product, service, or approach being proposed to solve the core problem.", example_question: "What solution or offering is at the heart of this project?" },
  { name: "Key Benefits", description: "The primary advantages or value the audience gains from the solution.", example_question: "What are the top benefits the audience will experience?" },
  { name: "Tone of Voice", description: "The desired communication style and personality (e.g., professional, playful, urgent).", example_question: "What tone and personality should the messaging convey?" },
  { name: "Brand Guidelines", description: "Existing branding rules, colors, fonts, logos, or visual references to follow.", example_question: "Are there brand guidelines or visual references I should follow?" },
  { name: "Deliverables", description: "The specific outputs the client expects (e.g., social posts, video script, landing page).", example_question: "What specific deliverables are expected for this project?" },
  { name: "Timeline", description: "Key dates including deadlines, milestones, and review periods.", example_question: "What is the deadline and are there any milestone dates to be aware of?" },
  { name: "Budget", description: "The allocated spend for the project, including any cost constraints.", example_question: "What is the budget range or cost constraint for this project?" },
  { name: "Competitors", description: "Other brands or campaigns that should be considered, referenced, or differentiated from.", example_question: "Who are the key competitors, and what should we learn from their approach?" },
  { name: "Call to Action", description: "The specific action the audience should take after engaging with the deliverable.", example_question: "What is the primary action you want the audience to take?" },
];

exports.analyzeBrief = async (req, res) => {
  try {
    const { briefText, clientName, projectName, industry } = req.body;

    if (!briefText || !clientName || !projectName) {
      return res.status(400).json({ error: "briefText, clientName, and projectName are required" });
    }

    try {
      enforceBriefLimit(req.user.id);
    } catch (limitErr) {
      if (limitErr.payload) return res.status(limitErr.status).json(limitErr.payload);
      throw limitErr;
    }

    const raw = await runAnalysis(briefText);
    const analysis = sanitizeAiResponse(raw);

    const db = getDb();
    db.run(
      "INSERT INTO briefs (user_id, client_name, project_name, original_text, analyzed_text, completeness_score, missing_fields, status, industry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        req.user.id,
        clientName,
        projectName,
        briefText,
        JSON.stringify(analysis),
        analysis.completenessScore,
        JSON.stringify(analysis.fields.filter((f) => f.status !== "present")),
        "analyzed",
        industry || null,
      ]
    );
    save();

    const id = db.exec("SELECT last_insert_rowid() AS id")[0].values[0][0];

    recordBriefCreated(req.user.id);

    emit("brief.analyzed", {
      userId: req.user.id,
      briefId: id,
      clientName,
      projectName,
      score: analysis.completenessScore,
    });

    res.status(201).json({ id, ...analysis });
  } catch (err) {
    console.error("analyzeBrief error:", err);
    res.status(500).json({ error: "Failed to analyze brief" });
  }
};

exports.listBriefs = (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = 10;
    const offset = (page - 1) * limit;

    const db = getDb();
    const countResult = db.exec("SELECT COUNT(*) AS total FROM briefs WHERE user_id = ?", [req.user.id]);
    const total = countResult[0]?.values[0]?.[0] || 0;

    const result = db.exec(
      "SELECT id, client_name, project_name, completeness_score, status, created_at, industry FROM briefs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [req.user.id, limit, offset]
    );

    const rows = (result[0]?.values || []).map((r) => ({
      id: r[0],
      clientName: r[1],
      projectName: r[2],
      completenessScore: r[3],
      status: r[4],
      createdAt: r[5],
      industry: r[6],
    }));

    res.json({ briefs: rows, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("listBriefs error:", err);
    res.status(500).json({ error: "Failed to fetch briefs" });
  }
};

exports.getBrief = (req, res) => {
  try {
    const db = getDb();
    const briefResult = db.exec("SELECT * FROM briefs WHERE id = ?", [req.params.id]);
    const row = briefResult[0]?.values?.[0];
    if (!row) {
      return res.status(404).json({ error: "Brief not found" });
    }

    const cols = briefResult[0].columns;
    const idx = (name) => cols.indexOf(name);

    const result = {
      id: row[idx("id")],
      userId: row[idx("user_id")],
      clientName: row[idx("client_name")],
      projectName: row[idx("project_name")],
      originalText: row[idx("original_text")],
      analyzedText: tryParseJson(row[idx("analyzed_text")]),
      completenessScore: row[idx("completeness_score")],
      missingFields: tryParseJson(row[idx("missing_fields")]),
      status: row[idx("status")],
      createdAt: row[idx("created_at")],
    };

    if (result.userId !== req.user.id) {
      const teamResult = db.exec("SELECT team_id FROM team_members WHERE user_id = ?", [req.user.id]);
      const teamIds = (teamResult[0]?.values || []).map((t) => t[0]);

      if (teamIds.length > 0) {
        const placeholders = teamIds.map(() => "?").join(",");
        const shareResult = db.exec(
          `SELECT id FROM brief_shares WHERE brief_id = ? AND team_id IN (${placeholders}) LIMIT 1`,
          [req.params.id, ...teamIds]
        );
        if (!shareResult[0]?.values?.[0]) {
          return res.status(403).json({ error: "Not authorized to view this brief" });
        }
        result.shared = true;
      } else {
        return res.status(403).json({ error: "Not authorized to view this brief" });
      }
    }

    res.json(result);
  } catch (err) {
    console.error("getBrief error:", err);
    res.status(500).json({ error: "Failed to fetch brief" });
  }
};

exports.generateEmail = (req, res) => {
  try {
    const db = getDb();
    const briefResult = db.exec(
      "SELECT id, user_id, client_name, project_name, analyzed_text, missing_fields FROM briefs WHERE id = ?",
      [req.params.id]
    );
    const row = briefResult[0]?.values?.[0];
    if (!row) {
      return res.status(404).json({ error: "Brief not found" });
    }

    const brief = {
      id: row[0],
      userId: row[1],
      clientName: row[2],
      projectName: row[3],
      analyzedText: row[4],
      missingFields: row[5],
    };

    if (brief.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const analysis = tryParseJson(brief.analyzedText);
    const missingFields = tryParseJson(brief.missingFields);
    const tone = analysis?.suggestedTone || "professional and collaborative";

    const { subject, body, html } = generateClarificationEmail({
      clientName: brief.clientName,
      projectName: brief.projectName,
      missingFields: missingFields || analysis?.fields || [],
      clarificationQuestions: analysis?.clarificationQuestions || [],
      senderName: req.user.name,
    });

    emit("brief.email_generated", {
      userId: req.user.id,
      briefId: req.params.id,
    });

    res.json({ subject, body, html, suggestedTone: tone });
  } catch (err) {
    console.error("generateEmail error:", err);
    res.status(500).json({ error: "Failed to generate email" });
  }
};

exports.getFields = (_req, res) => {
  res.json({ fields: FIELDS });
};

exports.getDashboardStats = (req, res) => {
  try {
    const uid = req.user.id;
    const db = getDb();

    const result = db.exec(
      "SELECT completeness_score, status, created_at, project_name, industry FROM briefs WHERE user_id = ? ORDER BY created_at ASC",
      [uid]
    );

    const mapped = (result[0]?.values || []).map((r) => ({
      score: r[0],
      status: r[1],
      createdAt: r[2],
      projectName: r[3],
      industry: r[4],
    }));

    const total = mapped.length;
    const scores = mapped.map((b) => b.score).filter((s) => s != null);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const successful = scores.filter((s) => s >= 80).length;
    const successRate = scores.length > 0 ? Math.round((successful / scores.length) * 100) : 0;

    let trend = 0;
    if (scores.length >= 4) {
      const half = Math.floor(scores.length / 2);
      const firstHalf = scores.slice(0, half);
      const secondHalf = scores.slice(half);
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      trend = Math.round(secondAvg - firstAvg);
    }

    const industryMap = {};
    for (const b of mapped) {
      const ind = b.industry || "Other";
      if (!industryMap[ind]) industryMap[ind] = { scores: [], count: 0 };
      industryMap[ind].scores.push(b.score);
      industryMap[ind].count++;
    }
    const industryBreakdown = Object.entries(industryMap).map(([name, data]) => ({
      name,
      avgScore: data.scores.filter((s) => s != null).length > 0
        ? Math.round(data.scores.filter((s) => s != null).reduce((a, b) => a + b, 0) / data.scores.filter((s) => s != null).length)
        : 0,
      briefCount: data.count,
    }));

    const timeline = mapped.slice(-10).map((b) => ({
      score: b.score,
      projectName: b.projectName || "Untitled",
      date: b.createdAt,
    }));

    res.json({
      totalBriefs: total,
      avgScore,
      successRate,
      trend,
      timeSaved: `${Math.round(total * 0.5)}h`,
      industryBreakdown,
      timeline,
    });
  } catch (err) {
    console.error("getDashboardStats error:", err);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
};

function tryParseJson(str) {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

function escapeHtml(text) {
  if (typeof text !== "string") return "";
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
