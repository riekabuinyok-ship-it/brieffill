import { useEffect, useRef, useState } from "react";
import Button from "./Button";
import Icon from "./Icon";
import Toast from "./Toast";

const FIELD_NAMES = [
  "Project Overview",
  "Target Audience",
  "Core Problem",
  "Solution/Offer",
  "Key Benefits",
  "Tone of Voice",
  "Brand Guidelines",
  "Deliverables",
  "Timeline",
  "Budget",
  "Competitors",
  "Call to Action",
];

const PRESET_FEEDBACKS = [
  "Make it shorter",
  "Add measurable success metrics",
  "Add a competitive analysis",
  "Tighten the tone of voice",
  "Add specific dates to the timeline",
];

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

function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function statusPillClass(status) {
  if (status === "present") return "inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary";
  if (status === "partial") return "inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold uppercase text-yellow-700";
  return "inline-flex items-center gap-1 rounded-full bg-error-container/30 px-2 py-0.5 text-[10px] font-bold uppercase text-error";
}

export default function BriefDraftEditor({
  draft,
  clientName,
  projectName,
  onClientNameChange,
  onProjectNameChange,
  onBriefTextChange,
  onRefine,
  onSave,
  onExport,
  refining = false,
  saving = false,
}) {
  const [feedback, setFeedback] = useState("");
  const [toast, setToast] = useState(null);
  const lastBriefRef = useRef(draft.briefText);

  useEffect(() => {
    lastBriefRef.current = draft.briefText;
  }, [draft.briefText]);

  const wordCount = countWords(draft.briefText);
  const charCount = (draft.briefText || "").length;
  const score = draft.completenessScore || 0;
  const presentCount = (draft.fields || []).filter((f) => f.status === "present").length;

  const handleRefine = async () => {
    if (!feedback.trim()) {
      setToast({ message: "Tell the AI what to change", type: "info" });
      return;
    }
    try {
      await onRefine(feedback.trim());
      setFeedback("");
      setToast({ message: "Brief refined", type: "success" });
    } catch (err) {
      setToast({ message: err.message || "Refinement failed", type: "error" });
    }
  };

  const handlePreset = (preset) => {
    setFeedback(preset);
  };

  const handleSave = async () => {
    if (!clientName.trim() || !projectName.trim()) {
      setToast({ message: "Add a client name and project name before saving", type: "error" });
      return;
    }
    try {
      await onSave();
    } catch (err) {
      setToast({ message: err.message || "Save failed", type: "error" });
    }
  };

  return (
    <div className="space-y-stack-md">
      <div className="rounded-2xl border border-secondary/20 bg-gradient-to-br from-secondary-container/5 to-primary-container/5 p-stack-md">
        <div className="flex flex-wrap items-center justify-between gap-stack-md">
          <div className="flex items-center gap-stack-sm">
            <span className="material-symbols-outlined text-secondary">auto_awesome</span>
            <h3 className="font-headline-md text-headline-md">Draft brief</h3>
          </div>
          <div className="flex items-center gap-stack-md">
            <div className="text-right">
              <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Score</p>
              <p className="font-headline-md text-headline-md" style={{ color: scoreColor(score) }}>
                {score}<span className="text-base font-normal text-on-surface-variant">%</span>
              </p>
            </div>
            <div className="text-right">
              <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Length</p>
              <p className="font-headline-md text-headline-md text-on-surface">{wordCount} <span className="text-sm font-normal text-on-surface-variant">words</span></p>
            </div>
          </div>
        </div>
        {draft.summary && (
          <p className="mt-stack-sm text-sm text-on-surface-variant">{escapeHtml(draft.summary)}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-stack-md md:grid-cols-2">
        <div>
          <label className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-1">Client</label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => onClientNameChange(e.target.value)}
            placeholder="Acme Inc."
            className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-1">Project</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            placeholder="Q1 Brand Refresh"
            className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Brief text</label>
          <span className="text-xs text-on-surface-variant">{charCount} chars</span>
        </div>
        <textarea
          value={draft.briefText || ""}
          onChange={(e) => onBriefTextChange(e.target.value)}
          rows={16}
          className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary"
        />
        <p className="mt-1 text-xs text-on-surface-variant">
          Edit anything in the text — fields, deliverables, budget. The score updates when you click Save &amp; Re-analyze.
        </p>
      </div>

      {draft.fields && draft.fields.length > 0 && (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md">
          <p className="mb-stack-sm font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Field status</p>
          <div className="grid grid-cols-1 gap-stack-sm sm:grid-cols-2">
            {draft.fields.map((f) => (
              <div key={f.name} className="flex items-center justify-between text-sm">
                <span className="text-on-surface">{escapeHtml(f.name)}</span>
                <span className={statusPillClass(f.status)}>{f.status}</span>
              </div>
            ))}
          </div>
          <p className="mt-stack-sm text-xs text-on-surface-variant">
            {presentCount} of {draft.fields.length} fields covered
          </p>
        </div>
      )}

      {draft.suggestedTone && (
        <div className="flex items-center gap-stack-sm text-sm">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Tone</span>
          <span className="rounded-full bg-surface-container px-3 py-1 text-on-surface">{escapeHtml(draft.suggestedTone)}</span>
        </div>
      )}

      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md">
        <p className="mb-stack-sm font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Refine with feedback</p>
        <div className="mb-stack-sm flex flex-wrap gap-stack-sm">
          {PRESET_FEEDBACKS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handlePreset(p)}
              className="rounded-full border border-outline-variant bg-surface px-3 py-1 text-xs text-on-surface hover:border-primary"
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-stack-sm sm:flex-row">
          <input
            type="text"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleRefine(); }}
            placeholder='e.g. "add 3 KPIs to Success Metrics"'
            className="flex-1 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
          <Button onClick={handleRefine} loading={refining} icon="auto_awesome">
            {refining ? "Refining\u2026" : "Regenerate"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-stack-sm">
        <Button onClick={handleSave} loading={saving} icon="save" disabled={!clientName.trim() || !projectName.trim()}>
          Save to BriefFill
        </Button>
        {onExport && (
          <Button onClick={onExport} variant="outline" icon="ios_share">Export</Button>
        )}
      </div>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}
