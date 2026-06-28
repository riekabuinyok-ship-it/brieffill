import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../Icon";

const SECTIONS = [
  {
    id: "analyze",
    title: "How to Analyze a Brief",
    icon: "search_insights",
    content: (
      <div className="space-y-3 text-sm text-on-surface-variant">
        <p>Navigate to <strong>New Brief</strong> from the sidebar or top nav. You can paste text, upload a file, or enter a URL. BriefFill will analyze the content and provide a completeness score and AI-generated clarification questions.</p>
        <p>After analysis, you can view the score breakdown, edit missing fields, and generate a professional email draft to send to your client.</p>
        <Link to="/new" className="inline-flex items-center gap-1 text-primary font-medium hover:underline">Go to New Brief <Icon name="arrow_forward" className="text-[14px]" /></Link>
      </div>
    ),
  },
  {
    id: "score",
    title: "Understanding the Score",
    icon: "monitoring",
    content: (
      <div className="space-y-3 text-sm text-on-surface-variant">
        <p>The completeness score (0-100%) measures how much critical information your brief contains across 12 fields:</p>
        <div className="grid grid-cols-2 gap-2">
          {["Budget Range", "Timeline", "Target Audience", "Scope of Work", "Success Metrics", "Brand Guidelines", "Technical Requirements", "Stakeholders", "Deliverables", "Milestones", "Constraints", "References"].map((f) => (
            <div key={f} className="flex items-center gap-2 p-2 rounded-lg bg-surface-container">
              <Icon name="check_circle" className="text-[14px] text-primary" />
              <span className="text-xs">{f}</span>
            </div>
          ))}
        </div>
        <p className="mt-3">Scores above 80% indicate a well-defined brief. Scores below 60% need significant clarification before starting work.</p>
      </div>
    ),
  },
  {
    id: "templates",
    title: "Using Templates",
    icon: "description",
    content: (
      <div className="space-y-3 text-sm text-on-surface-variant">
        <p>Templates let you save recurring brief structures. Create a template from any analyzed brief, then reuse it to speed up future projects.</p>
        <p>Each template preserves the field structure, allowing BriefFill to perform more targeted analysis on similar project types.</p>
      </div>
    ),
  },
  {
    id: "team",
    title: "Team Collaboration",
    icon: "group",
    content: (
      <div className="space-y-3 text-sm text-on-surface-variant">
        <p>Team and Agency plans support multi-user collaboration. Invite team members, assign roles (admin, editor, viewer), and share briefs across your organization.</p>
        <Link to="/teams" className="inline-flex items-center gap-1 text-primary font-medium hover:underline">Manage your team <Icon name="arrow_forward" className="text-[14px]" /></Link>
      </div>
    ),
  },
  {
    id: "portal",
    title: "Collaboration Portal",
    icon: "share",
    content: (
      <div className="space-y-3 text-sm text-on-surface-variant">
        <p>The Collaboration Portal lets you share a brief with clients or external stakeholders via a secure, token-based link. They can view the brief, answer clarification questions, and upload files — no account required.</p>
        <p>Available on Team and Agency plans. Generate a portal link from any brief detail page.</p>
      </div>
    ),
  },
];

export default function UserGuide() {
  const [open, setOpen] = useState(null);
  return (
    <div>
      <h2 className="font-headline-md text-headline-md mb-2">User Guide</h2>
      <p className="text-on-surface-variant mb-6">Learn how to get the most out of BriefFill.</p>
      <div className="space-y-3">
        {SECTIONS.map((s) => (
          <div key={s.id} className="rounded-xl border border-outline-variant overflow-hidden">
            <button
              onClick={() => setOpen(open === s.id ? null : s.id)}
              className="w-full flex items-center justify-between p-4 bg-surface-container-lowest hover:bg-surface-container transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Icon name={s.icon} className="text-[20px] text-primary" />
                <span className="font-medium text-on-surface">{s.title}</span>
              </div>
              <Icon name={open === s.id ? "expand_less" : "expand_more"} className="text-on-surface-variant" />
            </button>
            {open === s.id && <div className="px-4 pb-4 bg-surface-container-lowest">{s.content}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
