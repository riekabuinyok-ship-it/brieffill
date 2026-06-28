import { useState } from "react";
import api, { isPlanError } from "../utils/api";
import ComparisonView from "./ComparisonView";
import ExportMenu from "./ExportMenu";
import Toast from "./Toast";

export default function BriefBuilder({ brief, onClose, onSaved }) {
  const [phase, setPhase] = useState("loading"); // loading | review | editing | saving
  const [result, setResult] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const generate = async () => {
    setPhase("loading");
    setError(null);
    try {
      const res = await api.post(`/briefs/${brief.id}/build`);
      setResult(res.data);
      setEditedText(res.data.improvedBrief);
      setPhase("review");
    } catch (err) {
      if (isPlanError(err)) {
        // UpgradePrompt modal handles the messaging; close the builder.
        onClose?.();
      } else {
        setError(err.response?.data?.error || "Failed to generate improved brief. Please try again.");
        setPhase("review"); // still allow review of whatever came back
      }
    }
  };

  const save = async () => {
    setPhase("saving");
    try {
      await api.put(`/briefs/${brief.id}/build`, { improvedBrief: editedText });
      setToast({ message: "Improved brief saved to your project.", type: "success" });
      setTimeout(() => {
        onSaved?.();
        onClose();
      }, 800);
    } catch (err) {
      if (isPlanError(err)) {
        // UpgradePrompt modal handles the messaging; close the builder.
        onClose?.();
      } else {
        setError(err.response?.data?.error || "Failed to save. Please try again.");
        setPhase("editing");
      }
    }
  };

  // Auto-generate on mount
  if (phase === "loading" && !result && !error) {
    setTimeout(generate, 0);
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-on-background/60 p-margin-mobile backdrop-blur-sm">
      <div className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl bg-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant px-stack-lg py-stack-md">
          <div>
            <h2 className="font-headline-md text-headline-md flex items-center gap-2">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              Brief Builder
            </h2>
            <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mt-1">
              AI-powered improvement for {brief.clientName} — {brief.projectName}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-stack-lg">
          {phase === "loading" && (
            <div className="flex flex-col items-center justify-center py-stack-lg gap-stack-md min-h-[400px]">
              <div className="relative h-24 w-24">
                <div className="absolute inset-0 rounded-full border-4 border-primary-fixed border-t-primary animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                </div>
              </div>
              <div className="text-center">
                <p className="font-headline-md text-headline-md text-primary">Building your improved brief...</p>
                <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mt-stack-sm animate-pulse">
                  GENERATING INDUSTRY-SPECIFIC CONTENT
                </p>
              </div>
              {result?.fallback && (
                <p className="text-xs text-on-surface-variant max-w-md text-center">
                  AI service unreachable — using offline template. You can still edit and save.
                </p>
              )}
            </div>
          )}

          {phase === "review" && result && (
            <div className="space-y-stack-lg">
              {error && (
                <div className="rounded-lg bg-error-container/20 p-stack-sm text-sm text-error border border-error/30">
                  {error}
                </div>
              )}
              {result.fallback && (
                <div className="rounded-lg bg-yellow-100 p-stack-sm text-sm text-yellow-800 border border-yellow-300">
                  AI service was unreachable. Showing offline template — please review and edit before saving.
                </div>
              )}
              <ComparisonView
                original={result.originalBrief}
                improved={result.improvedBrief}
                fieldFixes={result.fieldFixes}
              />
            </div>
          )}

          {phase === "editing" && (
            <div className="space-y-stack-md">
              <label className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Edit the improved brief
              </label>
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={20}
                className="w-full rounded-lg border border-outline-variant bg-surface p-stack-md font-body-md text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          )}

          {phase === "saving" && (
            <div className="flex flex-col items-center justify-center py-stack-lg gap-stack-md min-h-[400px]">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-fixed border-t-primary" />
              <p className="font-headline-md text-headline-md text-primary">Saving improved brief...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {phase !== "loading" && phase !== "saving" && (
          <div className="flex flex-wrap items-center justify-between gap-stack-md border-t border-outline-variant bg-surface-container-low px-stack-lg py-stack-md">
            <button
              onClick={onClose}
              className="rounded-lg border border-outline-variant bg-surface px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container"
            >
              Cancel
            </button>
            <div className="flex flex-wrap gap-stack-sm">
              {phase === "review" && (
                <>
                  <ExportMenu brief={brief} improvedText={editedText} fileNameBase={`${brief.clientName}-${brief.projectName}-improved`} />
                  <button onClick={() => setPhase("editing")} className="inline-flex items-center gap-2 rounded-lg border border-primary bg-primary-container/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary-container/20">
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                    Edit
                  </button>
                  <button onClick={save} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary hover:bg-surface-tint shadow-md">
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    Save Improved Brief
                  </button>
                </>
              )}
              {phase === "editing" && (
                <>
                  <button onClick={() => setPhase("review")} className="rounded-lg border border-outline-variant bg-surface px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container">
                    Back to Review
                  </button>
                  <ExportMenu brief={brief} improvedText={editedText} fileNameBase={`${brief.clientName}-${brief.projectName}-improved`} />
                  <button onClick={save} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary hover:bg-surface-tint shadow-md">
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    Save
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}
