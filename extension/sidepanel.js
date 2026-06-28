// BriefFill side panel.
// Pulls a pending payload (from the content script via the background SW),
// runs the analyze request through the shared API client, and renders the
// result. Also handles "Save to BriefFill" via the JWT-authenticated endpoint.

(function () {
  "use strict";

  const els = {
    alerts: document.getElementById("alerts"),
    empty: document.getElementById("empty"),
    form: document.getElementById("form"),
    clientName: document.getElementById("clientName"),
    projectName: document.getElementById("projectName"),
    briefText: document.getElementById("briefText"),
    analyzeBtn: document.getElementById("analyzeBtn"),
    analyzeBtnLabel: document.getElementById("analyzeBtnLabel"),
    result: document.getElementById("result"),
    signedPill: document.getElementById("signedPill"),
    openSettings: document.getElementById("openSettings"),
    openBriefFill: document.getElementById("openBriefFill"),
  };

  let lastResult = null;
  let lastPayload = null;
  let busy = false;

  // ---------- Setup ----------

  document.addEventListener("DOMContentLoaded", async () => {
    await refreshAuthPill();
    await maybeConsumePending();
    bind();
    // Retry for a few seconds in case the storage write from the background
    // service worker arrives AFTER our initial check.
    let attempts = 0;
    const retry = setInterval(() => {
      attempts++;
      chrome.storage.local.get(["bfPendingPayload"], (data) => {
        if (data && data.bfPendingPayload) {
          clearInterval(retry);
          maybeConsumePending();
        } else if (attempts >= 10) {
          clearInterval(retry);
        }
      });
    }, 300);
  });

  // If a payload arrives while the panel is already open.
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === "BF_PENDING_READY") {
      maybeConsumePending();
    }
  });

  // Also listen for storage changes — the side panel may load BEFORE the
  // background SW persists the payload, so we use onChanged as a backup.
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes && changes.bfPendingPayload) {
      maybeConsumePending();
    }
  });

  // Also poll once on focus — the storage event doesn't always fire.
  window.addEventListener("focus", () => { maybeConsumePending(); });

  function bind() {
    els.analyzeBtn.addEventListener("click", onAnalyze);
    els.openSettings.addEventListener("click", (e) => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
    });
    els.openBriefFill.addEventListener("click", (e) => {
      e.preventDefault();
      BF.getConfig().then((cfg) => {
        const url = cfg.apiUrl || "http://localhost:5000";
        chrome.tabs.create({ url });
      });
    });
  }

  // ---------- Auth pill ----------

  async function refreshAuthPill() {
    const cfg = await BF.getConfig();
    if (cfg.userEmail) {
      els.signedPill.innerHTML = '<span class="bf-meta-pill bf-meta-pill--signed">Signed in as ' + BF.escapeHtml(cfg.userEmail) + "</span>";
    } else if (cfg.apiKey) {
      els.signedPill.innerHTML = '<span class="bf-meta-pill bf-meta-pill--anon">Analyze only</span>';
    } else {
      els.signedPill.innerHTML = '<span class="bf-meta-pill bf-meta-pill--anon">Not configured</span>';
    }
    // The "Open BriefFill" link points to whatever the user has configured as the API URL.
    if (els.openBriefFill) {
      els.openBriefFill.setAttribute("href", cfg.apiUrl || "http://localhost:5000");
    }
  }

  // ---------- Pending payload (from content script) ----------

  function maybeConsumePending() {
    chrome.storage.local.get(["bfPendingPayload"], (data) => {
      if (!data || !data.bfPendingPayload) {
        showEmptyIfNeeded();
        return;
      }
      const payload = data.bfPendingPayload;
      const age = Date.now() - (payload.ts || 0);
      if (age > 5 * 60 * 1000) {
        // Older than 5 minutes — discard.
        chrome.storage.local.remove("bfPendingPayload");
        showEmptyIfNeeded();
        return;
      }
      applyPayload(payload);
      chrome.storage.local.remove("bfPendingPayload");
    });
  }

  function applyPayload(payload) {
    lastPayload = payload;
    els.briefText.value = payload.briefText || "";
    if (payload.context) {
      if (payload.context.senderName && !els.clientName.value) {
        els.clientName.value = payload.context.senderName;
      }
      if (payload.context.subject && !els.projectName.value) {
        els.projectName.value = payload.context.subject;
      }
    }
    showForm();
    // Show a "ready" alert so the user sees their selection made it into the panel.
    const source = payload.source === "gmail" ? "Gmail selection" : "selection";
    const filled = [];
    if (payload.context && payload.context.senderName) filled.push("client");
    if (payload.context && payload.context.subject) filled.push("project");
    const filledNote = filled.length ? ` (auto-filled ${filled.join(" + ")})` : "";
    showAlert("info", `Loaded ${source} \u2014 ${(payload.briefText || "").length} chars${filledNote}. Analyzing\u2026`);
    runAnalyze();
  }

  // ---------- Render states ----------

  function showEmpty() {
    els.empty.innerHTML = renderEmpty();
    els.empty.style.display = "";
    els.form.style.display = "none";
    els.result.style.display = "none";
  }

  function showEmptyIfNeeded() {
    if (els.briefText.value.trim()) {
      showForm();
    } else {
      showEmpty();
    }
  }

  function showForm() {
    els.empty.style.display = "none";
    els.form.style.display = "";
    // Don't touch els.result — it stays in its last state.
  }

  function showResult(analysis) {
    lastResult = analysis;
    els.result.style.display = "";
    els.result.innerHTML = renderResult(analysis);
    bindResultHandlers();
  }

  // ---------- Empty state ----------

  function renderEmpty() {
    return `
      <div class="bf-empty">
        <div class="bf-empty-icon">✦</div>
        <h3>Analyze a brief</h3>
        <p>Highlight text on any page (Gmail, Slack, Notion, anywhere) and click the floating pill. Or paste a brief below.</p>
        <button id="emptyCta" class="bf-btn bf-btn--secondary">Get started</button>
      </div>
    `;
  }

  document.addEventListener("click", (e) => {
    if (e.target && e.target.id === "emptyCta") {
      els.form.style.display = "";
      els.empty.style.display = "none";
      els.briefText.focus();
    }
  });

  // ---------- Analyze ----------

  async function onAnalyze() {
    if (busy) return;
    await runAnalyze();
  }

  async function runAnalyze() {
    const text = els.briefText.value.trim();
    if (!text) {
      showAlert("error", "Paste a brief first (or highlight text on the page).");
      return;
    }
    busy = true;
    els.analyzeBtn.disabled = true;
    els.analyzeBtnLabel.innerHTML = '<span class="bf-spinner"></span> Analyzing…';
    clearAlerts();
    try {
      const analysis = await BF.analyze(text);
      showResult(analysis);
      showAlert("success", "Analysis complete (" + analysis.completenessScore + "% complete)");
    } catch (err) {
      showAlert("error", err.message || "Analysis failed");
      if (err.status === 401) {
        showAlert("info", "Open the extension Settings to set or update your API key.");
      }
    } finally {
      busy = false;
      els.analyzeBtn.disabled = false;
      els.analyzeBtnLabel.textContent = "Analyze";
    }
  }

  // ---------- Result render ----------

  function renderResult(analysis) {
    const score = Number(analysis.completenessScore) || 0;
    const scoreCls = BF.scoreClass(score);
    const fields = Array.isArray(analysis.fields) ? analysis.fields : [];
    const questions = Array.isArray(analysis.clarificationQuestions) ? analysis.clarificationQuestions : [];
    const tone = analysis.suggestedTone || "";
    const summary = analysis.summary || "";

    const circumference = 2 * Math.PI * 36;
    const offset = circumference * (1 - score / 100);

    const fieldRows = fields.map((f) => {
      const status = ["present", "partial", "missing"].includes(f.status) ? f.status : "missing";
      return `
        <div class="bf-field">
          <span class="bf-field-name">${BF.escapeHtml(f.name)}</span>
          <span class="bf-field-pill bf-field-pill--${status}">${status}</span>
        </div>
      `;
    }).join("");

    const missing = fields.filter((f) => f.status !== "present");
    const missingBlock = missing.length
      ? `
        <div class="bf-section">
          <h2>Needs attention</h2>
          ${missing.slice(0, 6).map((f) => `
            <div class="bf-field">
              <span class="bf-field-name">${BF.escapeHtml(f.name)}${f.status === "partial" ? " (partial)" : ""}</span>
            </div>
            ${f.question ? `<div class="bf-question">${BF.escapeHtml(f.question)}</div>` : ""}
          `).join("")}
        </div>
      `
      : "";

    const questionsBlock = questions.length
      ? `
        <div class="bf-section">
          <h2>Suggested questions</h2>
          ${questions.slice(0, 5).map((q) => `<div class="bf-question">${BF.escapeHtml(q)}</div>`).join("")}
        </div>
      `
      : "";

    const toneBlock = tone
      ? `<div class="bf-section"><h2>Suggested tone</h2><span class="bf-tone">${BF.escapeHtml(tone)}</span></div>`
      : "";

    return `
      <div class="bf-score-card">
        <svg width="84" height="84" viewBox="0 0 84 84" aria-label="Score ${score}%">
          <circle cx="42" cy="42" r="36" fill="none" stroke="var(--bf-bg-soft)" stroke-width="8"/>
          <circle cx="42" cy="42" r="36" fill="none" stroke="${BF.scoreColor(score)}" stroke-width="8"
            stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
            transform="rotate(-90 42 42)"/>
          <text x="42" y="50" text-anchor="middle" font-size="20" font-weight="800" fill="var(--bf-text)">${score}%</text>
        </svg>
        <div class="bf-score-card-text">
          <p class="score" style="color:${BF.scoreColor(score)}">${score}%</p>
          <p class="label">Completeness</p>
          ${summary ? `<p class="summary">${BF.escapeHtml(summary)}</p>` : ""}
        </div>
      </div>
      <div class="bf-section">
        <h2>Field status</h2>
        ${fieldRows || '<div class="bf-empty"><p>No field data</p></div>'}
      </div>
      ${missingBlock}
      ${questionsBlock}
      ${toneBlock}
      <div class="bf-section">
        <h2>Actions</h2>
        <div class="bf-action-row">
          <button id="saveBtn" class="bf-btn">Save to BriefFill</button>
          <button id="copyBtn" class="bf-btn bf-btn--secondary">Copy analysis</button>
          <button id="reanalyzeBtn" class="bf-btn bf-btn--ghost">Re-analyze</button>
        </div>
      </div>
    `;
  }

  function bindResultHandlers() {
    const saveBtn = document.getElementById("saveBtn");
    const copyBtn = document.getElementById("copyBtn");
    const reanalyzeBtn = document.getElementById("reanalyzeBtn");
    if (saveBtn) saveBtn.addEventListener("click", onSave);
    if (copyBtn) copyBtn.addEventListener("click", onCopy);
    if (reanalyzeBtn) reanalyzeBtn.addEventListener("click", runAnalyze);
  }

  // ---------- Save ----------

  async function onSave() {
    if (busy) return;
    const clientName = els.clientName.value.trim();
    const projectName = els.projectName.value.trim();
    if (!clientName || !projectName) {
      showAlert("error", "Add a client name and project name before saving.");
      return;
    }
    const cfg = await BF.getConfig();
    if (!cfg.jwt) {
      showAlert("info", "Sign in inside Settings to enable saving to your account.");
      chrome.runtime.openOptionsPage();
      return;
    }
    busy = true;
    const saveBtn = document.getElementById("saveBtn");
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="bf-spinner"></span> Saving…';
    }
    try {
      const res = await BF.saveBrief({ clientName, projectName, briefText: els.briefText.value });
      const id = res && res.id;
      showAlert("success", "Saved to BriefFill" + (id ? " (id " + id + ")" : "") + ".");
    } catch (err) {
      if (err.status === 401) {
        showAlert("error", "Your session expired. Sign in again in Settings.");
      } else {
        showAlert("error", err.message || "Save failed");
      }
    } finally {
      busy = false;
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save to BriefFill";
      }
    }
  }

  // ---------- Copy ----------

  async function onCopy() {
    if (!lastResult) return;
    const client = els.clientName.value.trim() || "—";
    const project = els.projectName.value.trim() || "—";
    const text = formatCopy(client, project, lastResult);
    try {
      await navigator.clipboard.writeText(text);
      showAlert("success", "Analysis copied to clipboard");
    } catch {
      showAlert("error", "Couldn't write to clipboard. Copy manually from the page.");
    }
  }

  function formatCopy(client, project, r) {
    const lines = [
      `Client: ${client}`,
      `Project: ${project}`,
      `Completeness: ${r.completenessScore}%`,
      "",
    ];
    if (r.fields && r.fields.length) {
      lines.push("Field status:");
      r.fields.forEach((f) => lines.push(`  - ${f.name}: ${f.status}`));
      lines.push("");
    }
    if (r.clarificationQuestions && r.clarificationQuestions.length) {
      lines.push("Suggested questions:");
      r.clarificationQuestions.forEach((q, i) => lines.push(`  ${i + 1}. ${q}`));
      lines.push("");
    }
    if (r.suggestedTone) lines.push(`Suggested tone: ${r.suggestedTone}`);
    if (r.summary) lines.push("", r.summary);
    return lines.join("\n");
  }

  // ---------- Alerts ----------

  function showAlert(type, msg) {
    clearAlerts();
    const div = document.createElement("div");
    div.className = "bf-alert bf-alert--" + type;
    div.textContent = msg;
    els.alerts.appendChild(div);
    if (type === "success" || type === "info") {
      setTimeout(() => { if (div.parentNode) div.remove(); }, 4000);
    }
  }

  function clearAlerts() {
    els.alerts.innerHTML = "";
  }
})();
