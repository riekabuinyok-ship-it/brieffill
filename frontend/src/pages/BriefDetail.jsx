import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import Icon from "../components/Icon";
import Button from "../components/Button";
import LockedFeature from "../components/LockedFeature";
import ScoreGauge from "../components/ScoreGauge";
import FieldStatus from "../components/FieldStatus";
import EmailDraft from "../components/EmailDraft";
import Toast from "../components/Toast";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { exportAnalysisAsPDF } from "../utils/pdfExport";
import BriefBuilder from "../components/BriefBuilder";
import OutcomePanel from "../components/OutcomePanel";
import CompetitorAnalysis from "../components/CompetitorAnalysis";
import PortalShare from "../components/PortalShare";

export default function BriefDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [brief, setBrief] = useState(null);
  const [emailData, setEmailData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailLoading, setEmailLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPortalModal, setShowPortalModal] = useState(false);
  const [portalData, setPortalData] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const [showResponses, setShowResponses] = useState(false);
  const [responses, setResponses] = useState(null);
  const [responsesLoading, setResponsesLoading] = useState(false);
  const responsesRef = useRef(null);

  useEffect(() => {
    api.get(`/briefs/${id}/outcome`).then((res) => setOutcome(res.data.outcome)).catch(() => {});
    api.get(`/briefs/${id}/portal-status`).then((res) => setPortalData(res.data.portal)).catch(() => setToast({ message: "Failed to load portal status", type: "error" }));
  }, [id]);

  useEffect(() => {
    api.get(`/briefs/${id}`).then((res) => setBrief(res.data)).catch(() => setToast({ message: "Failed to load brief", type: "error" }))
      .finally(() => setLoading(false));
  }, [id]);

  const generateEmail = async () => {
    setEmailLoading(true);
    try {
      const res = await api.post(`/briefs/${id}/email`);
      setEmailData(res.data);
      setToast({ message: "Email draft ready!", type: "success" });
    } catch {
      setToast({ message: "Failed to generate email", type: "error" });
    } finally {
      setEmailLoading(false);
    }
  };

  const exportPDF = () => {
    if (!brief) return;
    try {
      exportAnalysisAsPDF({ clientName: brief.clientName, projectName: brief.projectName }, analysis);
      setToast({ message: "PDF downloaded!", type: "success" });
    } catch {
      setToast({ message: "Failed to generate PDF", type: "error" });
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

  const viewResponses = async () => {
    if (!portalData?.token) return;
    setShowResponses(true);
    setResponsesLoading(true);
    try {
      const res = await api.get(`/portal/${portalData.token}/responses`);
      setResponses(res.data);
    } catch {
      setToast({ message: "Failed to load responses", type: "error" });
    } finally {
      setResponsesLoading(false);
    }
  };

  const exportResponsesPDF = async () => {
    if (!responses) return;
    const { default: jsPDF } = await import("jspdf");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageW = 190;
    let y = 20;

    const title = (txt, size = 16, bold = true) => {
      pdf.setFontSize(size);
      pdf.setFont("helvetica", bold ? "bold" : "normal");
      pdf.text(txt, pageW / 2, y, { align: "center" });
      y += 8;
    };
    const body = (txt, size = 10) => {
      pdf.setFontSize(size);
      pdf.setFont("helvetica", "normal");
      const lines = pdf.splitTextToSize(txt, pageW);
      if (y + lines.length * 5 > 280) { pdf.addPage(); y = 20; }
      pdf.text(lines, 10, y);
      y += lines.length * 5 + 2;
    };
    const checkPage = () => { if (y > 280) { pdf.addPage(); y = 20; } };

    title("BriefFill - Client Responses");
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.text(responses.projectName || "", pageW / 2, y, { align: "center" }); y += 6;
    pdf.text(`Client: ${responses.clientName || ""}`, pageW / 2, y, { align: "center" }); y += 10;

    for (const f of responses.fields) {
      checkPage();
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text(f.name, 10, y); y += 5;
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "italic");
      const qLines = pdf.splitTextToSize(f.question || "", pageW);
      pdf.text(qLines, 10, y); y += qLines.length * 4 + 2;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      const rLines = pdf.splitTextToSize(f.response || "(no response)", pageW);
      pdf.text(rLines, 10, y); y += rLines.length * 5 + 2;
      if (f.files?.length > 0) {
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(8);
        pdf.text(`Files: ${f.files.map((fl) => fl.fileName).join(", ")}`, 10, y);
        y += 4;
      }
      y += 3;
    }

    checkPage();
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "italic");
    pdf.text(`Exported on ${new Date().toLocaleDateString()}`, pageW / 2, 285, { align: "center" });
    pdf.save(`brief-responses-${responses.projectName?.replace(/\s+/g, "-") || "export"}.pdf`);
  };

  useKeyboardShortcuts(useMemo(() => ({
    "ctrl+shift+e": generateEmail,
    "ctrl+shift+p": exportPDF,
  }), [brief]));

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center pt-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-fixed border-t-primary" /></div>;
  }

  if (!brief) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 pt-32 text-center">
        <h2 className="font-headline-md text-headline-md text-on-surface">Brief not found</h2>
        <Link to="/dashboard" className="mt-2 inline-block text-sm text-primary">Back to Dashboard</Link>
      </div>
    );
  }

  const analysis = brief.analyzedText || {};
  const missingFields = (analysis.fields || []).filter((f) => f.status !== "present");
  const isComplete = missingFields.length === 0;

  return (
    <div className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop pt-20 md:pt-24 pb-32">
      {/* Header */}
      <section className="mb-stack-lg flex flex-col gap-stack-md md:flex-row md:items-end md:justify-between">
        <div>
          <nav className="mb-2 flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
            <Link to="/dashboard" className="hover:text-primary">Analysis</Link>
            <Icon name="chevron_right" className="text-[12px]" />
            <span className="font-bold text-primary">{brief.projectName}</span>
          </nav>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg mb-2">Detailed Brief Analysis</h1>
          <p className="max-w-2xl text-on-surface-variant">We've identified gaps in this submission. Review the missing data and generate a professional clarification email.</p>
        </div>
      </section>

      <section className="mb-stack-lg">
        <OutcomePanel briefId={id} outcome={outcome} onSaved={setOutcome} />
      </section>

      {user?.billing?.plan === "agency" ? (
        <section className="mb-stack-lg">
          <CompetitorAnalysis briefId={id} />
        </section>
      ) : (
        <section className="mb-stack-lg">
          <LockedFeature feature="Competitor Analysis" plan="agency">
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md">
              <div className="flex items-center gap-stack-sm">
                <Icon name="radar" className="text-2xl text-secondary" />
                <div>
                  <h3 className="font-headline-md text-headline-md">Compare with competitors</h3>
                  <p className="text-sm text-on-surface-variant">Find what your competitors are covering — and what they're missing</p>
                </div>
              </div>
            </div>
          </LockedFeature>
        </section>
      )}

      {/* Bento Grid */}
      <div className="grid grid-cols-1 gap-gutter md:grid-cols-12">
        {/* Left: Score + Missing */}
        <div className="flex flex-col gap-gutter md:col-span-5">
          <div className="relative overflow-hidden rounded-xl border border-outline-variant bg-surface p-stack-lg text-center shadow-sm">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary-container" />
            <h3 className="font-headline-md text-headline-md mb-6">Brief Health</h3>
            <div className="mb-6 flex justify-center">
              <ScoreGauge score={analysis.completenessScore} size={192} />
            </div>
            <p className="font-body-md italic text-on-surface-variant">"A solid foundation, but missing commercial specifics."</p>
          </div>

          {missingFields.length > 0 && (
            <div className="status-stripe rounded-xl border border-outline-variant bg-surface shadow-sm overflow-hidden border-l-error">
              <div className="flex items-center justify-between border-b border-outline-variant/30 bg-error-container/10 p-stack-md">
                <div className="flex items-center gap-2">
                  <Icon name="warning" className="text-error" />
                  <h3 className="font-headline-md text-headline-md text-on-surface">Missing Fields</h3>
                </div>
                <span className="rounded-full bg-error px-2 py-0.5 font-label-sm text-label-sm text-on-error">{missingFields.length} Critical</span>
              </div>
              <ul className="divide-y divide-outline-variant/20">
                {missingFields.map((f) => (
                  <li key={f.name} className="flex items-center justify-between p-stack-md transition-colors hover:bg-surface-container-low group">
                    <div>
                      <p className="font-semibold text-on-surface">{f.name}</p>
                      <p className="text-sm text-on-surface-variant">{f.question || "Missing information"}</p>
                    </div>
                    <Icon name="error_outline" className="text-outline-variant group-hover:text-error transition-colors" />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!isComplete && analysis.completenessScore < 60 && (
            <div className="status-stripe rounded-xl border border-primary/20 bg-gradient-to-br from-primary-container/10 to-secondary-container/10 p-stack-md border-l-primary">
              <div className="flex items-start gap-stack-md">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-headline-md text-headline-md">Fix This Brief</h3>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    AI will rewrite this brief, fill in the {missingFields.length} missing/partial field{missingFields.length !== 1 ? "s" : ""} with industry-specific detail, and preserve your original voice. You can edit the result before saving.
                  </p>
                  {user?.billing?.plan === "free" ? (
                    <LockedFeature feature="Brief Builder" plan="pro">
                      <button className="mt-stack-md inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-bold text-on-primary shadow-md">
                        <span className="material-symbols-outlined text-[18px]">build</span>
                        Generate Improved Brief
                      </button>
                    </LockedFeature>
                  ) : (
                    <button
                      onClick={() => setShowBuilder(true)}
                      className="mt-stack-md inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-bold text-on-primary shadow-md hover:bg-surface-tint active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">build</span>
                      Generate Improved Brief
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {isComplete && (
            <div className="status-stripe rounded-xl border border-primary/20 bg-primary-container/10 p-stack-md text-center border-l-primary">
              <Icon name="check_circle" filled className="mx-auto text-4xl text-primary" />
              <p className="mt-2 font-semibold text-primary">All fields are addressed!</p>
            </div>
          )}

          {/* Collaboration Portal Status */}
          {portalData && (
            <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary-container/5 to-secondary-container/5 p-stack-md shadow-sm">
              <div className="flex items-start gap-stack-md">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary">
                  <Icon name="link" filled />
                </div>
                <div className="flex-1">
                  <h3 className="font-headline-md text-headline-md">Collaboration Portal</h3>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-on-surface-variant">Client progress</span>
                      <span className="font-semibold text-primary">{portalData.progress?.completed || 0}/{portalData.progress?.total || 12}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${portalData.progress?.total > 0 ? Math.round((portalData.progress.completed / portalData.progress.total) * 100) : 0}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-on-surface-variant">
                      <span>{portalData.files?.length || 0} files uploaded</span>
                      {portalData.lastActivity && <span>Last activity: {new Date(portalData.lastActivity).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => setShowPortalModal(true)}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                      Manage Portal <Icon name="arrow_forward" className="text-[14px]" />
                    </button>
                    {portalData.progress?.completed > 0 && (
                      <button onClick={viewResponses}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                        View Responses <Icon name="visibility" className="text-[14px]" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Questions + Email */}
        <div className="flex flex-col gap-gutter md:col-span-7">
          {(analysis.clarificationQuestions?.length > 0) && (
            <div className="relative rounded-xl border border-primary/10 bg-surface-container-high p-stack-lg">
              <div className="mb-stack-md flex items-center gap-2">
                <Icon name="auto_awesome" filled className="text-primary" />
                <h3 className="font-headline-md text-headline-md">AI Clarification Questions</h3>
              </div>
              <ol className="space-y-stack-md">
                {analysis.clarificationQuestions.map((q, i) => (
                  <li key={i} className="rounded-lg border border-outline-variant/20 bg-surface p-stack-md shadow-sm">
                    <p className="font-medium text-on-surface mb-1">Q{i + 1}: {q}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {emailData && (
            <div className="status-stripe rounded-xl border border-outline-variant/20 bg-surface p-stack-lg shadow-lg border-l-primary">
              {user?.billing?.plan === "free" ? (
                <LockedFeature feature="Copy to clipboard" plan="pro">
                  <EmailDraft subject={emailData.subject} body={emailData.body} onCopy={copyToClipboard} />
                </LockedFeature>
              ) : (
                <EmailDraft subject={emailData.subject} body={emailData.body} onCopy={copyToClipboard} />
              )}
            </div>
          )}

          <div>
            <h3 className="font-headline-md text-headline-md mb-stack-md">All Fields</h3>
            <div className="grid gap-stack-md sm:grid-cols-2">
              {(analysis.fields || []).map((f) => <FieldStatus key={f.name} {...f} />)}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 w-full z-50 border-t border-outline-variant/50 bg-surface shadow-lg md:bottom-0">
        <div className="mx-auto flex max-w-container-max flex-col items-stretch justify-between gap-stack-md px-margin-mobile py-stack-md md:flex-row md:items-center">
          <div className="hidden md:flex flex-col">
            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant tracking-tighter">Status</span>
            <span className="font-bold text-primary">{emailData ? "Ready to send" : "Email not yet generated"}</span>
          </div>
          <div className="flex flex-1 gap-stack-md md:flex-none">
            {user?.billing?.plan === "free" ? (
              <LockedFeature feature="Export to PDF" plan="pro">
                <Button variant="outline" icon="picture_as_pdf" className="flex-1 md:flex-none">Export PDF</Button>
              </LockedFeature>
            ) : (
              <Button variant="outline" onClick={exportPDF} icon="picture_as_pdf" className="flex-1 md:flex-none">Export PDF</Button>
            )}
            <Button variant="outline" onClick={() => setShowShareModal(true)} icon="group" className="flex-1 md:flex-none">Share with team</Button>
            {user?.billing?.plan !== "team" && user?.billing?.plan !== "agency" ? (
              <LockedFeature feature="Collaboration Portal" plan="team">
                <Button variant="outline" icon="link" className="flex-1 md:flex-none">Create Portal</Button>
              </LockedFeature>
            ) : (
              <Button variant="outline" onClick={() => setShowPortalModal(true)} icon="link" className="flex-1 md:flex-none">{portalData ? "Manage Portal" : "Create Portal"}</Button>
            )}
            <Button onClick={generateEmail} loading={emailLoading} icon="mail" className="flex-1 md:flex-none">Generate Email</Button>
          </div>
        </div>
      </div>

      {/* Responses Modal */}
      {showResponses && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-on-background/60 p-4 backdrop-blur-sm" onClick={() => setShowResponses(false)}>
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-surface shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-outline-variant px-6 py-4 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-on-surface">Client Responses</h2>
                <p className="text-sm text-on-surface-variant">{responses?.projectName} — {responses?.clientName}</p>
              </div>
              <div className="flex items-center gap-2">
                {responses && (
                  <button onClick={exportResponsesPDF}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-on-primary hover:bg-primary/90 transition-colors">
                    <Icon name="picture_as_pdf" className="text-[16px]" /> Export PDF
                  </button>
                )}
                <button onClick={() => setShowResponses(false)} className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container">
                  <Icon name="close" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4" ref={responsesRef}>
              {responsesLoading ? (
                <div className="flex justify-center py-12">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : responses ? (
                responses.fields.map((f) => (
                  <div key={f.name} className="rounded-xl border border-outline-variant p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-sm font-bold text-on-surface">{f.name}</h3>
                      {f.files?.length > 0 && (
                        <span className="shrink-0 text-xs text-on-surface-variant">{f.files.length} file{f.files.length > 1 ? "s" : ""}</span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant italic mb-2">{f.question}</p>
                    <p className="text-sm text-on-surface whitespace-pre-wrap">{f.response || <span className="text-outline italic">No response</span>}</p>
                    {f.files?.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-outline-variant flex flex-wrap gap-2">
                        {f.files.map((fl) => (
                          <a key={fl.id} href={`/_/backend/api/portal/${portalData.token}/files/${fl.id}`} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                            <Icon name="attach_file" className="text-[12px]" /> {fl.fileName}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-on-surface-variant py-8">No responses available.</p>
              )}
            </div>
            <div className="flex items-center justify-end border-t border-outline-variant px-6 py-3 shrink-0">
              <button onClick={() => setShowResponses(false)}
                className="rounded-lg border border-outline-variant bg-surface px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      {showBuilder && (
        <BriefBuilder
          brief={brief}
          onClose={() => setShowBuilder(false)}
          onSaved={() => {
            // Refetch brief so the new original_text is shown
            api.get(`/briefs/${id}`).then((res) => setBrief(res.data));
          }}
        />
      )}

      {showShareModal && (
        <ShareWithTeamModal
          briefId={id}
          onClose={() => setShowShareModal(false)}
          onShared={() => {
            setToast({ message: "Brief shared with team", type: "success" });
            api.get(`/briefs/${id}`).then((res) => setBrief(res.data));
          }}
        />
      )}

      {showPortalModal && (
        <PortalShare
          briefId={id}
          onClose={() => setShowPortalModal(false)}
          onCreated={(portal) => {
            setPortalData(portal);
            if (portal) setToast({ message: "Collaboration portal created!", type: "success" });
          }}
        />
      )}
    </div>
  );
}

function ShareWithTeamModal({ briefId, onClose, onShared }) {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/teams")
      .then((res) => {
        const t = res.data.teams || [];
        setTeams(t);
        const editable = t.filter((x) => x.role === "admin" || x.role === "editor");
        if (editable.length > 0) setSelectedTeam(String(editable[0].id));
      })
      .catch((err) => setError(err.response?.data?.error || "Failed to load teams"))
      .finally(() => setLoading(false));
  }, []);

  const share = async () => {
    if (!selectedTeam) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/teams/${selectedTeam}/share/${briefId}`);
      onShared?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to share brief");
    } finally {
      setSubmitting(false);
    }
  };

  const eligible = teams.filter((t) => t.role === "admin" || t.role === "editor");
  const ineligible = teams.filter((t) => t.role === "viewer");

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-on-background/60 p-margin-mobile backdrop-blur-sm">
      <div className="w-full max-w-md flex flex-col rounded-2xl bg-surface shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-outline-variant px-stack-lg py-stack-md">
          <div>
            <h2 className="font-headline-md text-headline-md flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">group</span>
              Share with team
            </h2>
            <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mt-1">
              Editors and admins can share
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-stack-lg space-y-stack-md">
          {loading ? (
            <div className="flex justify-center py-stack-md">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : eligible.length === 0 ? (
            <div className="rounded-lg border border-dashed border-outline-variant p-stack-md text-center">
              <p className="text-sm text-on-surface-variant">
                {teams.length === 0
                  ? "You're not in any teams yet. Create one from the Teams page first."
                  : "Only team editors and admins can share briefs. Ask your admin to upgrade your role."}
              </p>
              <Link to="/teams" className="mt-stack-sm inline-block text-sm font-medium text-primary hover:underline">
                Go to Teams →
              </Link>
            </div>
          ) : (
            <>
              <div>
                <label className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-1">
                  Choose a team
                </label>
                <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  {eligible.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.role})
                    </option>
                  ))}
                </select>
              </div>

              {ineligible.length > 0 && (
                <p className="text-xs text-on-surface-variant">
                  You're a viewer in {ineligible.length} other team{ineligible.length !== 1 ? "s" : ""}: {ineligible.map((t) => t.name).join(", ")}
                </p>
              )}

              {error && <div className="rounded-lg bg-error-container/30 p-stack-sm text-sm text-error">{error}</div>}
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-stack-md border-t border-outline-variant bg-surface-container-low px-stack-lg py-stack-md">
          <button onClick={onClose} className="rounded-lg border border-outline-variant bg-surface px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container">
            Cancel
          </button>
          <Button onClick={share} loading={submitting} disabled={!selectedTeam} icon="send">
            Share Brief
          </Button>
        </div>
      </div>
    </div>
  );
}
