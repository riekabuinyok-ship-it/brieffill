import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/api";
import Icon from "../Icon";

const INTEGRATIONS = [
  { name: "Google Docs", description: "Export briefs directly to Google Docs", status: "Connected", img: "/Google-Docs.png" },
  { name: "Notion", description: "Save briefs to your Notion database", status: "Available", img: "/Notion.png" },
  { name: "Slack", description: "Get notifications in Slack", status: "Coming Soon", icon: "notifications" },
  { name: "Zapier", description: "Connect to 5,000+ apps", status: "Coming Soon", icon: "bolt" },
];

export default function IntegrationsSection() {
  const [access, setAccess] = useState({ hasIntegrationsAccess: false, plan: "free" });
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

  if (!access.hasIntegrationsAccess) {
    return (
      <div>
        <h2 className="font-headline-md text-headline-md mb-2">Integrations</h2>
        <p className="text-on-surface-variant mb-6">Connect BriefFill with your favorite tools.</p>
        <div className="bg-gradient-to-r from-primary-container/20 to-secondary-container/20 rounded-lg p-8 text-center border border-primary/20">
          <Icon name="hub" className="text-4xl text-primary mb-3" />
          <p className="text-on-surface mb-2 font-medium">Integrations are available on Team and Agency plans</p>
          <Link to="/dashboard/billing" className="inline-flex px-4 py-2 bg-primary text-on-primary text-sm font-medium rounded-lg hover:opacity-90 transition">View Plans</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-headline-md text-headline-md mb-2">Integrations</h2>
      <p className="text-on-surface-variant mb-6">Connect BriefFill with your favorite tools.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {INTEGRATIONS.map((int) => (
          <div key={int.name} className="rounded-xl border border-outline-variant p-5 shadow-sm bg-surface hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                {int.img ? (
                  <img src={int.img} alt={int.name} className="w-5 h-5 object-contain" />
                ) : (
                  <Icon name={int.icon} className="text-[22px]" />
                )}
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                int.status === "Connected" ? "bg-primary/10 text-primary" :
                int.status === "Available" ? "bg-primary-container/30 text-primary-container" :
                "bg-surface-variant text-on-surface-variant"
              }`}>
                {int.status}
              </span>
            </div>
            <h4 className="font-semibold text-sm text-on-surface">{int.name}</h4>
            <p className="text-xs text-on-surface-variant mt-1">{int.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
