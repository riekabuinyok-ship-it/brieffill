import { useState } from "react";
import api, { isPlanError } from "../utils/api";
import Button from "./Button";
import Icon from "./Icon";
import BriefDraftEditor from "./BriefDraftEditor";
import ExportMenu from "./ExportMenu";
import Toast from "./Toast";

const PROMPT_PLACEHOLDERS = [
  "Write a brief for a robotics pitch deck targeting Series A investors, focused on warehouse automation",
  "Create a brief for a fintech landing page aimed at small business owners",
  "Brief for a luxury fashion brand's Q4 social campaign targeting women 25-40",
  "Generate a brief for a SaaS dashboard redesign for healthcare providers",
];

export default function BriefAssistant({ open, onClose, onSaved }) {
  const [step, setStep] = useState("prompt"); // "prompt" | "draft"
  const [prompt, setPrompt] = useState("");
  const [clientName, setClientName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [refining, setRefining] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(null);
  const [savedBrief, setSavedBrief] = useState(null);
  const [toast, setToast] = useState(null);

  const reset = () => {
    setStep("prompt");
    setPrompt("");
    setClientName("");
    setProjectName("");
    setDraft(null);
    setSavedBrief(null);
  };

  const close = () => {
    if (generating || refining || saving) return;
    reset();
    onClose();
  };

  const generate = async () => {
    if (!prompt.trim() || prompt.trim().length < 5) {
      setToast({ message: "Describe what you need a brief for (at least 5 characters)", type: "error" });
      return;
    }
    setGenerating(true);
    try {
      const res = await api.post("/briefs/generate", {
        prompt: prompt.trim(),
        clientName: clientName.trim(),
        projectName: projectName.trim(),
      });
      setDraft({
        briefText: res.data.briefText,
        fields: res.data.fields || [],
        completenessScore: res.data.completenessScore,
        suggestedTone: res.data.suggestedTone,
        summary: res.data.summary,
      });
      setStep("draft");
      setToast({ message: "Brief generated (" + res.data.completenessScore + "%)", type: "success" });
    } catch (err) {
      if (isPlanError(err)) {
        // UpgradePrompt modal handles the messaging; suppress the toast.
      } else {
        setToast({ message: err.response?.data?.error || err.message || "Generation failed", type: "error" });
      }
    } finally {
      setGenerating(false);
    }
  };

  const refine = async (feedback) => {
    setRefining(true);
    try {
      const res = await api.post("/briefs/regenerate", {
        currentBrief: draft.briefText,
        feedback,
      });
      setDraft({
        briefText: res.data.briefText,
        fields: res.data.fields || [],
        completenessScore: res.data.completenessScore,
        suggestedTone: res.data.suggestedTone,
        summary: res.data.summary,
      });
    } catch (err) {
      throw err;
    } finally {
      setRefining(false);
    }
  };

  const save = async () => {
    if (!clientName.trim() || !projectName.trim()) {
      setToast({ message: "Add a client name and project name", type: "error" });
      return;
    }
    setSaving(true);
    try {
      const res = await api.post("/briefs/analyze", {
        clientName: clientName.trim(),
        projectName: projectName.trim(),
        briefText: draft.briefText,
      });
      setSavedBrief(res.data);
      setToast({ message: "Saved to BriefFill (id " + res.data.id + ")", type: "success" });
      onSaved?.(res.data);
    } catch (err) {
      if (isPlanError(err)) {
        // UpgradePrompt modal handles the messaging; suppress the toast.
        // Re-throw so the caller (BriefDraftEditor) can still roll back its UI state.
        throw err;
      }
      setToast({ message: err.response?.data?.error || err.message || "Save failed", type: "error" });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-stack-md"
      onClick={close}
    >
      <div
        className="relative flex h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-outline-variant bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-stack-md border-b border-outline-variant p-stack-md">
          <div className="flex items-center gap-stack-sm">
            <span className="material-symbols-outlined text-secondary">auto_awesome</span>
            <h2 className="font-headline-md text-headline-md">Brief Assistant</h2>
            {step === "draft" && (
              <button
                type="button"
                onClick={() => setStep("prompt")}
                className="ml-2 rounded-full bg-surface-container px-3 py-1 text-xs font-medium text-on-surface-variant hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined mr-1 text-[14px] align-middle">arrow_back</span>
                New prompt
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={close}
            disabled={generating || refining || saving}
            className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-stack-md">
          {step === "prompt" && (
            <div className="mx-auto max-w-2xl space-y-stack-md">
              <div>
                <h3 className="font-headline-md text-headline-md">What do you need a brief for?</h3>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Describe the project in 1-2 sentences. The AI will write a complete brief that hits all 12 BriefFill fields, which you can then edit and refine.
                </p>
              </div>

              <div>
                <label className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-1">
                  Intent
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  placeholder={PROMPT_PLACEHOLDERS[0]}
                  className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
                <div className="mt-1 flex flex-wrap gap-stack-sm">
                  {PROMPT_PLACEHOLDERS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPrompt(p)}
                      className="rounded-full border border-outline-variant bg-surface px-3 py-1 text-xs text-on-surface hover:border-primary"
                    >
                      <span className="material-symbols-outlined mr-1 text-[14px] align-middle">lightbulb</span>
                      {p.length > 50 ? p.slice(0, 48) + "\u2026" : p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-stack-md md:grid-cols-2">
                <div>
                  <label className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-1">
                    Client (optional)
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Acme Inc."
                    className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-1">
                    Project (optional)
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Q1 Brand Refresh"
                    className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary-container/5 p-stack-md">
                <p className="text-sm text-on-surface">
                  <span className="material-symbols-outlined mr-1 align-middle text-primary">tips_and_updates</span>
                  <strong>Tip:</strong> the more specific your intent, the better the output. Mention audience, goal, and any constraints (budget range, deadline, channel).
                </p>
              </div>

              <div className="flex justify-end gap-stack-sm">
                <Button variant="ghost" onClick={close} disabled={generating}>Cancel</Button>
                <Button onClick={generate} loading={generating} icon="auto_awesome">
                  {generating ? "Generating\u2026" : "Generate brief"}
                </Button>
              </div>
            </div>
          )}

          {step === "draft" && draft && (
            <BriefDraftEditor
              draft={draft}
              clientName={clientName}
              projectName={projectName}
              onClientNameChange={setClientName}
              onProjectNameChange={setProjectName}
              onBriefTextChange={(t) => setDraft((d) => ({ ...d, briefText: t }))}
              onRefine={refine}
              onSave={save}
              onExport={savedBrief ? undefined : undefined}
              refining={refining}
              saving={saving}
            />
          )}

          {step === "draft" && savedBrief && (
            <div className="mt-stack-md rounded-xl border border-primary/30 bg-primary-container/10 p-stack-md">
              <p className="flex items-center gap-stack-sm font-semibold text-on-surface">
                <span className="material-symbols-outlined text-primary">check_circle</span>
                Saved to your BriefFill account
              </p>
              <p className="mt-1 text-sm text-on-surface-variant">
                <a
                  href={"/brief/" + savedBrief.id}
                  className="font-medium text-primary hover:underline"
                >
                  View the brief &rarr;
                </a>{" "}
                or export it below.
              </p>
            </div>
          )}

          {step === "draft" && savedBrief && (
            <div className="mt-stack-md">
              <ExportMenu
                brief={{ id: savedBrief.id, clientName, projectName }}
                improvedText={draft.briefText}
                fileNameBase={(clientName || "Brief") + "-" + (projectName || "Draft")}
              />
            </div>
          )}
        </div>
      </div>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}
