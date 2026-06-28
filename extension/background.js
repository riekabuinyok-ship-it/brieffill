// BriefFill Browser Extension — Background Service Worker

const STORAGE_KEY = "brieffill_config";

let config = { apiKey: "", serverUrl: "https://brieffill.com" };

// Load config on startup
chrome.storage.sync.get(STORAGE_KEY, (result) => {
  if (result[STORAGE_KEY]) config = { ...config, ...result[STORAGE_KEY] };
});

// Listen for config changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes[STORAGE_KEY]) config = { ...config, ...changes[STORAGE_KEY].newValue };
});

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "analyze-selection",
    title: "Analyze with BriefFill",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    id: "analyze-page",
    title: "Analyze this page with BriefFill",
    contexts: ["page"],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "analyze-selection" && info.selectionText) {
    chrome.storage.local.set({ pendingText: info.selectionText }, () => {
      chrome.action.openPopup();
    });
  }
  if (info.menuItemId === "analyze-page") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.body.innerText,
    }).then((results) => {
      if (results?.[0]?.result) {
        const text = results[0].result.slice(0, 10000);
        chrome.storage.local.set({ pendingText: text }, () => {
          chrome.action.openPopup();
        });
      }
    });
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "ANALYZE") {
    handleAnalyze(request, sendResponse);
    return true; // keep channel open for async
  }
  if (request.type === "GET_CONFIG") {
    sendResponse(config);
  }
  if (request.type === "SAVE_HISTORY") {
    chrome.storage.local.get({ history: [] }, (result) => {
      const history = [request.item, ...result.history].slice(0, 20);
      chrome.storage.local.set({ history }, () => sendResponse({ ok: true }));
    });
    return true;
  }
  if (request.type === "GET_HISTORY") {
    chrome.storage.local.get({ history: [] }, (result) => {
      sendResponse(result.history);
    });
    return true;
  }
});

async function handleAnalyze(request, sendResponse) {
  const { briefText, clientName, projectName } = request;

  if (!briefText || !clientName || !projectName) {
    sendResponse({ error: "Please fill in all required fields" });
    return;
  }
  if (!config.apiKey) {
    sendResponse({ error: "API key not configured. Open extension settings to add your key." });
    return;
  }

  // Try production first, fall back to localhost
  const urls = [
    `${config.serverUrl}/api/briefs/analyze`,
    "http://localhost:5000/api/briefs/analyze",
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({ briefText, clientName, projectName }),
      });
      const data = await res.json();
      if (res.ok) {
        sendResponse(data);
        return;
      }
      if (res.status === 401 || res.status === 403) {
        sendResponse({ error: "Invalid API key. Check your settings." });
        return;
      }
      // If 404 on production, try localhost; if localhost fails too, return error
      if (url === urls[urls.length - 1]) {
        sendResponse({ error: data.error || `Analysis failed (${res.status})` });
      }
    } catch (err) {
      if (url === urls[urls.length - 1]) {
        sendResponse({ error: "Cannot reach BriefFill servers. Check your connection." });
      }
      // otherwise try next URL
    }
  }
}
