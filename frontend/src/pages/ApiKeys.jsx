import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import Icon from "../components/Icon";
import Button from "../components/Button";
import Toast from "../components/Toast";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function ApiKeys() {
  const [apiKeys, setApiKeys] = useState([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(true);
  const [newKeyData, setNewKeyData] = useState(null);
  const [keyName, setKeyName] = useState("");
  const [creatingKey, setCreatingKey] = useState(false);
  const [keyError, setKeyError] = useState("");
  const [toast, setToast] = useState(null);
  const [billingData, setBillingData] = useState(null);

  useEffect(() => {
    api.get("/docs/api-keys").then((res) => {
      setApiKeys(res.data.keys || []);
    }).catch(() => {}).finally(() => setApiKeysLoading(false));
    api.get("/billing/me").then((res) => {
      setBillingData(res.data.billing);
    }).catch(() => {});
  }, []);

  const createApiKey = async () => {
    const name = keyName.trim();
    if (!name) { setKeyError("Enter a name for this key"); return; }
    setCreatingKey(true);
    setKeyError("");
    try {
      const res = await api.post("/docs/api-keys", { name });
      setNewKeyData(res.data.key);
      setApiKeys((prev) => [{ id: res.data.key.id, name: res.data.key.name, createdAt: res.data.key.createdAt }, ...prev]);
      setKeyName("");
    } catch (err) {
      setKeyError(err.response?.data?.error || "Failed to create key");
    } finally {
      setCreatingKey(false);
    }
  };

  const revokeApiKey = async (id) => {
    try {
      await api.delete(`/docs/api-keys/${id}`);
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (err) {
      setToast({ message: err.response?.data?.error || "Failed to revoke key", type: "error" });
    }
  };

  const copyKey = (text) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setToast({ message: "API key copied to clipboard", type: "success" });
  };

  const isPaidPlan = billingData?.plan === "agency";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface mb-2">API Keys</h1>
        <p className="text-sm text-on-surface-variant">Manage API keys for programmatic access to BriefFill.</p>
      </div>

      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 space-y-5">
        {!isPaidPlan ? (
          <div className="flex items-center gap-3 text-sm text-on-surface-variant">
            <Icon name="lock" className="text-[18px]" />
            <span>API key management is available on the <Link to="/pricing" className="text-primary hover:underline">Agency plan</Link>.</span>
          </div>
        ) : (
          <>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Create API Key</p>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-on-surface-variant mb-1">Key name</label>
                  <input type="text" value={keyName} onChange={(e) => setKeyName(e.target.value)}
                    placeholder="e.g. CI/CD pipeline, Browser extension"
                    className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    onKeyDown={(e) => e.key === "Enter" && createApiKey()} />
                </div>
                <Button onClick={createApiKey} loading={creatingKey} icon="vpn_key" size="sm">Generate</Button>
              </div>
              {keyError && <p className="text-xs text-error mt-1">{keyError}</p>}
              <p className="text-xs text-on-surface-variant mt-1">Keys start with <code className="rounded bg-surface-container px-1 font-mono">bfk_</code></p>
            </div>

            {newKeyData && (
              <div className="rounded-lg border border-primary/30 bg-primary-container/10 p-4">
                <p className="text-xs font-semibold text-primary mb-1">Your new API key — copy it now, you won't see it again</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-surface border border-outline-variant px-3 py-2 text-sm font-mono break-all select-all">{newKeyData.plain}</code>
                  <button onClick={() => copyKey(newKeyData.plain)}
                    className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-on-primary hover:bg-primary/90">Copy</button>
                  <button onClick={() => setNewKeyData(null)}
                    className="shrink-0 text-xs text-on-surface-variant hover:text-on-surface">Dismiss</button>
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Your Keys</p>
              {apiKeysLoading ? (
                <div className="flex items-center justify-center h-16">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : apiKeys.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No API keys yet.</p>
              ) : (
                <div className="space-y-2">
                  {apiKeys.map((key) => (
                    <div key={key.id} className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-on-surface">{key.name}</p>
                        <p className="text-xs text-on-surface-variant">
                          Created {key.createdAt ? formatDate(key.createdAt) : "—"}
                          {key.lastUsedAt ? ` · Last used ${formatDate(key.lastUsedAt)}` : ""}
                        </p>
                      </div>
                      <button onClick={() => revokeApiKey(key.id)}
                        className="text-xs font-semibold text-error hover:text-error/80">Revoke</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}
