const path = require("path");
const fs = require("fs");
const bcrypt = require(require.resolve("bcryptjs", { paths: [path.join(__dirname, "..", "backend", "node_modules")] }));
const initSqlJs = require(require.resolve("sql.js", { paths: [path.join(__dirname, "..", "backend", "node_modules")] }));

const fields = [
  { field_name: "Project Overview", description: "What is the project about? What is the goal?", example_question: "Could you briefly describe the project and its primary goal? How will success be measured?" },
  { field_name: "Target Audience", description: "Who is this for? Demographics, psychographics, current behavior.", example_question: "Who is the primary audience for this project? Can you describe their age, profession, and what they care about most?" },
  { field_name: "Core Problem", description: "What problem does this product/service solve for the audience?", example_question: "What specific problem does your product/service solve that existing solutions don''t address?" },
  { field_name: "Solution/Offer", description: "What is the actual offering? Features, benefits, unique value proposition.", example_question: "What is the core offering? What makes it different from competitors?" },
  { field_name: "Key Benefits", description: "What are the top 3-5 benefits the audience will experience?", example_question: "What are the main benefits someone will get from using this? Why should they care?" },
  { field_name: "Tone of Voice", description: "What is the brand personality? Professional? Playful? Authoritative?", example_question: "What tone should the messaging use? Is the brand more professional, friendly, bold, or humorous?" },
  { field_name: "Brand Guidelines", description: "Colors, fonts, logo usage, design system links.", example_question: "Do you have existing brand guidelines or a style guide I should follow? If not, any preferences on colors/fonts?" },
  { field_name: "Deliverables", description: "What exactly are you delivering? List of all outputs.", example_question: "Can you provide a list of all deliverables expected from this project? Please be as specific as possible." },
  { field_name: "Timeline", description: "When is this needed? Milestones, final deadline.", example_question: "What is the ideal timeline for this project? Are there any specific milestones or important dates?" },
  { field_name: "Budget", description: "What is the approximate budget? Helps scope the work.", example_question: "Do you have a budget range in mind for this project? This helps me suggest the best scope of work." },
  { field_name: "Competitors", description: "Who else is doing something similar?", example_question: "Who are your main competitors? What do you think they do well/poorly?" },
  { field_name: "Call to Action", description: "What do you want the audience to do after consuming this?", example_question: "What is the primary action you want the audience to take after seeing this (e.g., sign up, buy, contact)?" },
];

const DEMO_USER = {
  email: "demo@brieffill.com",
  name: "Jack William",
  password: "demo1234",
};

const sampleBriefs = [
  {
    clientName: "Stellar Dynamics",
    projectName: "Q4 Global Marketing Strategy",
    originalText: `We need a comprehensive global marketing strategy for our SaaS platform launch in Q4. Our target audience is enterprise CTOs and VPs of Engineering in North America and Europe. The main problem we solve is reducing cloud infrastructure costs by 40% on average. We have a 6-month timeline and a budget of $150k. Tone should be authoritative but approachable. No specific brand guidelines yet — open to suggestions. Competitors include Vantage, CloudHealth, and Spot.io.`,
    score: 89,
    fields: [
      { name: "Project Overview", status: "present", question: "" },
      { name: "Target Audience", status: "present", question: "" },
      { name: "Core Problem", status: "present", question: "" },
      { name: "Solution/Offer", status: "present", question: "" },
      { name: "Key Benefits", status: "partial", question: "Can you provide specific metrics or case studies showing the 40% cost reduction?" },
      { name: "Tone of Voice", status: "present", question: "" },
      { name: "Brand Guidelines", status: "missing", question: "Do you have existing brand guidelines, or should we propose a new visual identity?" },
      { name: "Deliverables", status: "partial", question: "Could you list the specific deliverables expected (e.g., campaign assets, landing pages, video content)?" },
      { name: "Timeline", status: "present", question: "" },
      { name: "Budget", status: "present", question: "" },
      { name: "Competitors", status: "present", question: "" },
      { name: "Call to Action", status: "missing", question: "What is the primary action you want prospects to take (book demo, sign up, contact sales)?" },
    ],
  },
  {
    clientName: "OmniRetail Inc.",
    projectName: "Product Launch v2.1",
    originalText: `We are launching v2.1 of our retail analytics platform. The new version adds real-time inventory tracking and AI-powered demand forecasting. Budget around $80k. Need this done in 3 months. Target audience is mid-market retail operations managers.`,
    score: 62,
    fields: [
      { name: "Project Overview", status: "present", question: "" },
      { name: "Target Audience", status: "partial", question: "Can you describe the typical day of a mid-market retail operations manager using your platform?" },
      { name: "Core Problem", status: "partial", question: "What specific pain points does v2.1 address that existing solutions don't?" },
      { name: "Solution/Offer", status: "present", question: "" },
      { name: "Key Benefits", status: "missing", question: "What are the top 3-5 benefits of the new real-time tracking and AI forecasting features?" },
      { name: "Tone of Voice", status: "missing", question: "What tone fits your brand — technical, friendly, corporate?" },
      { name: "Brand Guidelines", status: "missing", question: "Do you have a style guide for launch materials?" },
      { name: "Deliverables", status: "partial", question: "List all expected deliverables for the launch." },
      { name: "Timeline", status: "present", question: "" },
      { name: "Budget", status: "present", question: "" },
      { name: "Competitors", status: "missing", question: "Who are your main competitors in retail analytics?" },
      { name: "Call to Action", status: "missing", question: "What should the CTA be for this launch?" },
    ],
  },
  {
    clientName: "Velo Financial",
    projectName: "UX Research Overview",
    originalText: `We are a fintech startup building a new personal finance app for Gen Z. Our app helps users automatically save money by analyzing their spending patterns. The brand is friendly, modern, and slightly playful. We have brand guidelines with a specific color palette (mint green, coral, navy) and a custom typeface. Our target users are 18-28 year olds who are tech-savvy but new to personal finance. We are different from Mint and YNAB because we focus on passive saving rather than active budgeting. The primary CTA is to download the app. Timeline: 8 weeks. Budget: $45,000.`,
    score: 94,
    fields: [
      { name: "Project Overview", status: "present", question: "" },
      { name: "Target Audience", status: "present", question: "" },
      { name: "Core Problem", status: "present", question: "" },
      { name: "Solution/Offer", status: "present", question: "" },
      { name: "Key Benefits", status: "present", question: "" },
      { name: "Tone of Voice", status: "present", question: "" },
      { name: "Brand Guidelines", status: "present", question: "" },
      { name: "Deliverables", status: "partial", question: "What specific deliverables are expected from this UX research phase?" },
      { name: "Timeline", status: "present", question: "" },
      { name: "Budget", status: "present", question: "" },
      { name: "Competitors", status: "present", question: "" },
      { name: "Call to Action", status: "present", question: "" },
    ],
  },
  {
    clientName: "Acme Corp",
    projectName: "Website Refresh",
    originalText: `Our website is outdated and we want to refresh it. Looking for a modern design. Budget flexible.`,
    score: 18,
    fields: [
      { name: "Project Overview", status: "partial", question: "What specific goals do you have for the refreshed website?" },
      { name: "Target Audience", status: "missing", question: "Who is the primary audience for your website?" },
      { name: "Core Problem", status: "missing", question: "What specific problems with the current site are you trying to solve?" },
      { name: "Solution/Offer", status: "missing", question: "What does your company offer?" },
      { name: "Key Benefits", status: "missing", question: "What are the key benefits of working with Acme?" },
      { name: "Tone of Voice", status: "missing", question: "What tone fits your brand?" },
      { name: "Brand Guidelines", status: "missing", question: "Do you have existing brand guidelines?" },
      { name: "Deliverables", status: "partial", question: "What specific pages and features do you need?" },
      { name: "Timeline", status: "missing", question: "When do you need the new site launched?" },
      { name: "Budget", status: "partial", question: "Can you provide a specific budget range?" },
      { name: "Competitors", status: "missing", question: "Who are your main competitors?" },
      { name: "Call to Action", status: "missing", question: "What is the primary CTA on the new site?" },
    ],
  },
];

