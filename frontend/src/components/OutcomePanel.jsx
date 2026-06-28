import { useState } from "react";
import api, { isPlanError } from "../utils/api";
import Toast from "./Toast";

const STATUS_OPTIONS = [
  { value: "success", label: "Project succeeded", icon: "check_circle", color: "text-primary" },
  { value: "in_progress", label: "Still in progress", icon: "schedule", color: "text-yellow-600" },
  { value: "failure", label: "Project didn't land", icon: "cancel", color: "text-error" },
];

export default function OutcomePanel({ briefId, outcome, onSaved }) {
  const [editing, setEditing] = useState(!outcome);
  const [rating, setRating] = useState(outcome?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [status, setStatus] = useState(outcome?.status || "in_progress");
  const [notes, setNotes] = useState(outcome?.notes || "");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const save = async () => {
    if (rating < 1) {
      setToast({ message: "Please pick a star rating", type: "error" });
      return;
    }
    setSaving(true);
    try {
      const res = await api.post(`/briefs/${briefId}/outcome`, { rating, status, notes: notes.trim() || null });
      setToast({ message: outcome ? "Outcome updated" : "Outcome recorded", type: "success" });
      setEditing(false);
      onSaved?.(res.data.outcome);
    } catch (err) {
      if (isPlanError(err)) {
        // UpgradePrompt modal handles the messaging; suppress the toast.
      } else {
        setToast({ message: err.response?.data?.error || "Failed to save", type: "error" });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary-container/5 to-secondary-container/5 p-stack-md">
      <div className="flex flex-wrap items-center justify-between gap-stack-md">
        <div className="flex items-center gap-stack-sm">
          <span className="material-symbols-outlined text-primary">rate_review</span>
          <h3 className="font-headline-md text-headline-md">
            {outcome ? "Outcome recorded" : "Did this brief lead to a successful project?"}
          </h3>
        </div>
        {outcome && !editing && (
          <button onClick={() => setEditing(true)} className="rounded-lg border border-outline-variant bg-surface px-3 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container">
            <span className="material-symbols-outlined mr-1 text-[14px] align-middle">edit</span>
            Update
          </button>
        )}
      </div>

      {!editing && outcome && (
        <div className="mt-stack-md flex flex-wrap items-center gap-gutter">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className={`material-symbols-outlined text-[24px] ${n <= outcome.rating ? "text-yellow-500" : "text-outline-variant"}`} style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>
                star
              </span>
            ))}
            <span className="ml-2 text-sm font-semibold text-on-surface">{outcome.rating} / 5</span>
          </div>
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
            outcome.status === "success" ? "bg-primary/10 text-primary" : outcome.status === "failure" ? "bg-error-container/30 text-error" : "bg-yellow-100 text-yellow-700"
          }`}>
            <span className="material-symbols-outlined text-[14px]">{STATUS_OPTIONS.find((s) => s.value === outcome.status)?.icon}</span>
            {STATUS_OPTIONS.find((s) => s.value === outcome.status)?.label}
          </span>
          {outcome.notes && (
            <p className="w-full text-sm text-on-surface-variant italic">"{outcome.notes}"</p>
          )}
        </div>
      )}

      {editing && (
        <div className="mt-stack-md space-y-stack-md">
          <div>
            <label className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-stack-sm">
              Rating
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1"
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                >
                  <span
                    className={`material-symbols-outlined text-[32px] transition-colors ${n <= (hoverRating || rating) ? "text-yellow-500" : "text-outline-variant"}`}
                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
                  >
                    star
                  </span>
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm font-semibold text-on-surface">{rating} / 5</span>
              )}
            </div>
          </div>

          <div>
            <label className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-stack-sm">
              Outcome
            </label>
            <div className="grid grid-cols-1 gap-stack-sm sm:grid-cols-3">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`flex items-center gap-2 rounded-lg border p-stack-sm text-left text-sm transition ${
                    status === opt.value
                      ? "border-primary bg-primary-container/10 text-on-surface"
                      : "border-outline-variant bg-surface text-on-surface-variant hover:border-primary/50"
                  }`}
                >
                  <span className={`material-symbols-outlined text-[20px] ${opt.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-stack-sm">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="What worked? What could have been better?"
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex gap-stack-sm">
            <button
              onClick={save}
              disabled={saving || rating < 1}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-surface-tint disabled:opacity-50"
            >
              {saving && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
              {outcome ? "Update outcome" : "Save outcome"}
            </button>
            {outcome && (
              <button onClick={() => { setEditing(false); setRating(outcome.rating); setStatus(outcome.status); setNotes(outcome.notes || ""); }} className="rounded-lg border border-outline-variant bg-surface px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container">
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}
