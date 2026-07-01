import { useState, useRef } from "react";
import Icon from "./Icon";

export default function WinningResponseModal({ response, onClose }) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleCopy = () => {
    const fullText = `Subject: ${response.subject}\n\n${response.body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const downloadPDF = async () => {
    setMenuOpen(false);
    const { default: jsPDF } = await import("jspdf");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageW = 190;
    let y = 20;

    const body = (txt, size = 11, bold = false) => {
      pdf.setFontSize(size);
      pdf.setFont("helvetica", bold ? "bold" : "normal");
      const lines = pdf.splitTextToSize(txt, pageW);
      if (y + lines.length * 5 > 280) { pdf.addPage(); y = 20; }
      pdf.text(lines, 10, y);
      y += lines.length * 5 + 3;
    };

    body("Proposal", 18, true);
    y += 2;
    body(response.subject, 13, true);
    y += 2;
    const paragraphs = (response.body || "").split("\n").filter(Boolean);
    for (const p of paragraphs) body(p.trim());
    y += 4;
    body(`Word count: ${response.wordCount || response.body?.split(/\s+/).filter(Boolean).length || 0}`, 9);
    body(`Read time: ${response.readTime || 1} min`, 9);
    pdf.save(`winning-response-${Date.now()}.pdf`);
  };

  const downloadWord = () => {
    setMenuOpen(false);
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${response.subject}</title>
<style>
  body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; max-width: 700px; margin: 40px auto; padding: 0 20px; color: #1a1a1a; line-height: 1.6; }
  h1 { font-size: 22px; color: #004ac6; margin-bottom: 4px; }
  .subject { font-size: 16px; font-weight: 600; color: #333; margin-bottom: 20px; }
  p { margin-bottom: 12px; }
  .meta { font-size: 11px; color: #888; margin-top: 24px; border-top: 1px solid #ddd; padding-top: 12px; }
</style></head><body>
<h1>Proposal</h1>
<div class="subject">${response.subject}</div>
${(response.body || "").split("\n").filter(Boolean).map(p => `<p>${p.trim()}</p>`).join("")}
<div class="meta">Word count: ${response.wordCount || response.body?.split(/\s+/).filter(Boolean).length || 0} | Read time: ${response.readTime || 1} min</div>
</body></html>`;
    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `winning-response-${Date.now()}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = response.wordCount || response.body?.split(/\s+/).filter(Boolean).length || 0;
  const readTime = response.readTime || Math.max(1, Math.ceil(wordCount / 250));

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-on-background/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-surface shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-yellow-500">
              <Icon name="emoji_events" filled className="text-white text-[20px]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface">Winning Response</h2>
              <p className="text-xs text-on-surface-variant">Proposal designed to win you the project</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container">
            <Icon name="close" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Success Badge */}
          <div className="rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-3 flex items-center gap-2">
            <Icon name="check_circle" filled className="text-green-600 text-[16px]" />
            <p className="text-sm text-green-700">This proposal is optimized to win projects</p>
          </div>

          {/* Subject */}
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3">
            <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Subject</p>
            <p className="text-sm font-semibold text-on-surface mt-1">{response.subject}</p>
          </div>

          {/* Proposal Body */}
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
            <div className="whitespace-pre-wrap text-sm text-on-surface leading-relaxed">
              {response.body}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-surface-container-lowest p-2 text-center border border-outline-variant/30">
              <p className="text-lg font-bold text-on-surface">{wordCount}</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Words</p>
            </div>
            <div className="rounded-lg bg-surface-container-lowest p-2 text-center border border-outline-variant/30">
              <p className="text-lg font-bold text-on-surface">{readTime}</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Min read</p>
            </div>
            <div className="rounded-lg bg-surface-container-lowest p-2 text-center border border-outline-variant/30">
              <p className="text-lg font-bold text-amber-500">&#9733;&#9733;&#9733;&#9733;&#9733;</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Win rating</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary hover:bg-primary/90 transition-colors">
              {copied ? <Icon name="check_circle" filled className="text-[16px]" /> : <Icon name="content_copy" className="text-[16px]" />}
              {copied ? "Copied!" : "Copy to Clipboard"}
            </button>
            <div className="relative" ref={menuRef}>
              <button onClick={() => setMenuOpen(!menuOpen)}
                className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors">
                <Icon name="download" className="text-[16px]" />
                Download
                <Icon name="arrow_drop_down" className="text-[16px]" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl border border-outline-variant shadow-lg py-1 z-20">
                    <button onClick={downloadPDF}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-on-surface hover:bg-surface-container transition-colors">
                      <Icon name="picture_as_pdf" className="text-[16px]" />
                      Download as PDF
                    </button>
                    <button onClick={downloadWord}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-on-surface hover:bg-surface-container transition-colors">
                      <Icon name="description" className="text-[16px]" />
                      Download as Word
                    </button>
                  </div>
                </>
              )}
            </div>
            <a href={`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(response.subject)}&body=${encodeURIComponent(response.body)}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 transition-colors">
              <Icon name="mail" className="text-[16px]" />
              Send in Gmail
            </a>
          </div>

          {/* Tip */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs text-amber-700">
              <span className="font-bold">Pro Tip:</span> Personalize the "hook" and "proof" sections for better results.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