const dbPath = path.join(__dirname, "brieffill.db");
const schemaPath = path.join(__dirname, "schema.sql");

function buildAnalysis(fields) {
  return {
    completenessScore: 0,
    fields,
    clarificationQuestions: fields
      .filter((f) => f.status !== "present")
      .map((f) => f.question)
      .filter(Boolean),
    suggestedTone: "professional and collaborative",
  };
}

async function seed() {
  const SQL = await initSqlJs();

  let db;
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
    console.log("Loaded existing database.");
  } else {
    db = new SQL.Database();
    const schema = fs.readFileSync(schemaPath, "utf-8");
    db.run(schema);
    console.log("Created new database from schema.");
  }

  const tableCheck = db.exec("SELECT count(*) AS cnt FROM sqlite_master WHERE type='table' AND name='field_definitions'");
  if (!tableCheck[0]?.values[0][0]) {
    const schema = fs.readFileSync(schemaPath, "utf-8");
    db.run(schema);
    console.log("Ran schema (field_definitions table was missing).");
  }

  db.run("DELETE FROM field_definitions");
  console.log("Cleared existing field_definitions.");
  for (const f of fields) {
    db.run(
      "INSERT INTO field_definitions (field_name, description, example_question) VALUES (?, ?, ?)",
      [f.field_name, f.description, f.example_question]
    );
  }
  console.log(`Seeded ${fields.length} field definitions.`);

  // Demo user
  const existing = db.exec(`SELECT id FROM users WHERE email = '${DEMO_USER.email}'`);
  let userId;
  if (existing[0]?.values.length) {
    userId = existing[0].values[0][0];
    console.log(`Demo user already exists (id=${userId}). Updating details.`);
    db.run("UPDATE users SET name = ?, password_hash = ?, subscription_status = 'active' WHERE id = ?", [DEMO_USER.name, await bcrypt.hash(DEMO_USER.password, 10), userId]);
  } else {
    const passwordHash = await bcrypt.hash(DEMO_USER.password, 10);
    const trialEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace("T", " ");
    db.run("INSERT INTO users (email, name, password_hash, subscription_status, trial_end_date) VALUES (?, ?, ?, 'active', ?)", [DEMO_USER.email, DEMO_USER.name, passwordHash, trialEnd]);
    userId = db.exec("SELECT last_insert_rowid() AS id")[0].values[0][0];
    console.log(`Created demo user (id=${userId}).`);
  }

  // Sample briefs
  db.run("DELETE FROM briefs WHERE user_id = ?", [userId]);
  console.log("Cleared existing demo briefs.");
  for (const b of sampleBriefs) {
    const analysis = buildAnalysis(b.fields);
    analysis.completenessScore = b.score;
    const missingFields = b.fields.filter((f) => f.status !== "present");
    db.run(
      "INSERT INTO briefs (user_id, client_name, project_name, original_text, analyzed_text, completeness_score, missing_fields, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'analyzed')",
      [userId, b.clientName, b.projectName, b.originalText, JSON.stringify(analysis), b.score, JSON.stringify(missingFields)]
    );
  }
  console.log(`Seeded ${sampleBriefs.length} sample briefs.`);

  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
  console.log(`\nDemo credentials:`);
  console.log(`  Email:    ${DEMO_USER.email}`);
  console.log(`  Password: ${DEMO_USER.password}`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
