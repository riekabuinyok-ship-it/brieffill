// BriefFill Browser Extension — Popup Script

document.addEventListener("DOMContentLoaded", () => {
  const views = { analyze: "analyzeTab", history: "historyTab" };
  let currentResult = null;
  let currentBriefText = "";

  // DOM refs
  const clientName = document.getElementById("clientName");
  const projectName = document.getElementById("projectName");
  const briefText = document.getElementById("briefText");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const btnText = document.getElementById("btnText");
  const btnSpinner = document.getElementById("btnSpinner");
  const errorMsg = document.getElementById("errorMsg");
  const formSection = document.getElementById("formSection");
  const resultSection = document.getElementById("resultSection");
  const scoreDisplay = document.getElementById("scoreDisplay");
  const resultTitle = document.getElementById("resultTitle");
  const resultSubtitle = document.getElementById("resultSubtitle");
  const toneDisplay = document.getElementById("toneDisplay");
  const fieldsContainer = document.getElementById("fieldsContainer");
  const questionsList = document.getElementById("questionsList");
  const questionsContainer = document.getElementById("questionsContainer");
  const copyBtn = document.getElementById("copyBtn");
  const dashboardBtn = document.getElementById("dashboardBtn");
  const newBtn = document.getElementById("newBtn");
  const clearBtn = document.getElementById("clearBtn");
  const pasteBtn = document.getElementById("pasteBtn");
  const settingsBtn = document.getElementById("settingsBtn");
  const historyList = document.getElementById("historyList");
  const historyEmpty = document.getElementById("historyEmpty");

  // Load pending text from context menu
  chrome.storage.local.get("pendingText", (result) => {
    if (result.pendingText) {
      briefText.value = result.pendingText;
      chrome.storage.local.remove("pendingText");
      // Auto-detect client/project from text
      detectFields(result.pendingText);
    }
  });

  // Tab switching
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const tabId = tab.dataset.tab;
      document.querySelectorAll("#analyzeTab, #historyTab").forEach((el) => el.classList.add("hidden"));
      document.getElementById(views[tabId]).classList.remove("hidden");
      if (tabId === "history") loadHistory();
    });
  });

  // Analyze
  analyzeBtn.addEventListener("click", analyze);
  briefText.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.ctrlKey) analyze();
  });

  async function analyze() {
    const text = briefText.value.trim();
    const client = clientName.value.trim();
    const project = projectName.value.trim();
    if (!text || !client || !project) {
      showError("Please fill in all fields");
      return;
    }
    currentBriefText = text;

    setLoading(true);
    hideError();
    hideResult();

    try {
      const result = await sendMessage({ type: "ANALYZE", briefText: text, clientName: client, projectName: project });
      if (result.error) {
        showError(result.error);
        setLoading(false);
        return;
      }
      currentResult = result;
      showResult(result);
      saveToHistory({ text, client, project, result });
    } catch (err) {
      showError("Failed to analyze. Try again.");
    }
    setLoading(false);
  }

  function showResult(result) {
    formSection.classList.add("hidden");
    resultSection.classList.remove("hidden");

    const score = result.completenessScore ?? result.completeness_score ?? 0;
    scoreDisplay.textContent = score;
    scoreDisplay.style.borderColor = score >= 80 ? "#16A34A" : score >= 60 ? "#D97706" : "#DC2626";
    scoreDisplay.style.color = score >= 80 ? "#16A34A" : score >= 60 ? "#D97706" : "#DC2626";

    resultTitle.textContent = `Score: ${score}/100`;

    const fields = result.fields || [];
    const present = fields.filter((f) => f.status === "present").length;
    resultSubtitle.textContent = `${present}/${fields.length} fields complete`;

    toneDisplay.textContent = result.suggestedTone ? `Suggested tone: ${result.suggestedTone}` : "";

    // Fields
    fieldsContainer.innerHTML = fields
      .map(
        (f) => `
        <div class="field-row">
          <span>${f.name}</span>
          <span class="status status-${f.status}">
            <span class="status-dot dot-${f.status}"></span>${f.status.toUpperCase()}
          </span>
        </div>`
      )
      .join("");

    // Questions
    const questions = result.clarificationQuestions || result.clarifying_questions || [];
    if (questions.length > 0) {
      questionsContainer.classList.remove("hidden");
      questionsList.innerHTML = questions.map((q) => `<li>${q}</li>`).join("");
    } else {
      questionsContainer.classList.add("hidden");
    }
  }

  // Copy questions
  copyBtn.addEventListener("click", () => {
    const questions = currentResult?.clarificationQuestions || currentResult?.clarifying_questions || [];
    if (questions.length > 0) {
      const text = questions.map((q, i) => `${i + 1}. ${q}`).join("\n");
      navigator.clipboard.writeText(text);
      copyBtn.textContent = "Copied!";
      setTimeout(() => (copyBtn.textContent = "Copy Questions"), 2000);
    }
  });

  // Open dashboard
  dashboardBtn.addEventListener("click", () => {
    if (currentResult?.id) {
      chrome.tabs.create({ url: `http://localhost:5173/brief/${currentResult.id}` });
    } else {
      chrome.tabs.create({ url: "http://localhost:5173/dashboard" });
    }
  });

  // New analysis
  newBtn.addEventListener("click", () => {
    resultSection.classList.add("hidden");
    formSection.classList.remove("hidden");
    currentResult = null;
  });

  // Clear
  clearBtn.addEventListener("click", () => {
    briefText.value = "";
    clientName.value = "";
    projectName.value = "";
    hideError();
  });

  // Paste
  pasteBtn.addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        briefText.value = text;
        detectFields(text);
      }
    } catch {
      showError("Cannot read clipboard. Paste manually.");
    }
  });

  // Settings
  settingsBtn.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  // Helpers
  function setLoading(loading) {
    btnText.textContent = loading ? "Analyzing..." : "Analyze with AI";
    btnSpinner.classList.toggle("hidden", !loading);
    analyzeBtn.disabled = loading;
  }

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.remove("hidden");
  }

  function hideError() {
    errorMsg.classList.add("hidden");
  }

  function hideResult() {
    resultSection.classList.add("hidden");
    formSection.classList.remove("hidden");
  }

  function sendMessage(msg) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(msg, (response) => resolve(response));
    });
  }

  function detectFields(text) {
    // Try to detect client name — look for "client" mentions
    const clientMatch = text.match(/client\s*[:\-–—]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
    if (clientMatch && !clientName.value) clientName.value = clientMatch[1].trim();

    // Try to detect project name — look for "project" mentions
    const projMatch = text.match(/project\s*[:\-–—]?\s*(.+?)(?:\.|\n)/i);
    if (projMatch && !projectName.value) projectName.value = projMatch[1].trim();
  }

  function saveToHistory(item) {
    sendMessage({
      type: "SAVE_HISTORY",
      item: {
        text: item.text.slice(0, 200),
        client: item.client,
        project: item.project,
        score: item.result.completenessScore ?? item.result.completeness_score,
        timestamp: Date.now(),
      },
    });
  }

  function loadHistory() {
    sendMessage({ type: "GET_HISTORY" }).then((history) => {
      if (history && history.length > 0) {
        historyEmpty.classList.add("hidden");
        historyList.innerHTML = history
          .map(
            (h) =>
              `<div class="history-item" data-client="${h.client}" data-project="${h.project}">
                <div>
                  <div class="h-name">${h.client || "Unknown"} — ${h.project || "Unknown"}</div>
                  <div class="h-meta">Score: ${h.score ?? "—"} · ${new Date(h.timestamp).toLocaleDateString()}</div>
                </div>
                <span style="font-size:11px;color:#4F46E5;">View</span>
              </div>`
          )
          .join("");
        // Click on history item to pre-fill and analyze tab
        document.querySelectorAll(".history-item").forEach((el) => {
          el.addEventListener("click", () => {
            clientName.value = el.dataset.client;
            projectName.value = el.dataset.project;
            document.querySelector('[data-tab="analyze"]').click();
          });
        });
      } else {
        historyList.innerHTML = "";
        historyEmpty.classList.remove("hidden");
      }
    });
  }
});
