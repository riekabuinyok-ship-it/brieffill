import { jsPDF } from "jspdf";

export function exportAnalysisAsPDF(brief, analysis) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  function addText(text, fontSize = 11, isBold = false, color = [0, 0, 0]) {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, maxWidth);
    if (y + lines.length * fontSize * 0.4 > 280) {
      doc.addPage();
      y = 20;
    }
    doc.text(lines, margin, y);
    y += lines.length * fontSize * 0.4 + 2;
  }

  addText("BriefFill Analysis Report", 20, true, [37, 99, 235]);
  y += 4;
  addText(`${brief.clientName} — ${brief.projectName}`, 14, true);
  addText(`Generated: ${new Date().toLocaleString()}`, 9, false, [120, 120, 120]);
  y += 6;

  const score = analysis.completenessScore || 0;
  const scoreColor = score > 80 ? [22, 163, 74] : score >= 60 ? [202, 138, 4] : [220, 38, 38];
  addText(`Completeness Score: ${score}%`, 16, true, scoreColor);
  y += 4;

  addText("Field Analysis", 13, true);
  (analysis.fields || []).forEach((f) => {
    const statusLabel = f.status === "present" ? "✓" : f.status === "partial" ? "~" : "✗";
    addText(`${statusLabel} ${f.name} — ${f.status.toUpperCase()}`, 10, true);
    if (f.question && f.status !== "present") {
      addText(`  ${f.question}`, 9, false, [80, 80, 80]);
    }
  });

  y += 4;
  addText("Clarification Questions", 13, true);
  (analysis.clarificationQuestions || []).forEach((q, i) => {
    addText(`${i + 1}. ${q}`, 10, false);
  });

  y += 4;
  addText(`Suggested tone: ${analysis.suggestedTone || "professional and collaborative"}`, 10, true, [80, 80, 80]);

  const safeName = `${brief.clientName}-${brief.projectName}`.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  doc.save(`brieffill-${safeName}-${Date.now()}.pdf`);
}
