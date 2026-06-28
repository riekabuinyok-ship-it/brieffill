import { useEffect, useState } from "react";
import api from "../utils/api";
import Icon from "../components/Icon";
import Button from "../components/Button";
import Toast from "../components/Toast";

const EVENTS = [
  { id: "brief.analyzed", label: "Brief analyzed" },
  { id: "brief.rebuilt", label: "Brief rebuilt (AI-improved)" },
  { id: "brief.outcome_recorded", label: "Outcome recorded" },
  { id: "brief.competitor_analysis_run", label: "Competitor analysis run" },
  { id: "brief.email_generated", label: "Email generated" },
];

export default function Integrations() {
  const [integrations, setIntegrations] = useState({});
  const [deliveries, setDeliveries] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [newKey, setNewKey] = useState(null);

  const refresh = async () => {
    try {
      const res = await api.get("/integrations/status");
      setIntegrations(res.data.integrations || {});
      setDeliveries(res.data.deliveries || []);
      const k = await api.get("/api-keys");
      setApiKeys(k.data.keys || []);
    } catch (err) {
      setToast({ message: "Failed to load integrations", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const onSaved = (provider) => {
    setToast({ message: `${provider} saved`, type: "success" });
    refresh();
  };

  const createKey = async () => {
    try {
      const res = await api.post("/api-keys", { name: "Google Docs add-on" });
      const plain = res?.data?.key?.plain;
      if (!plain) {
        setToast({ message: "Server returned an unexpected response", type: "error" });
        return;
      }
      // Refresh the key list FIRST so the new row is visible.
      await refresh();
      // Show the key in a modal so the user can copy it manually even if
      // the Clipboard API is blocked (HTTP context, cross-origin, etc.).
      setNewKey({ plain, id: res.data.key.id, name: res.data.key.name });
      // Best-effort clipboard write — never block the flow on it.
      if (navigator?.clipboard?.writeText) {
        try { await navigator.clipboard.writeText(plain); } catch { /* ignored */ }
      }
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to create key";
      setToast({ message: msg, type: "error" });
    }
  };

  const copyNewKey = async () => {
    if (!newKey) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(newKey.plain);
        setToast({ message: "Copied to clipboard", type: "success" });
        return;
      }
    } catch { /* fall through to legacy */ }
    // Fallback for non-secure contexts: select the input and let the user copy.
    const el = document.getElementById("newKeyInput");
    if (el) {
      el.focus();
      el.select();
      setToast({ message: "Clipboard blocked — press Ctrl+C / Cmd+C to copy", type: "info" });
    }
  };

  const revokeKey = async (id) => {
    if (!confirm("Revoke this key? Any device using it will lose access immediately.")) return;
    try {
      await api.delete(`/api-keys/${id}`);
      setToast({ message: "Key revoked", type: "success" });
      refresh();
    } catch {
      setToast({ message: "Failed to revoke", type: "error" });
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-margin-mobile md:px-margin-desktop pt-20 md:pt-24">
        <div className="text-on-surface-variant">Loading integrations…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-margin-mobile md:px-margin-desktop pt-20 md:pt-24">
      <div className="mb-stack-lg">
        <h1 className="font-headline-lg text-headline-lg mb-2">Integrations</h1>
        <p className="font-body-md text-on-surface-variant">Connect BriefFill to the tools you already use.</p>
      </div>

      <section className="mb-stack-lg space-y-stack-md">
        <h3 className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Export destinations</h3>

        <IntegrationCard
          provider="notion"
          title="Notion"
          description="Save analyzed briefs to a Notion database. Either use the server-wide Notion (if your admin has set it up) or paste your own key."
          integration={integrations.notion}
          onSaved={() => onSaved("Notion")}
          img="/Notion.png"
          fields={[
            { name: "apiKey", label: "API key (leave blank to keep current)", type: "password", placeholder: "secret_..." },
            { name: "targetId", label: "Database ID", type: "text", placeholder: "abc123def456..." },
          ]}
        />

        <IntegrationCard
          provider="clickup"
          title="ClickUp"
          description="Send briefs as new tasks to a ClickUp list."
          integration={integrations.clickup}
          onSaved={() => onSaved("ClickUp")}
          img="/ClickUp.png"
          fields={[
            { name: "apiKey", label: "API key (leave blank to keep current)", type: "password", placeholder: "pk_..." },
            { name: "targetId", label: "List ID", type: "text", placeholder: "123456789" },
          ]}
        />

        <IntegrationCard
          provider="airtable"
          title="Airtable"
          description="Add a row to an Airtable table with each brief's content, client, project, and score."
          integration={integrations.airtable}
          onSaved={() => onSaved("Airtable")}
          img="/Airtable.png"
          fields={[
            { name: "apiKey", label: "API key (leave blank to keep current)", type: "password", placeholder: "pat_..." },
            { name: "targetId", label: "Base ID", type: "text", placeholder: "appXXXXXXXX" },
            { name: "targetId2", label: "Table ID or name", type: "text", placeholder: "Briefs" },
          ]}
        />
      </section>

      <section className="mb-stack-lg space-y-stack-md">
        <h3 className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Webhooks</h3>
        <p className="text-sm text-on-surface-variant">
          Send a POST request to any URL when something happens in BriefFill. Use it to power Zapier, Make, n8n, or your own scripts.
        </p>

        <WebhookCard
          integration={integrations.webhook}
          onSaved={() => onSaved("Webhook")}
        />

        {deliveries.length > 0 && (
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md">
            <h4 className="mb-stack-sm font-semibold text-on-surface">Recent deliveries</h4>
            <ul className="space-y-stack-sm text-sm">
              {deliveries.map((d) => (
                <li key={d.id} className="flex items-start gap-stack-sm border-b border-outline-variant pb-stack-sm last:border-0">
                  <span className={`mt-0.5 inline-flex h-2 w-2 flex-shrink-0 rounded-full ${d.statusCode >= 200 && d.statusCode < 300 ? "bg-primary" : d.statusCode ? "bg-error" : "bg-secondary"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-on-surface">
                      {d.event} <span className="font-normal text-on-surface-variant">→ {new URL(d.url).hostname}</span>
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {d.statusCode ? `HTTP ${d.statusCode}` : "No response"} · {d.durationMs}ms · {new Date(d.createdAt).toLocaleString()}
                    </p>
                    {d.error && <p className="text-xs text-error">{d.error}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="mb-stack-lg space-y-stack-md">
        <h3 className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Google Docs add-on</h3>
        <p className="text-sm text-on-surface-variant">
          Analyze briefs directly inside a Google Doc. Install the add-on, then paste the API key it asks for.
        </p>

        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md">
          <ol className="list-decimal space-y-stack-sm pl-5 text-sm text-on-surface">
            <li>
              Open{" "}
              <a
                href="https://script.google.com/home"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary hover:underline"
              >
                script.google.com
              </a>{" "}
              and create a new project. Paste the files from <code className="rounded bg-surface-container px-1 text-xs">google-docs-addon/</code> in this repo.
            </li>
            <li>Click <strong>Deploy → New deployment → Add-on</strong> and authorize.</li>
            <li>Generate an API key below, copy it, and paste it into the add-on's settings when prompted.</li>
          </ol>

          <div className="mt-stack-md flex items-center gap-stack-sm">
            <Button onClick={createKey}>Generate new API key</Button>
            <span className="text-xs text-on-surface-variant">
              Keys start with <code className="rounded bg-surface-container px-1">bfk_…</code>
            </span>
          </div>

          {apiKeys.length > 0 && (
            <ul className="mt-stack-md divide-y divide-outline-variant">
              {apiKeys.map((k) => (
                <li key={k.id} className="flex items-center justify-between py-stack-sm text-sm">
                  <div>
                    <p className="font-medium text-on-surface">{k.name}</p>
                    <p className="text-xs text-on-surface-variant">
                      Created {new Date(k.createdAt).toLocaleDateString()}
                      {k.lastUsedAt && ` · last used ${new Date(k.lastUsedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <button
                    onClick={() => revokeKey(k.id)}
                    className="rounded-lg border border-error/30 px-3 py-1.5 text-xs font-medium text-error hover:bg-error-container/10"
                  >
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {newKey && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-stack-md"
          onClick={() => setNewKey(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface p-stack-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-stack-md flex items-center gap-stack-sm">
              <span className="material-symbols-outlined text-primary text-[28px]">vpn_key</span>
              <h3 className="font-headline-md text-headline-md">Your new API key</h3>
            </div>
            <p className="mb-stack-sm text-sm text-on-surface-variant">
              Copy this key now. You will <strong>not</strong> be able to see it again.
            </p>
            <div className="flex items-stretch gap-stack-sm">
              <input
                id="newKeyInput"
                type="text"
                readOnly
                value={newKey.plain}
                onFocus={(e) => e.target.select()}
                onClick={(e) => e.target.select()}
                className="flex-1 rounded-lg border border-outline-variant bg-surface-container px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary"
              />
              <Button onClick={copyNewKey} icon="content_copy">Copy</Button>
            </div>
            <div className="mt-stack-md flex justify-end gap-stack-sm">
              <Button variant="ghost" onClick={() => setNewKey(null)}>Done</Button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}

function IntegrationCard({ provider, title, description, fields, integration, onSaved, img }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    const next = {};
    fields.forEach((f) => {
      if (f.name === "apiKey") {
        next[f.name] = "";
      } else {
        next[f.name] = integration?.[f.name === "targetId" ? "targetId" : f.name === "targetId2" ? "targetId2" : f.name] || "";
      }
    });
    setForm(next);
  }, [integration]);

  const onSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form };
      Object.keys(payload).forEach((k) => { if (payload[k] === "") delete payload[k]; });
      await api.put(`/integrations/${provider}`, payload);
      setForm((f) => ({ ...f, apiKey: "" }));
      onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const onTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.post(`/integrations/${provider}/test`);
      setTestResult(res.data);
    } catch (err) {
      setTestResult({ ok: false, message: err.response?.data?.error || "Test failed" });
    } finally {
      setTesting(false);
    }
  };

  const onClear = async () => {
    if (!confirm(`Remove all ${title} credentials? You can re-add them anytime.`)) return;
    await api.delete(`/integrations/${provider}`);
    onSaved();
  };

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md">
      <div className="mb-stack-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-stack-sm">
            {img && <img src={img} alt="" className="w-5 h-5 object-contain" />}
            <h4 className="font-semibold text-on-surface">{title}</h4>
            {integration?.configured ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-outline-variant/30 px-2 py-0.5 text-[10px] font-medium uppercase text-on-surface-variant">
                Not connected
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-on-surface-variant">{description}</p>
          {integration?.apiKeyPreview && (
            <p className="mt-1 text-xs text-on-surface-variant">
              Current key: <code className="rounded bg-surface-container px-1">{integration.apiKeyPreview}</code>
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-stack-sm sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.name}>
            <label className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-1">
              {f.label}
            </label>
            <input
              type={f.type}
              value={form[f.name] || ""}
              onChange={(e) => setForm((p) => ({ ...p, [f.name]: e.target.value }))}
              placeholder={f.placeholder}
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
        ))}
      </div>

      {testResult && (
        <div className={`mt-stack-sm rounded-lg p-stack-sm text-sm ${testResult.ok ? "bg-primary/10 text-primary" : "bg-error-container/20 text-error"}`}>
          {testResult.message}
        </div>
      )}

      <div className="mt-stack-md flex flex-wrap gap-stack-sm">
        <Button onClick={onSave} loading={saving} icon="save">Save</Button>
        <Button onClick={onTest} variant="outline" loading={testing} icon="check_circle">Test connection</Button>
        {integration?.configured && (
          <Button onClick={onClear} variant="ghost" icon="delete">Clear</Button>
        )}
      </div>
    </div>
  );
}

function WebhookCard({ integration, onSaved }) {
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    setUrl(integration?.webhookUrl || "");
    setEvents(integration?.webhookEvents || []);
  }, [integration]);

  const toggle = (id) => {
    setEvents((cur) => (cur.includes(id) ? cur.filter((e) => e !== id) : [...cur, id]));
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await api.put("/integrations/webhook", { webhookUrl: url, webhookEvents: events });
      onSaved();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const onTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.post("/integrations/webhook/test");
      setTestResult(res.data);
    } catch (err) {
      setTestResult({ ok: false, message: err.response?.data?.error || "Test failed" });
    } finally {
      setTesting(false);
    }
  };

  const onClear = async () => {
    if (!confirm("Remove the webhook?")) return;
    await api.delete("/integrations/webhook");
    onSaved();
  };

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md">
      <div className="mb-stack-sm flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-on-surface">Outbound webhook</h4>
          <p className="mt-1 text-sm text-on-surface-variant">POST a JSON body to your URL on every event you check below.</p>
        </div>
        {integration?.configured && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {events.length} event{events.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://hooks.zapier.com/hooks/catch/..."
        className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:border-primary"
      />

      <div className="mt-stack-sm grid grid-cols-1 gap-stack-sm sm:grid-cols-2">
        {EVENTS.map((e) => (
          <label key={e.id} className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface p-stack-sm text-sm">
            <input
              type="checkbox"
              checked={events.includes(e.id)}
              onChange={() => toggle(e.id)}
              className="h-4 w-4 rounded border-outline-variant"
            />
            <span>{e.label}</span>
          </label>
        ))}
      </div>

      {testResult && (
        <div className={`mt-stack-sm rounded-lg p-stack-sm text-sm ${testResult.ok ? "bg-primary/10 text-primary" : "bg-error-container/20 text-error"}`}>
          {testResult.message}
        </div>
      )}

      <div className="mt-stack-md flex flex-wrap gap-stack-sm">
        <Button onClick={onSave} loading={saving} icon="save">Save</Button>
        <Button onClick={onTest} variant="outline" loading={testing} icon="send">Send test</Button>
        {integration?.configured && (
          <Button onClick={onClear} variant="ghost" icon="delete">Clear</Button>
        )}
      </div>
    </div>
  );
}
