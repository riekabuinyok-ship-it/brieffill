// BriefFill content script.
// Runs on https://mail.google.com/* and all <all_urls>.
// Captures text selections on any page, surfaces a floating "Analyze" pill,
// and (on Gmail) extracts sender + subject for client/project auto-fill.
//
// All Gmail DOM queries are wrapped in try/catch and have multiple fallbacks
// because Gmail ships new A/B test classes weekly and the DOM is undocumented.

(function () {
  "use strict";
  if (window.__brieffillContentLoaded) return;
  window.__brieffillContentLoaded = true;

  const PILL_ID = "brieffill-pill";
  const TOAST_ID = "brieffill-context-toast";
  const MIN_SELECTION = 20;
  const MAX_SELECTION = 20000;
  const PILL_HIDE_DELAY = 6000;

  let lastAnalyzedHash = "";
  let pillHideTimer = null;
  let contextToastTimer = null;
  let gmailObserver = null;

  const isGmail = location.hostname === "mail.google.com";

  // ---------- Gmail context ----------

  function readGmailContext() {
    if (!isGmail) return null;
    try {
      const ctx = { fromGmail: true };

      // Sender — try expanded view first, then collapsed, then aria-label.
      const senderEl =
        document.querySelector(".gD[email]") ||
        document.querySelector("span.gD[email]") ||
        document.querySelector("[data-hovercard-id][email]") ||
        document.querySelector(".g2 .gD");
      if (senderEl) {
        const email = senderEl.getAttribute("email") || "";
        const name = senderEl.getAttribute("name") || senderEl.textContent.trim();
        ctx.senderEmail = email;
        ctx.senderName = (name || email || "").trim();
      }

      // Subject — multiple fallbacks because Gmail's reading-pane markup rotates.
      const subjectEl =
        document.querySelector("h2[data-thread-perm-id]") ||
        document.querySelector(".hP") ||
        document.querySelector("[data-legacy-thread-id] h2") ||
        document.querySelector("h2.ik");
      if (subjectEl) ctx.subject = subjectEl.textContent.trim();

      // Compose window — if the user is composing, fall back to the To/Subject fields.
      if (!ctx.senderName) {
        const composeTo = document.querySelector('input[name="to"]');
        if (composeTo && composeTo.value) ctx.senderName = composeTo.value.split(",")[0].trim();
      }
      if (!ctx.subject) {
        const composeSubject = document.querySelector('input[name="subjectbox"]');
        if (composeSubject && composeSubject.value) ctx.subject = composeSubject.value.trim();
      }

      if (!ctx.senderName && !ctx.subject) return null;
      return ctx;
    } catch {
      return null;
    }
  }

  function startGmailObserver() {
    if (!isGmail || gmailObserver) return;
    try {
      gmailObserver = new MutationObserver(() => {
        // No-op: side panel re-reads on demand. We just need the observer alive
        // so Chrome doesn't idle-kill this content script on long Gmail sessions.
      });
      gmailObserver.observe(document.body, { childList: true, subtree: true });
    } catch {
      // Ignore — Gmail occasionally throws on observe (e.g. cross-origin iframes).
    }
  }

  // ---------- Floating pill ----------

  function ensurePill() {
    let pill = document.getElementById(PILL_ID);
    if (pill) return pill;
    pill = document.createElement("button");
    pill.id = PILL_ID;
    pill.className = "brieffill-pill";
    pill.type = "button";
    pill.setAttribute("aria-label", "Analyze with BriefFill");
    pill.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2L2 7l10 5 10-5-10-5zm0 7.5L4.5 6 12 3.5 19.5 6 12 9.5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>' +
      '<span>Analyze with BriefFill</span>';
    pill.addEventListener("mousedown", (e) => {
      // Prevent the click from clearing the selection.
      e.preventDefault();
    });
    pill.addEventListener("click", handlePillClick);
    document.documentElement.appendChild(pill);
    return pill;
  }

  function showPill(rect) {
    const pill = ensurePill();
    // Position above the selection's top edge, centered horizontally.
    const top = window.scrollY + rect.top - 38;
    const left = window.scrollX + rect.left + rect.width / 2 - 80; // 160px wide → center
    pill.style.top = Math.max(8, top) + "px";
    pill.style.left = Math.max(8, left) + "px";
    pill.classList.remove("brieffill-pill--error");
    pill.style.display = "inline-flex";
    clearTimeout(pillHideTimer);
    pillHideTimer = setTimeout(hidePill, PILL_HIDE_DELAY);
  }

  function hidePill() {
    const pill = document.getElementById(PILL_ID);
    if (pill) pill.style.display = "none";
  }

  function showError(msg) {
    const pill = ensurePill();
    pill.classList.add("brieffill-pill--error");
    pill.querySelector("span").textContent = msg;
    pill.style.display = "inline-flex";
    clearTimeout(pillHideTimer);
    pillHideTimer = setTimeout(() => {
      pill.classList.remove("brieffill-pill--error");
      pill.querySelector("span").textContent = "Analyze with BriefFill";
      hidePill();
    }, 3000);
  }

  function showContextToast(html) {
    let toast = document.getElementById(TOAST_ID);
    if (!toast) {
      toast = document.createElement("div");
      toast.id = TOAST_ID;
      toast.className = "brieffill-context";
      document.documentElement.appendChild(toast);
    }
    toast.innerHTML = html;
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    clearTimeout(contextToastTimer);
    contextToastTimer = setTimeout(() => toast.classList.remove("is-visible"), 4000);
  }

  // ---------- Click handler ----------

  function handlePillClick() {
    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : "";
    if (text.length < MIN_SELECTION) {
      showError("Select at least " + MIN_SELECTION + " characters");
      return;
    }
    if (text.length > MAX_SELECTION) {
      showError("Selection too long (" + text.length + " / " + MAX_SELECTION + ")");
      return;
    }

    const hash = text.slice(0, 80) + "|" + text.length;
    if (hash === lastAnalyzedHash) {
      showContextToast("Already analyzing that selection — opening the side panel.");
      chrome.runtime.sendMessage({ type: "BF_OPEN_OPTIONS" });
      return;
    }
    lastAnalyzedHash = hash;

    const context = readGmailContext() || {};
    if (context.senderName || context.subject) {
      const parts = [];
      if (context.senderName) parts.push("Client: <strong>" + escapeHtml(context.senderName) + "</strong>");
      if (context.subject) parts.push("Project: <strong>" + escapeHtml(context.subject) + "</strong>");
      showContextToast("Auto-filled " + parts.join(" &middot; "));
    }

    chrome.runtime.sendMessage(
      {
        type: "BF_ANALYZE_SELECTION",
        briefText: text,
        context,
        source: isGmail ? "gmail" : "selection",
      },
      (response) => {
        if (chrome.runtime.lastError) {
          // The side panel listens on storage.session — see background.js.
        }
        void response;
      }
    );

    hidePill();
    selection.removeAllRanges();
  }

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  // ---------- Selection detection ----------

  function onSelectionChange() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      hidePill();
      return;
    }
    const text = sel.toString().trim();
    if (text.length < MIN_SELECTION) {
      hidePill();
      return;
    }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      hidePill();
      return;
    }
    showPill(rect);
  }

  document.addEventListener("mouseup", onSelectionChange);
  document.addEventListener("keyup", onSelectionChange);
  document.addEventListener("selectionchange", () => {
    // selectionchange fires very frequently; throttle with rAF.
    if (window.__bfSelRaf) return;
    window.__bfSelRaf = requestAnimationFrame(() => {
      window.__bfSelRaf = null;
      onSelectionChange();
    });
  });

  // Hide the pill when the user clicks somewhere unrelated.
  document.addEventListener("mousedown", (e) => {
    if (e.target && e.target.closest && e.target.closest("#" + PILL_ID)) return;
    setTimeout(hidePill, 100);
  });

  // ---------- Boot ----------

  startGmailObserver();
})();
