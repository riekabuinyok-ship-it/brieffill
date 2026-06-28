import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api, { isPlanError } from "../utils/api";
import Icon from "../components/Icon";
import { LogoIcon } from "../components/Logo";
import FileUpload from "../components/FileUpload";
import Toast from "../components/Toast";
import BriefAssistant from "../components/BriefAssistant";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";

const INDUSTRIES = ["SaaS", "E-commerce", "Fintech", "Healthcare", "Education", "Media", "Real Estate", "Travel", "Nonprofit", "Other"];

export default function NewBrief() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = location.state?.prefill || "";
  const [form, setForm] = useState({ clientName: "", projectName: "", briefText: prefill, industry: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [emailData, setEmailData] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showAssistant, setShowAssistant] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);

  const handleSubmit = async () => {
    if (!form.clientName || !form.projectName || !form.briefText) {
      setToast({ message: "Please fill in all required fields", type: "error" });
      return;
    }
    setLoading(true);
    setResult(null);
    setEmailData(null);
    try {
      const res = await api.post("/briefs/analyze", form);
      setResult(res.data);
    } catch (err) {
      if (isPlanError(err)) {
      } else if (!err.response) {
        setToast({ message: "Cannot reach the server. Make sure the backend is running on port 5000.", type: "error" });
      } else {
        setToast({ message: err.response?.data?.error || "Analysis failed", type: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  const generateEmail = async () => {
    if (!result?.id) return;
    setEmailLoading(true);
    try {
      const res = await api.post(`/briefs/${result.id}/email`);
      setEmailData(res.data);
    } catch {
      setToast({ message: "Failed to generate email", type: "error" });
    } finally {
      setEmailLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast({ message: "Copied to clipboard!", type: "success" });
    } catch {
      setToast({ message: "Failed to copy", type: "error" });
    }
  };

  const handleFileText = (text) => {
    setForm((f) => ({ ...f, briefText: text }));
    setToast({ message: "Text extracted from file!", type: "success" });
  };

  useKeyboardShortcuts(useMemo(() => ({
    "ctrl+Enter": () => { if (!result) handleSubmit(); },
    "ctrl+shift+e": () => { if (result) generateEmail(); },
  }), [result, form]));

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex-col items-center justify-center bg-white/90 backdrop-blur-sm flex">
        <div className="relative mb-8 h-32 w-32">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <div className="absolute inset-4 rounded-full border-4 border-gray-100 border-b-blue-400 animate-spin" style={{ animationDirection: "reverse", animationDuration: "2s" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <LogoIcon size={56} className="animate-pulse" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-blue-600 mb-2">Analyzing your brief...</h2>
        <div className="w-64 h-2 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 animate-pulse" />
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-gray-400 animate-pulse">AI processing</p>
      </div>
    );
  }

  // Results view
  if (result) {
    return (
      <div className="mx-auto max-w-6xl px-4 md:px-8 py-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <section className="md:col-span-7">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-[#1E293B] mb-1">{result.clientName || form.clientName}</h1>
              <p className="text-[#64748B]">{result.projectName || form.projectName}</p>
            </div>
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#1E293B]">Field Analysis</h3>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">AI READY</span>
              </div>
              <div className="mb-4 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl font-bold text-blue-600">{result.completenessScore}</div>
                  <p className="text-sm text-[#64748B] mt-1">Completeness Score</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {(result.fields || []).map((f) => {
                  const statusColors = { present: "bg-green-50 text-green-700 border-green-200", partial: "bg-amber-50 text-amber-700 border-amber-200", missing: "bg-red-50 text-red-700 border-red-200" };
                  return (
                    <div key={f.name} className={`rounded-lg border p-3 ${statusColors[f.status] || "bg-gray-50"}`}>
                      <p className="text-xs font-bold uppercase tracking-wider">{f.name}</p>
                      <p className="text-xs mt-0.5 opacity-75">{f.status}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {result.clarificationQuestions?.length > 0 && (
              <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/50 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Icon name="auto_awesome" filled className="text-blue-600" />
                  <h3 className="text-lg font-bold text-[#1E293B]">Clarification Questions</h3>
                </div>
                <ol className="space-y-3">
                  {result.clarificationQuestions.map((q, i) => (
                    <li key={i} className="rounded-lg bg-white border border-[#E2E8F0] p-4 shadow-sm">
                      <p className="font-medium text-[#1E293B]">Q{i + 1}: {q}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <p className="mt-4 text-xs italic text-[#64748B]">Tone: {result.suggestedTone}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={generateEmail} disabled={emailLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-60">
                {emailLoading ? "Generating..." : "Generate Email"}
              </button>
              <button onClick={() => navigate(`/brief/${result.id}`)}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#E2E8F0] text-[#1E293B] text-sm font-semibold rounded-lg hover:bg-gray-50 transition">
                View Details
              </button>
              <button onClick={() => { setResult(null); setEmailData(null); setForm({ clientName: "", projectName: "", briefText: "", industry: "" }); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-[#64748B] text-sm font-semibold rounded-lg hover:bg-gray-50 transition">
                Analyze Another
              </button>
            </div>

            {emailData && (
              <div className="mt-6 rounded-2xl border border-blue-200 bg-white p-6 shadow-lg border-l-4 border-l-blue-600">
                <h3 className="font-bold text-[#1E293B] mb-2">Email Draft</h3>
                <p className="text-sm text-[#64748B] mb-2"><strong>Subject:</strong> {emailData.subject}</p>
                <div className="text-sm text-[#1E293B] whitespace-pre-wrap mb-3">{emailData.body}</div>
                <button onClick={() => copyToClipboard(emailData.body)}
                  className="text-sm text-blue-600 font-semibold hover:underline">Copy to clipboard</button>
              </div>
            )}
          </section>
        </div>
        <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      </div>
    );
  }

  // Form view
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6">
      {/* Back link */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#1E293B] transition-colors mb-6">
        <Icon name="arrow_back" className="text-[16px]" /> Back
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-[#1E293B]">Analyze a New Brief</h1>
        <p className="text-sm text-[#64748B] mt-1">Paste your client brief below and let AI analyze it against 12 critical fields.</p>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">

          {/* Row: 3 fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#1E293B]">Client Name</label>
              <input type="text" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="e.g. Acme Corp" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#1E293B]">Project Name</label>
              <input type="text" value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="e.g. Q4 Brand Refresh" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#1E293B]">Industry</label>
              <select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                <option value="">Select industry (optional)</option>
                {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
              </select>
            </div>
          </div>

          {/* Brief Text */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#1E293B]">Brief Text</label>
            <textarea rows={8} value={form.briefText} onChange={(e) => setForm({ ...form, briefText: e.target.value })}
              className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-y min-h-[200px]"
              placeholder="Paste your client's brief here. Include as much detail as possible — our AI works best with context." required />
            <p className="text-xs text-[#64748B]">Paste your brief or upload a file. The more context, the better the analysis.</p>
          </div>

          {/* File Upload */}
          <div>
            <FileUpload onTextExtracted={handleFileText} onError={(m) => setToast({ message: m, type: "error" })} />
          </div>

          {/* Pro Tips (collapsible) */}
          <div className="rounded-xl bg-gray-50 border border-[#E2E8F0] overflow-hidden">
            <button type="button" onClick={() => setTipsOpen(!tipsOpen)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-[#1E293B] hover:bg-gray-100 transition">
              <span className="flex items-center gap-2"> Pro Tips</span>
              <Icon name={tipsOpen ? "expand_less" : "expand_more"} className="text-[18px] text-[#64748B]" />
            </button>
            {tipsOpen && (
              <div className="px-4 pb-4 space-y-2 text-sm text-[#64748B]">
                <div className="flex gap-2"><span className="font-semibold text-[#1E293B] shrink-0">Be Specific:</span> Include dates, budgets, and key stakeholders for more accurate synthesis.</div>
                <div className="flex gap-2"><span className="font-semibold text-[#1E293B] shrink-0">Data Points:</span> Our AI recognizes numerical targets and KPIs automatically.</div>
                <div className="flex gap-2"><span className="font-semibold text-[#1E293B] shrink-0">Drop Files:</span> Upload .docx, .pdf, or .txt files — we extract the text for you.</div>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="flex justify-center pt-2">
            <button type="submit"
              className="w-full md:w-auto px-10 py-3.5 bg-blue-600 text-white text-base font-semibold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Analyze Brief
            </button>
          </div>
        </form>
      </div>

      {/* Social proof badge */}
      <div className="mt-6 text-center">
        <p className="text-xs text-[#64748B]">Join 1,000+ agencies and freelancers using BriefFill</p>
      </div>

      {/* Write with AI button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button type="button" onClick={() => setShowAssistant(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E2E8F0] text-sm font-semibold text-[#1E293B] rounded-xl shadow-lg hover:shadow-xl hover:bg-gray-50 transition">
          <Icon name="auto_awesome" className="text-blue-600 text-[18px]" /> Write with AI
        </button>
      </div>

      <BriefAssistant
        open={showAssistant}
        onClose={() => setShowAssistant(false)}
        onSaved={(saved) => {
          setShowAssistant(false);
          navigate("/brief/" + saved.id);
        }}
      />
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}
