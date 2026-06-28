import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import Breadcrumb from "../components/shared/Breadcrumb";
import DocSearch from "../components/documentation/DocSearch";
import EmptyState from "../components/illustrations/EmptyState";
import GettingStarted from "../components/documentation/GettingStarted";
import UserGuide from "../components/documentation/UserGuide";
import ApiDocs from "../components/documentation/ApiDocs";
import IntegrationsSection from "../components/documentation/IntegrationsSection";
import FaqSection from "../components/documentation/FaqSection";
import Changelog from "../components/documentation/Changelog";
import DocsLayout from "../components/DocsLayout";

const SECTIONS = {
  "getting-started": { label: "Getting Started", component: GettingStarted },
  "user-guide": { label: "User Guide", component: UserGuide },
  api: { label: "API Reference", component: ApiDocs },
  integrations: { label: "Integrations", component: IntegrationsSection },
  faq: { label: "FAQ", component: FaqSection },
  changelog: { label: "Changelog", component: Changelog },
};

export default function Documentation() {
  const [searchParams, setSearchParams] = useSearchParams();
  const section = searchParams.get("section") || "getting-started";
  const [searchQuery, setSearchQuery] = useState("");

  const setSection = (id) => {
    setSearchParams(id === "getting-started" ? {} : { section: id });
  };

  const SectionComponent = SECTIONS[section]?.component || GettingStarted;

  const breadcrumbItems = [{ label: "Documentation", to: "/docs" }];
  if (section !== "getting-started") {
    breadcrumbItems.push({ label: SECTIONS[section]?.label || "Getting Started" });
  }

  return (
    <DocsLayout activeSection={section} onSectionChange={setSection}>
      <Breadcrumb items={breadcrumbItems} />

      <div className="mb-stack-lg">
        <h1 className="font-headline-lg text-headline-lg mb-2">Documentation</h1>
        <p className="text-on-surface-variant">Learn how to use BriefFill, explore the API, and find answers to common questions.</p>
      </div>

      <DocSearch value={searchQuery} onChange={setSearchQuery} />

      {section === "faq" ? (
        <FaqSection searchQuery={searchQuery} />
      ) : searchQuery.trim() ? (
        <SearchResults query={searchQuery} onNavigate={setSection} />
      ) : (
        <SectionComponent />
      )}
    </DocsLayout>
  );
}

function SearchResults({ query, onNavigate }) {
  const results = useMemo(() => {
    const q = query.toLowerCase();
    const items = [];
    const sectionContent = {
      "Getting Started": ["Create a new brief", "Review the analysis", "Generate & send", "Video Tutorial"],
      "User Guide": ["How to Analyze a Brief", "Understanding the Score", "Using Templates", "Team Collaboration", "Collaboration Portal"],
      "API Reference": ["Authentication", "POST /api/public/analyze", "GET /api/public/fields", "POST /api/public/email-draft", "Rate Limiting"],
      Integrations: ["Google Docs", "Notion", "Slack", "Zapier"],
    };
    for (const [section, terms] of Object.entries(sectionContent)) {
      const matching = terms.filter((t) => t.toLowerCase().includes(q));
      if (matching.length > 0) items.push({ section, matches: matching });
    }
    return items;
  }, [query]);

  return (
    <div>
      <h2 className="font-headline-md text-headline-md mb-4">Search results for "{query}"</h2>
      {results.length === 0 ? (
        <div className="flex flex-col items-center py-10 gap-3">
          <div className="w-32 h-28">
            <EmptyState type="search" />
          </div>
          <p className="text-sm text-on-surface-variant">No results found. Try a different search term.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((r) => (
            <div key={r.section} className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant">
              <button
                onClick={() => onNavigate(r.section === "Getting Started" ? "getting-started" : r.section === "User Guide" ? "user-guide" : r.section === "API Reference" ? "api" : r.section.toLowerCase())}
                className="text-sm font-medium text-primary hover:underline mb-2"
              >
                {r.section}
              </button>
              <ul className="space-y-1">
                {r.matches.map((m) => (
                  <li key={m} className="text-sm text-on-surface-variant">
                    <span className="bg-primary/10 text-primary px-0.5 rounded">{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
