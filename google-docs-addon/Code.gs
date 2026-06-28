/**
 * BriefFill Google Docs add-on
 *
 * Setup:
 *   1. Open https://script.google.com and create a new project.
 *   2. Paste the contents of this file into Code.gs.
 *   3. Add a new HTML file named "Sidebar" and paste Sidebar.html.
 *   4. Add a new HTML file named "JavaScript" and paste JavaScript.html.
 *   5. Save the manifest (appsscript.json) by clicking the gear icon and pasting it.
 *   6. Run onOpen once (authorize the prompts).
 *   7. Deploy: Deploy → New deployment → type "Add-on" → Deploy.
 *   8. In BriefFill: Settings → Integrations → generate an API key.
 *   9. Back in the add-on, paste the API key + your BriefFill API URL when prompted.
 *
 * The add-on does NOT use Google OAuth with BriefFill. It authenticates with a
 * static API key (a "Personal Access Token" in GitHub-PAT terms).
 */

const BRIEFFILL_API_URL_DEFAULT = "https://api.brieffill.app";
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
  "Constraints"
];

function onOpen(e) {
  DocumentApp.getUi()
    .createAddonMenu()
    .addItem("Analyze brief", "showSidebar")
    .addToUi();
}

function onInstall(e) {
  onOpen(e);
}

function onHomepage(e) {
  return buildCard();
}

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile("Sidebar")
    .setTitle("BriefFill");
  DocumentApp.getUi().showSidebar(html);
}

function getConfig() {
  const props = PropertiesService.getUserProperties();
  return {
    apiKey: props.getProperty("BF_API_KEY") || "",
    apiUrl: props.getProperty("BF_API_URL") || BRIEFFILL_API_URL_DEFAULT
  };
}

function saveConfig(cfg) {
  const props = PropertiesService.getUserProperties();
  if (cfg.apiKey !== undefined) props.setProperty("BF_API_KEY", cfg.apiKey);
  if (cfg.apiUrl !== undefined) props.setProperty("BF_API_URL", cfg.apiUrl);
  return getConfig();
}

function getSelectedText() {
  const sel = DocumentApp.getActiveDocument().getSelection();
  if (!sel) return "";
  const range = sel.getRangeElements();
  let text = "";
  for (let i = 0; i < range.length; i++) {
    text += range[i].getElement().asText().getText();
  }
  return text.trim();
}

function getFullDocumentText() {
  return DocumentApp.getActiveDocument().getBody().getText().trim();
}

function analyzeText(briefText) {
  const cfg = getConfig();
  if (!cfg.apiKey) throw new Error("Add your BriefFill API key in the add-on settings first.");
  if (!briefText || briefText.length < 20) throw new Error("Please select a brief (20+ characters) or open a document with content.");

  const url = (cfg.apiUrl || BRIEFFILL_API_URL_DEFAULT).replace(/\/+$/, "") + "/api/public/analyze";
  const res = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    headers: { "X-BriefFill-Api-Key": cfg.apiKey },
    payload: JSON.stringify({ briefText }),
    muteHttpExceptions: true,
    timeout: 30
  });
  const code = res.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error(`BriefFill API ${code}: ${res.getContentText().slice(0, 200)}`);
  }
  return JSON.parse(res.getContentText());
}

function insertAnalysisReport(analysis) {
  const body = DocumentApp.getActiveDocument().getBody();
  body.appendParagraph("\n— — — BriefFill Analysis — — —")
    .setHeading(DocumentApp.ParagraphHeading.HEADING2);

  const score = analysis.completenessScore != null ? analysis.completenessScore : "?";
  body.appendParagraph(`Completeness score: ${score}%`);

  if (Array.isArray(analysis.clarificationQuestions) && analysis.clarificationQuestions.length) {
    body.appendParagraph("Clarification questions:").setBold(true);
    analysis.clarificationQuestions.slice(0, 5).forEach((q) => {
      body.appendListItem(q);
    });
  }

  if (Array.isArray(analysis.fields)) {
    const missing = analysis.fields.filter((f) => f.status !== "present");
    if (missing.length) {
      body.appendParagraph("Missing or partial fields:").setBold(true);
      missing.forEach((f) => {
        body.appendListItem(`${f.name}${f.status === "partial" ? " (partial)" : ""}`);
      });
    }
  }
}

function buildCard() {
  const card = CardService.newCardBuilder().setHeader(
    CardService.newCardHeader().setTitle("BriefFill")
  );
  const section = CardService.newCardSection()
    .addWidget(CardService.newTextParagraph().setText(
      "Analyze a brief directly from Google Docs. Open a doc, then click Extensions → BriefFill → Analyze brief."
    ));
  return card.addSection(section).build();
}
