import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/api";
import Icon from "../Icon";
import ApiKeyManager from "./ApiKeyManager";

export default function ApiDocs() {
  const [access, setAccess] = useState({ hasApiAccess: false, plan: "free" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("brieffill_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api.get("/docs/plan-access").then((res) => setAccess(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  }

  if (!access.hasApiAccess) {
    return (
      <div>
        <h2 className="font-headline-md text-headline-md mb-2">API Reference</h2>
        <p className="text-on-surface-variant mb-6">Integrate BriefFill with your own tools and workflows.</p>
        <div className="bg-gradient-to-r from-primary-container/20 to-secondary-container/20 rounded-lg p-8 text-center border border-primary/20">
          <Icon name="api" className="text-4xl text-primary mb-3" />
          <p className="text-on-surface mb-2 font-medium">API access is available on Team and Agency plans</p>
          <p className="text-sm text-on-surface-variant mb-4">Upgrade to unlock API access, integrations, and more</p>
          <Link to="/dashboard/billing" className="inline-flex px-4 py-2 bg-primary text-on-primary text-sm font-medium rounded-lg hover:opacity-90 transition">View Plans</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-headline-md text-headline-md mb-2">API Reference</h2>
      <p className="text-on-surface-variant mb-6">Integrate BriefFill with your own tools and workflows.</p>

      <div className="space-y-6">
        {/* Authentication */}
        <div className="rounded-xl border border-outline-variant p-6 shadow-sm bg-surface">
          <h3 className="font-headline-md text-headline-md mb-3">Authentication</h3>
          <p className="text-sm text-on-surface-variant mb-3">All API requests require an API key passed in the <code className="bg-surface-container px-1 py-0.5 rounded text-xs">Authorization</code> header:</p>
          <pre className="bg-on-background text-surface p-4 rounded-lg text-sm font-mono overflow-x-auto">Authorization: Bearer bfk_your_api_key_here</pre>
        </div>

        {/* Endpoints */}
        <div className="rounded-xl border border-outline-variant p-6 shadow-sm bg-surface">
          <h3 className="font-headline-md text-headline-md mb-3">Endpoints</h3>
          <div className="space-y-4">
            {[
              { method: "POST", path: "/api/public/analyze", desc: "Analyze a brief and return scores, missing fields, and AI questions." },
              { method: "GET", path: "/api/public/fields", desc: "List all 12 analysis fields and their descriptions." },
              { method: "POST", path: "/api/public/email-draft", desc: "Generate a clarification email from analysis results." },
            ].map((ep) => (
              <div key={ep.path} className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-low">
                <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-bold uppercase ${ep.method === "GET" ? "bg-primary/10 text-primary" : "bg-primary-container/30 text-primary-container"}`}>
                  {ep.method}
                </span>
                <div>
                  <code className="text-sm font-mono text-on-surface">{ep.path}</code>
                  <p className="text-xs text-on-surface-variant mt-0.5">{ep.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rate Limiting */}
        <div className="rounded-xl border border-outline-variant p-6 shadow-sm bg-surface">
          <h3 className="font-headline-md text-headline-md mb-3">Rate Limiting</h3>
          <p className="text-sm text-on-surface-variant">API requests are limited to 60 requests per minute per API key. Exceeding this limit returns a 429 status code.</p>
        </div>

        {/* API Key Management */}
        <ApiKeyManager />
      </div>
    </div>
  );
}
