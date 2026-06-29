import { useEffect, useRef, useState } from "react";
import api, { isPlanError } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import { jsPDF } from "jspdf";

export default function ExportMenu({ brief, improvedText, fileNameBase }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [integrations, setIntegrations] = useState({});
  const [working, setWorking] = useState(null); // 'pdf' | 'gdocs' | 'notion' | 'clickup' | 'airtable' | 'copy' | null
  const [error, setError] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    api.get("/integrations/status").then((res) => setIntegrations(res.data.integrations || {})).catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const content = (improvedText || brief?.originalText || "").trim();
  const safeName = (fileNameBase || `${brief?.clientName}-${brief?.projectName}` || "brieffill")
    .replace(/[^a-z0-9-]/gi, "-").toLowerCase();

  const exportPDF = async () => {
    setWorking("pdf");
    setError(null);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - margin * 2;
      let y = 20;

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(37, 99, 235);
      const title = `Brief: ${brief?.clientName || ""} — ${brief?.projectName || ""}`;
      doc.text(title, margin, y);
      y += 10;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 120);
      doc.text(`Exported: ${new Date().toLocaleString()}`, margin, y);
      y += 10;

      doc.setFontSize(11);
      doc.setTextColor(17, 28, 45);
      const lines = doc.splitTextToSize(content, maxWidth);
      for (const line of lines) {
        if (y > 280) { doc.addPage(); y = 20; }
        doc.text(line, margin, y);
        y += 6;
      }
      doc.save(`brieffill-${safeName}.pdf`);
      setOpen(false);
    } catch (e) {
      setError("Failed to generate PDF");
    } finally {
      setWorking(null);
    }
  };

  const openGoogleDocs = async () => {
    setWorking("gdocs");
    setError(null);
    try {
      const res = await api.get(`/briefs/${brief.id}/export/google-docs`, { params: { improvedText: content } });
      if (res.data.method === "api") {
        const win = window.open(res.data.url, "_blank");
        if (!win) setError("Popup blocked — please allow popups for this site.");
        setOpen(false);
        return;
      }
      // URL trick fallback: copy content to clipboard, then open blank doc
      try {
        await navigator.clipboard.writeText(content);
      } catch {}
      const win = window.open(res.data.url, "_blank");
      if (!win) setError("Popup blocked — please allow popups for this site.");
      setError("Content copied to clipboard — paste into the new Google Doc.");
      setOpen(false);
    } catch (e) {
      if (isPlanError(e)) {
        setOpen(false);
      } else {
        setError(e.response?.data?.message || "Failed to build Google Docs URL");
      }
    } finally {
      setWorking(null);
    }
  };

  const saveToNotion = async () => {
    setWorking("notion");
    setError(null);
    try {
      const res = await api.post(`/briefs/${brief.id}/export/notion`, { improvedText: content });
      const win = window.open(res.data.pageUrl, "_blank");
      if (!win) setError("Popup blocked — Notion page was created but could not auto-open.");
      setOpen(false);
    } catch (e) {
      if (isPlanError(e)) {
        // UpgradePrompt modal handles the messaging; close the menu.
        setOpen(false);
      } else if (e.response?.status === 503) {
        setError(e.response.data.message);
      } else {
        setError(e.response?.data?.message || "Failed to save to Notion");
      }
    } finally {
      setWorking(null);
    }
  };

  const sendToClickUp = async () => {
    setWorking("clickup");
    setError(null);
    try {
      await api.post(`/briefs/${brief.id}/export/clickup`, { improvedText: content });
      setOpen(false);
    } catch (e) {
      if (isPlanError(e)) {
        // UpgradePrompt modal handles the messaging; close the menu.
        setOpen(false);
      } else {
        setError(e.response?.data?.error || "Failed to send to ClickUp");
      }
    } finally {
      setWorking(null);
    }
  };

  const sendToAirtable = async () => {
    setWorking("airtable");
    setError(null);
    try {
      await api.post(`/briefs/${brief.id}/export/airtable`, { improvedText: content });
      setOpen(false);
    } catch (e) {
      if (isPlanError(e)) {
        // UpgradePrompt modal handles the messaging; close the menu.
        setOpen(false);
      } else {
        setError(e.response?.data?.error || "Failed to send to Airtable");
      }
    } finally {
      setWorking(null);
    }
  };

  const copyToClipboard = async () => {
    setWorking("copy");
    setError(null);
    try {
      await navigator.clipboard.writeText(content);
      setOpen(false);
    } catch {
      setError("Failed to copy to clipboard");
    } finally {
      setWorking(null);
    }
  };

  const notionConfigured = integrations.notion?.configured;
  const clickupConfigured = integrations.clickup?.configured;
  const airtableConfigured = integrations.airtable?.configured;
  const contentIsEmpty = !content;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={contentIsEmpty}
        title="Export this brief"
        className="inline-flex items-center gap-2 rounded-lg border border-primary bg-primary-container/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary-container/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="material-symbols-outlined text-[18px]">ios_share</span>
        Export
        <span className="material-symbols-outlined text-[16px]">arrow_drop_down</span>
      </button>

      {open && (
        <div className="absolute right-0 bottom-full mb-2 z-10 w-72 rounded-xl border border-outline-variant bg-surface shadow-2xl overflow-hidden">
          <div className="p-2 space-y-1">
            <MenuItem
              icon="picture_as_pdf"
              label="Download as PDF"
              description="Standard PDF document"
              working={working === "pdf"}
              onClick={exportPDF}
            />
            <MenuItem
              icon="description"
              label="Open in Google Docs"
              description={user?.billing?.plan === "free" || user?.billing?.plan === "pro"
                ? "Requires Team or Agency plan"
                : "Creates a new Google Doc with this content"}
              working={working === "gdocs"}
              disabled={user?.billing?.plan === "free" || user?.billing?.plan === "pro"}
              onClick={openGoogleDocs}
              img="/Google-Docs.png"
            />
            <MenuItem
              icon="database"
              label="Save to Notion"
              description={user?.billing?.plan === "free" || user?.billing?.plan === "pro"
                ? "Requires Team or Agency plan"
                : notionConfigured ? "Adds a page to your Notion database" : "Not configured — set NOTION_API_KEY in backend/.env"}
              working={working === "notion"}
              disabled={user?.billing?.plan === "free" || user?.billing?.plan === "pro" || !notionConfigured}
              onClick={saveToNotion}
              img="/Notion.png"
            />
            <MenuItem
              icon="checklist"
              label="Send to ClickUp"
              description={clickupConfigured ? "Creates a task in your ClickUp list" : "Not configured — add it in Integrations"}
              working={working === "clickup"}
              disabled={!clickupConfigured}
              onClick={sendToClickUp}
              img="/ClickUp.png"
            />
            <MenuItem
              icon="table_chart"
              label="Send to Airtable"
              description={airtableConfigured ? "Adds a row to your Airtable table" : "Not configured — add it in Integrations"}
              working={working === "airtable"}
              disabled={!airtableConfigured}
              onClick={sendToAirtable}
              img="/Airtable.png"
            />
            <div className="my-1 border-t border-outline-variant" />
            <MenuItem
              icon="content_copy"
              label="Copy to clipboard"
              description="Plain text"
              working={working === "copy"}
              onClick={copyToClipboard}
            />
          </div>
          {error && (
            <div className="border-t border-outline-variant bg-error-container/20 px-3 py-2 text-xs text-error">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, description, working, disabled, onClick, img }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || working}
      className="w-full flex items-start gap-3 rounded-lg p-3 text-left transition hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
    >
      {working ? (
        <span className="material-symbols-outlined text-[20px] text-primary mt-0.5 shrink-0">progress_activity</span>
      ) : img ? (
        <img src={img} alt="" className="w-5 h-5 mt-0.5 shrink-0 object-contain" />
      ) : (
        <span className="material-symbols-outlined text-[20px] text-primary mt-0.5 shrink-0">{icon}</span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-on-surface">{label}</p>
        <p className="text-xs text-on-surface-variant truncate">{description}</p>
      </div>
    </button>
  );
}
