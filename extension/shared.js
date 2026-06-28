// Shared helpers used by background.js, sidepanel.js, popup.js, options.js.
// Exports nothing (each entry point is a self-contained script tag); just
// defines `window.BF` with utility functions + a small namespaced namespace.

(function () {
  "use strict";

  const DEFAULT_API_URL = "";

  const STATUS_COLORS = {
    present: { bg: "#dcfce7", fg: "#166534", label: "Present" },
    partial: { bg: "#fef3c7", fg: "#92400e", label: "Partial" },
    missing: { bg: "#fee2e2", fg: "#991b1b", label: "Missing" },
  };

  function statusConfig(status) {
    return STATUS_COLORS[status] || STATUS_COLORS.missing;
  }

  function scoreClass(score) {
    if (score >= 75) return "high";
    if (score >= 50) return "mid";
    return "low";
  }

  function scoreColor(score) {
    if (score >= 75) return "#16a34a";
    if (score >= 50) return "#d97706";
    return "#dc2626";
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  function normalizeApiUrl(raw) {
    if (!raw) return DEFAULT_API_URL;
    let url = String(raw).trim().replace(/\/+$/, "");
    if (!url) return DEFAULT_API_URL;
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    return url;
  }

  async function getConfig() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["apiUrl", "apiKey", "jwt", "userEmail", "userName", "userId"], (cfg) => {
        resolve({
          apiUrl: normalizeApiUrl(cfg.apiUrl),
          apiKey: cfg.apiKey || "",
          jwt: cfg.jwt || "",
          userEmail: cfg.userEmail || "",
          userName: cfg.userName || "",
          userId: cfg.userId || null,
        });
      });
    });
  }

  async function setConfig(patch) {
    return new Promise((resolve) => {
      chrome.storage.local.set(patch, () => resolve());
    });
  }

  async function clearSession() {
    return new Promise((resolve) => {
      chrome.storage.local.remove(["jwt", "userEmail", "userName", "userId"], () => resolve());
    });
  }

  async function bfFetch(path, { method = "GET", body, requireAuth = "apiKey" } = {}) {
    const cfg = await getConfig();
    if (requireAuth === "apiKey" && !cfg.apiKey) {
      throw new Error("No API key configured. Open the extension Settings to add one.");
    }
    if (!cfg.apiUrl) {
      throw new Error("No API URL configured. Open the extension Settings and set the BriefFill API URL (e.g. http://localhost:5000).");
    }
    const url = cfg.apiUrl + path;
    const headers = { "Content-Type": "application/json" };
    if (requireAuth === "apiKey" || requireAuth === "any") {
      if (cfg.apiKey) headers["X-BriefFill-Api-Key"] = cfg.apiKey;
    }
    if (requireAuth === "jwt") {
      if (!cfg.jwt) throw new Error("Not signed in. Open the extension Settings to sign in.");
      headers["Authorization"] = "Bearer " + cfg.jwt;
    } else if (requireAuth === "any" && cfg.jwt) {
      headers["Authorization"] = "Bearer " + cfg.jwt;
    }
    let res;
    try {
      res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (err) {
      const reason = err && err.message ? err.message : "request failed";
      throw new Error(
        "Network error: cannot reach " + cfg.apiUrl + " (" + reason + "). " +
        "Check the API URL in Settings — make sure the BriefFill backend is running and accessible."
      );
    }
    const text = await res.text();
    let json = null;
    if (text) {
      try { json = JSON.parse(text); } catch { /* not JSON */ }
    }
    if (!res.ok) {
      const msg = (json && json.error) || (text || res.statusText).slice(0, 200);
      const e = new Error(msg);
      e.status = res.status;
      e.body = json;
      throw e;
    }
    return json || {};
  }

  async function analyze(briefText) {
    if (!briefText || typeof briefText !== "string") {
      throw new Error("No brief text provided");
    }
    const trimmed = briefText.trim();
    if (trimmed.length < 20) throw new Error("Brief text must be at least 20 characters");
    if (trimmed.length > 20000) throw new Error("Brief text must be 20000 characters or fewer");
    return bfFetch("/api/public/analyze", { method: "POST", body: { briefText: trimmed } });
  }

  async function login(email, password) {
    const cfg = await getConfig();
    if (!cfg.apiUrl) {
      throw new Error("No API URL configured. Open the extension Settings and set the BriefFill API URL first.");
    }
    let res;
    try {
      res = await fetch(cfg.apiUrl + "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    } catch (err) {
      throw new Error("Network error: cannot reach " + cfg.apiUrl + " (" + (err?.message || "request failed") + ").");
    }
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    if (!res.ok) {
      throw new Error((json && json.error) || ("Login failed: " + res.status));
    }
    return json;
  }

  async function saveBrief({ clientName, projectName, briefText }) {
    return bfFetch("/api/briefs/analyze", {
      method: "POST",
      body: { clientName, projectName, briefText },
      requireAuth: "jwt",
    });
  }

  async function listApiKeys() {
    return bfFetch("/api/api-keys", { method: "GET", requireAuth: "jwt" });
  }

  async function revokeApiKey(id) {
    return bfFetch("/api/api-keys/" + encodeURIComponent(id), { method: "DELETE", requireAuth: "jwt" });
  }

  window.BF = {
    DEFAULT_API_URL,
    STATUS_COLORS,
    statusConfig,
    scoreClass,
    scoreColor,
    escapeHtml,
    normalizeApiUrl,
    getConfig,
    setConfig,
    clearSession,
    analyze,
    login,
    saveBrief,
    listApiKeys,
    revokeApiKey,
  };
})();
