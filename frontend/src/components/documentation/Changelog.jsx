import Icon from "../Icon";

const ENTRIES = [
  { version: "2.5.0", date: "June 2026", changes: ["AI Auto-Tagging for automatic project scope detection", "Competitor analysis for Agency plan", "Improved score accuracy with contextual weighting"] },
  { version: "2.4.0", date: "May 2026", changes: ["Collaboration Portal for Team and Agency plans", "ClickUp and Airtable export", "Webhook support for brief events"] },
  { version: "2.3.0", date: "April 2026", changes: ["Brief Builder with AI rewrite", "PDF and clipboard export", "Outcome tracking and success rate analytics"] },
  { version: "2.2.0", date: "March 2026", changes: ["Team collaboration features", "Notion and Google Docs export", "Role-based access (admin, editor, viewer)"] },
  { version: "2.1.0", date: "February 2026", changes: ["API access for Team and Agency plans", "Integrations page with webhook management", "Email draft generation improvements"] },
  { version: "2.0.0", date: "January 2026", changes: ["Complete UI redesign with new dashboard", "12-field analysis engine", "Score timeline and industry benchmarks", "Internationalization with 11 languages"] },
];

export default function Changelog() {
  return (
    <div>
      <h2 className="font-headline-md text-headline-md mb-2">Changelog</h2>
      <p className="text-on-surface-variant mb-6">Recent updates and new features.</p>
      <div className="space-y-4">
        {ENTRIES.map((entry) => (
          <div key={entry.version} className="rounded-xl border border-outline-variant p-5 shadow-sm bg-surface">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold">v{entry.version}</span>
                <span className="text-xs text-on-surface-variant">{entry.date}</span>
              </div>
            </div>
            <ul className="space-y-2">
              {entry.changes.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-on-surface">
                  <Icon name="check_circle" className="text-[14px] text-primary mt-0.5 shrink-0" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
