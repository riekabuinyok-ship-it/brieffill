import { useState, useEffect } from "react";
import api from "../../utils/api";
import Icon from "../Icon";

export default function ApiKeyManager() {
  const [keys, setKeys] = useState([]);
  const [newKey, setNewKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await api.get("/docs/api-keys");
      setKeys(res.data.keys || []);
    } catch (err) {
      if (err.response?.status !== 403) setError("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchKeys(); }, []);

  const generateKey = async () => {
    setError("");
    try {
      const res = await api.post("/docs/api-keys", { name: "API Key" });
      const key = res.data.key;
      setNewKey(key);
      setKeys((prev) => [{ id: key.id, name: key.name, createdAt: key.createdAt }, ...prev]);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to generate key");
    }
  };

  const revokeKey = async (id) => {
    try {
      await api.delete(`/docs/api-keys/${id}`);
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || "Failed to revoke key");
    }
  };

  const copyKey = (plain) => {
    navigator.clipboard.writeText(plain).catch(() => {});
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900">API Keys</h3>
      <p className="text-sm text-gray-500 mb-4">
        Use these keys to authenticate API requests. Keys start with <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">bfk_</code>
      </p>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

      {newKey && (
        <div className="mb-4 p-4 rounded-lg bg-indigo-50 border border-indigo-200">
          <p className="text-sm font-medium text-indigo-900 mb-1">Your new API key</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-2 bg-white rounded border border-indigo-200 text-sm font-mono break-all">{newKey.plain}</code>
            <button onClick={() => copyKey(newKey.plain)} className="shrink-0 px-3 py-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium">Copy</button>
          </div>
          <p className="text-xs text-indigo-600 mt-2">Make sure to copy this key now. You won't be able to see it again.</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-20"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
      ) : keys.length > 0 ? (
        <div className="space-y-3 mb-4">
          {keys.map((key) => (
            <div key={key.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-900">{key.name}</span>
                <span className="text-xs text-gray-500 ml-2">Created {key.createdAt ? new Date(key.createdAt + "Z").toLocaleDateString() : "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => revokeKey(key.id)} className="text-sm text-red-600 hover:text-red-800">Revoke</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 mb-4">No API keys yet.</p>
      )}

      <button onClick={generateKey} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">
        + Generate New API Key
      </button>
    </div>
  );
}
