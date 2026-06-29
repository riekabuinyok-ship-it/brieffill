import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { LogoIcon } from "../components/Logo";
import Icon from "../components/Icon";
import PortalProgress from "../components/PortalProgress";
import PortalExercise from "../components/PortalExercise";

const API = import.meta.env.VITE_API_URL || "/_/backend/api";

export default function Portal() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [responses, setResponses] = useState({});
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState(null);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/portal/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 404 ? "Portal not found" : r.status === 410 ? "This portal is no longer active" : "Failed to load");
        return r.json();
      })
      .then((res) => {
        setData(res);
        const initial = {};
        for (const f of res.fields) {
          initial[f.name] = res.responses?.[f.name]?.response || "";
        }
        setResponses(initial);
        setFiles(res.files || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleResponseChange = useCallback((fieldName, value) => {
    setResponses((prev) => ({ ...prev, [fieldName]: value }));
  }, []);

  const saveProgress = async (isSubmit = false) => {
    setSaving(true);
    try {
      const respArr = Object.entries(responses).map(([fieldName, response]) => ({ fieldName, response }));
      const r = await fetch(`${API}/portal/${token}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses: respArr }),
      });
      if (!r.ok) throw new Error("Failed to save");
      if (isSubmit) {
        setSubmitted(true);
        setToast({ message: "All responses submitted!", type: "success" });
      } else {
        setToast({ message: "Progress saved!", type: "success" });
      }
    } catch {
      setToast({ message: "Failed to save progress", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingField(fieldName);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("fieldName", fieldName);
      const r = await fetch(`${API}/portal/${token}/files`, { method: "POST", body: fd });
      if (!r.ok) throw new Error("Upload failed");
      const result = await r.json();
      setFiles((prev) => [...prev, { ...result, fieldName, uploadedAt: new Date().toISOString() }]);
      setToast({ message: "File uploaded!", type: "success" });
    } catch {
      setToast({ message: "Failed to upload file", type: "error" });
    } finally {
      setUploadingField(null);
      e.target.value = "";
    }
  };

  const completed = Object.values(responses).filter((v) => v && v.trim().length > 0).length;
  const total = data?.fields?.length || 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-fixed border-t-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="max-w-md text-center px-margin-mobile">
          <Icon name="link_off" className="mx-auto text-5xl text-outline-variant mb-4" />
          <h1 className="font-headline-lg text-headline-lg mb-2">Portal Unavailable</h1>
          <p className="text-on-surface-variant mb-6">{error}</p>
          <Link to="/" className="text-primary font-semibold hover:underline">Back to BriefFill</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between px-margin-mobile h-14 bg-surface border-b border-outline-variant/50">
        <Link to="/" className="flex items-center gap-2">
          <LogoIcon size={24} />
          <span className="font-headline-md text-headline-md font-logo text-primary">BriefFill</span>
        </Link>
        <span className="text-xs text-on-surface-variant">Collaboration Portal</span>
      </header>

      <div className="mx-auto max-w-3xl px-margin-mobile py-6 md:py-10">
        {/* Brief header card */}
        <div className="mb-6 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">{data.projectName}</h1>
          <p className="text-sm text-on-surface-variant mb-4">Client: {data.clientName}</p>
          <PortalProgress completed={completed} total={total} />

          <p className="mt-4 text-xs text-on-surface-variant flex items-center gap-1">
            <Icon name="lock" className="text-[12px]" />
            This portal is secure. Only people with this link can access it.
          </p>
        </div>

        {/* Exercises */}
        <div className="space-y-stack-md mb-6">
          {data.fields.map((f, i) => (
            <PortalExercise
              key={f.id || f.name}
              num={i + 1}
              field={f}
              value={responses[f.name] || ""}
              onChange={handleResponseChange}
              files={files.filter((fl) => fl.fieldName === f.name)}
              onUpload={handleFileUpload}
              uploading={uploadingField === f.name}
            />
          ))}
        </div>

        {/* Submitted confirmation */}
        {submitted ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
            <Icon name="check_circle" filled className="text-[48px] text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">Thank you!</h2>
            <p className="text-green-700 mb-1">Your responses have been submitted successfully.</p>
            <p className="text-sm text-green-600">The project team will review your answers and follow up if needed.</p>
          </div>
        ) : (
          /* Action bar */
          <div className="sticky bottom-0 flex flex-col gap-3 rounded-xl border border-outline-variant bg-surface p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-on-surface-variant text-center sm:text-left">
              <Icon name="check_circle" className="text-[14px] text-primary align-text-bottom" /> {completed}/{total} completed
            </p>
            <div className="flex gap-3">
              <button onClick={() => saveProgress(false)} disabled={saving}
                className="flex-1 rounded-lg border border-primary px-5 py-2.5 text-sm font-bold text-primary hover:bg-primary/5 transition-colors disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Progress"}
              </button>
              <button onClick={() => saveProgress(true)} disabled={saving || completed < total}
                className="flex-1 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-on-primary hover:bg-surface-tint transition-colors disabled:opacity-60 shadow-md"
              >
                Submit All Responses
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-outline-variant/50 bg-surface py-4 text-center">
        <p className="text-xs text-on-surface-variant">
          Powered by <Link to="/" className="text-primary font-semibold hover:underline">BriefFill</Link>
          {" "}&mdash; Never start a project blind again.
        </p>
        <p className="mt-1 text-xs text-on-surface-variant">Need help? Contact us at support@brieffill.com</p>
      </footer>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 rounded-lg px-4 py-2 text-sm font-medium shadow-lg animate-fade-in ${toast.type === "error" ? "bg-error text-on-error" : "bg-primary text-on-primary"}`}>
          <div className="flex items-center gap-2">
            <Icon name={toast.type === "error" ? "error" : "check_circle"} className="text-[16px]" />
            {toast.message}
            <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100">
              <Icon name="close" className="text-[14px]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
