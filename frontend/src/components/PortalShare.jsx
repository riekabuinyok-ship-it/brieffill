import { useState, useEffect } from "react";
import api from "../utils/api";
import Button from "./Button";
import Icon from "./Icon";

export default function PortalShare({ briefId, onClose, onCreated }) {
  const [portal, setPortal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const createPortal = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`/briefs/${briefId}/create-portal`);
      setPortal(res.data);
      onCreated?.(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create portal");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/portal/${portal.token}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Fallback: select input text
      const input = document.querySelector("#portal-link-input");
      if (input) { input.select(); document.execCommand("copy"); }
    });
  };

  const regenerate = async () => {
    if (!portal) return;
    setLoading(true);
    try {
      await api.put(`/portal/${portal.token}/regenerate`);
      const statusRes = await api.get(`/briefs/${briefId}/portal-status`);
      setPortal(statusRes.data.portal);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to regenerate");
    } finally {
      setLoading(false);
    }
  };

  const deactivate = async () => {
    if (!portal) return;
    try {
      await api.delete(`/portal/${portal.token}`);
      setPortal(null);
      onCreated?.(null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to deactivate");
    }
  };

  const [initialLoading, setInitialLoading] = useState(true);
  useEffect(() => {
    api.get(`/briefs/${briefId}/portal-status`).then((res) => {
      if (res.data.portal) setPortal(res.data.portal);
    }).catch((err) => {
      setError(err.response?.data?.error || "Failed to load portal status");
    }).finally(() => setInitialLoading(false));
  }, [briefId]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-on-background/60 p-margin-mobile backdrop-blur-sm">
      <div className="w-full max-w-lg flex flex-col rounded-2xl bg-surface shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-outline-variant px-stack-lg py-stack-md">
          <div>
            <h2 className="font-headline-md text-headline-md flex items-center gap-2">
              <Icon name="link" className="text-primary" />
              Collaboration Portal
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Share a link for your client to fill in the brief
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container">
            <Icon name="close" />
          </button>
        </div>

        <div className="p-stack-lg space-y-stack-md max-h-[70vh] overflow-y-auto">
          {error && <div className="rounded-lg bg-error-container/30 p-stack-sm text-sm text-error">{error}</div>}

          {!portal ? (
            initialLoading ? (
              <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-container/20">
                  <Icon name="groups" className="text-[32px] text-primary" />
                </div>
                <p className="text-on-surface-variant">
                  Generate a unique, shareable link for your client. They can fill out all brief fields without creating an account.
                </p>
                <Button onClick={createPortal} loading={loading} iconRight="arrow_forward" size="lg">
                  Create Collaboration Portal
                </Button>
              </div>
            )
          ) : (
            <div className="space-y-stack-md">
              <div className="rounded-xl border border-primary/20 bg-primary-container/10 p-stack-md">
                <label className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-2">Portal Link</label>
                <div className="flex items-center gap-2">
                  <input id="portal-link-input" readOnly value={`${window.location.origin}/portal/${portal.token}`}
                    className="flex-1 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface truncate"
                  />
                  <button onClick={copyLink}
                    className={`flex-shrink-0 rounded-lg px-4 py-2 text-sm font-bold text-on-primary transition-colors ${copied ? "bg-green-600" : "bg-primary hover:bg-surface-tint"}`}>
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 text-center">
                  <p className="font-display text-headline-md font-bold text-primary">{portal.progress?.completed || 0}</p>
                  <p className="text-xs text-on-surface-variant">of {portal.progress?.total || 12} answered</p>
                </div>
                <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 text-center">
                  <p className="font-display text-headline-md font-bold text-primary">{portal.files?.length || 0}</p>
                  <p className="text-xs text-on-surface-variant">files uploaded</p>
                </div>
              </div>

              {portal.lastActivity && (
                <p className="text-sm text-on-surface-variant">
                  Last activity: {new Date(portal.lastActivity).toLocaleString()}
                </p>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={regenerate} loading={loading} icon="refresh" className="flex-1 text-sm">
                  Regenerate Link
                </Button>
                <Button variant="error" onClick={deactivate} icon="link_off" className="flex-1 text-sm">
                  Deactivate
                </Button>
              </div>

              <a href={`/portal/${portal.token}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 py-2 text-sm font-medium text-primary hover:bg-surface-container transition-colors"
              >
                <Icon name="visibility" className="text-[16px]" /> View as Client
              </a>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end border-t border-outline-variant bg-surface-container-low px-stack-lg py-stack-md">
          <button onClick={onClose} className="rounded-lg border border-outline-variant bg-surface px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
