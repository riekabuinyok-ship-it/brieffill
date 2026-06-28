import { Link } from "react-router-dom";
import Icon from "../Icon";
import DocAnalyzeIllustration from "../illustrations/DocAnalyzeIllustration";

export default function GettingStarted() {
  return (
    <div>
      <h2 className="font-headline-md text-headline-md mb-2">Getting Started</h2>
      <p className="text-on-surface-variant mb-8">Welcome to BriefFill! Follow these steps to analyze your first brief.</p>

      <div className="space-y-6 mb-8">
        {[
          { step: "1", title: "Create a new brief", desc: "Click 'New Brief' in the navigation bar. Paste your client's project brief — it can be an email, a document, a URL, or a text file.", icon: "edit_note", variant: 1 },
          { step: "2", title: "Review the analysis", desc: "BriefFill scans your brief against 12 critical fields. In seconds, you'll see a completeness score, missing fields, and AI-generated clarification questions.", icon: "analytics", variant: 2 },
          { step: "3", title: "Generate & send", desc: "Use the AI draft to write a professional clarification email. Your client fills in the gaps, and you start the project with full visibility.", icon: "send", variant: 3 },
        ].map((s) => (
          <div key={s.step} className="flex gap-4 p-4 rounded-xl bg-surface-container-lowest border border-outline-variant">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary font-bold text-sm">
              {s.step}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-on-surface mb-1">{s.title}</h3>
              <p className="text-sm text-on-surface-variant">{s.desc}</p>
            </div>
            <div className="hidden sm:flex w-28 items-center justify-center">
              <DocAnalyzeIllustration variant={s.variant} />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-gradient-to-r from-primary/5 to-primary-fixed/10 border border-primary/20 p-6">
        <div className="flex items-center gap-3 mb-3">
          <Icon name="smart_display" className="text-primary text-[24px]" />
          <h3 className="font-semibold text-on-surface">Video Tutorial</h3>
        </div>
        <div className="aspect-video rounded-lg bg-surface-container flex items-center justify-center">
          <div className="text-center">
            <Icon name="play_circle" className="text-5xl text-primary mb-2" />
            <p className="text-sm text-on-surface-variant">Watch the Quick Start Guide</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Link to="/new" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary text-sm font-medium rounded-lg hover:bg-surface-tint transition">
          <Icon name="add" className="text-[18px]" />
          Create Your First Brief
        </Link>
      </div>
    </div>
  );
}
