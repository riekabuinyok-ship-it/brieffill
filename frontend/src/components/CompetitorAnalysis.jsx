import { useState, useEffect } from "react";
import api, { isPlanError } from "../utils/api";
import Icon from "./Icon";
import FileUpload from "./FileUpload";
import ScoreGauge from "./ScoreGauge";
import Toast from "./Toast";

const SLOTS = ["A", "B", "C"];
const MAX_CHARS = 20000;

const emptySlot = () => ({ name: "", text: "" });

function fieldStatusClasses(status) {
  if (status === "present") return "bg-primary/15 text-primary";
  if (status === "partial") return "bg-yellow-100 text-yellow-700";
  return "bg-error-container/40 text-error";
}

export default function CompetitorAnalysis({ briefId }) {
  const [analysis, setAnalysis] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [inputs, setInputs] = useState([emptySlot(), emptySlot(), emptySlot()]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    api.get(`/briefs/${briefId}/competitor-analysis`)
      .then((res) => {
        setAnalysis(res.data.analysis);
        if (res.data.analysis) setOpen(true);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [briefId]);

  const updateSlot = (i, patch) => {
    setInputs((arr) => arr.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };

  const handleFileText = (i, text) => {
    updateSlot(i, { text: text.slice(0, MAX_CHARS) });
    setToast({ message: `Competitor ${SLOTS[i]} file loaded`, type: "success" });
  };

  const filledCount = inputs.filter((s) => s.text.trim().length >= 50).length;

  const submit = async () => {
    const valid = inputs.filter((s) => s.text.trim().length >= 50);
    if (valid.length < 1) {
      setToast({ message: "Add at least one competitor brief (50+ characters)", type: "error" });
      return;
    }
    setLoading(true);
    try {
      const res = await api.post(`/briefs/${briefId}/competitor-analysis`, {
        competitors: valid.map((c) => ({ name: c.name.trim(), text: c.text.trim() })),
      });
      setAnalysis(res.data.analysis);
      setOpen(true);
      setToast({ message: "Competitor analysis complete", type: "success" });
    } catch (err) {
      if (isPlanError(err)) {
        // UpgradePrompt modal handles the messaging; suppress the toast.
      } else {
        setToast({ message: err.response?.data?.error || "Analysis failed", type: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setAnalysis(null);
    setOpen(false);
    setInputs([emptySlot(), emptySlot(), emptySlot()]);
  };

  if (!loaded) return null;

  return (
    <div className="rounded-2xl border border-secondary/20 bg-gradient-to-br from-secondary-container/5 to-primary-container/5 p-stack-md">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full flex-wrap items-center justify-between gap-stack-sm text-left"
      >
        <div className="flex items-center gap-stack-sm">
          <span className="material-symbols-outlined text-secondary">radar</span>
          <div>
            <h3 className="font-headline-md text-headline-md">
              {analysis ? "Competitor analysis" : "Compare with competitors"}
            </h3>
            <p className="text-sm text-on-surface-variant">
              {analysis
                ? `${analysis.competitors.length} competitor${analysis.competitors.length !== 1 ? "s" : ""} analyzed`
                : "Find what your competitors are covering — and what they're missing"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-stack-sm">
          {analysis && (
            <button
              onClick={(e) => { e.stopPropagation(); reset(); }}
              className="rounded-lg border border-outline-variant bg-surface px-3 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container"
            >
              <span className="material-symbols-outlined mr-1 text-[14px] align-middle">refresh</span>
              Re-analyze
            </button>
          )}
          <span className={`material-symbols-outlined text-on-surface-variant transition-transform ${open ? "rotate-180" : ""}`}>
            expand_more
          </span>
        </div>
      </button>

      {open && !analysis && (
        <div className="mt-stack-lg space-y-stack-md">
          <p className="text-sm text-on-surface-variant">
            Paste 1-3 competitor briefs below, or upload .txt/.docx/.pdf files. Each must be at least 50 characters.
          </p>
          {SLOTS.map((letter, i) => (
            <div key={letter} className="rounded-xl border border-outline-variant bg-surface p-stack-md">
              <div className="mb-stack-sm flex items-center gap-stack-sm">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary/15 text-sm font-bold text-secondary">
                  {letter}
                </span>
                <input
                  type="text"
                  value={inputs[i].name}
                  onChange={(e) => updateSlot(i, { name: e.target.value.slice(0, 80) })}
                  placeholder={`Competitor ${letter} name (optional)`}
                  className="flex-1 rounded-lg border border-outline-variant bg-surface px-3 py-1.5 text-sm focus:outline-none focus:border-secondary"
                />
                <span className="text-xs text-on-surface-variant">
                  {inputs[i].text.length} / {MAX_CHARS}
                </span>
              </div>
              <textarea
                value={inputs[i].text}
                onChange={(e) => updateSlot(i, { text: e.target.value.slice(0, MAX_CHARS) })}
                rows={4}
                placeholder={`Paste Competitor ${letter}'s brief here...`}
                className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:border-secondary"
              />
              <div className="mt-stack-sm">
                <FileUpload
                  onTextExtracted={(text) => handleFileText(i, text)}
                  onError={(msg) => setToast({ message: msg, type: "error" })}
                />
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between gap-stack-sm">
            <p className="text-sm text-on-surface-variant">
              {filledCount === 0
                ? "No competitor briefs ready"
                : `${filledCount} competitor brief${filledCount !== 1 ? "s" : ""} ready`}
            </p>
            <button
              onClick={submit}
              disabled={loading || filledCount === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-on-primary hover:bg-secondary/90 disabled:opacity-50"
            >
              {loading && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
              <Icon name="radar" className="text-[18px]" />
              {loading ? "Analyzing..." : "Analyze competitors"}
            </button>
          </div>
        </div>
      )}

      {open && analysis && (
        <div className="mt-stack-lg space-y-stack-md">
          <div className="grid grid-cols-1 gap-stack-sm sm:grid-cols-3">
            {analysis.competitors.map((c, i) => (
              <div key={i} className="rounded-xl border border-outline-variant bg-surface p-stack-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-on-surface-variant">Competitor {SLOTS[i]}</p>
                    <p className="font-semibold text-on-surface">{c.name || `Competitor ${SLOTS[i]}`}</p>
                  </div>
                  <ScoreGauge score={c.score} size={72} />
                </div>
                <div className="mt-stack-sm flex flex-wrap gap-1">
                  {c.fields.slice(0, 6).map((f) => (
                    <span
                      key={f.name}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${fieldStatusClasses(f.status)}`}
                      title={`${f.name}: ${f.status}`}
                    >
                      {f.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-stack-md md:grid-cols-2">
            <div className="rounded-xl border border-primary/20 bg-primary-container/5 p-stack-md">
              <h4 className="mb-stack-sm flex items-center gap-stack-sm font-semibold text-on-surface">
                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                What they're covering
              </h4>
              {analysis.commonStrengths.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No common strengths identified yet.</p>
              ) : (
                <ul className="space-y-stack-sm text-sm text-on-surface">
                  {analysis.commonStrengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-error/20 bg-error-container/5 p-stack-md">
              <h4 className="mb-stack-sm flex items-center gap-stack-sm font-semibold text-on-surface">
                <span className="material-symbols-outlined text-error text-[20px]">remove_circle</span>
                What they're missing
              </h4>
              {analysis.commonGaps.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No common gaps identified yet.</p>
              ) : (
                <ul className="space-y-stack-sm text-sm text-on-surface">
                  {analysis.commonGaps.map((g, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-error" />
                      {g}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-secondary/30 bg-gradient-to-br from-secondary-container/10 to-primary-container/10 p-stack-md">
            <h4 className="mb-stack-sm flex items-center gap-stack-sm font-semibold text-on-surface">
              <span className="material-symbols-outlined text-secondary text-[20px]">target</span>
              Your opportunity
            </h4>
            <p className="text-sm leading-relaxed text-on-surface">{analysis.opportunity}</p>
          </div>
        </div>
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}
