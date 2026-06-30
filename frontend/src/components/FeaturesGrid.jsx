import Icon from "./Icon";

const FEATURES = [
  {
    icon: "contact_support",
    title: "AI Clarification Questions",
    description:
      "Get a curated list of surgical, professional questions to send back to your client — no more 'TBD' or 'to be discussed'.",
    core: true,
  },
  {
    icon: "auto_awesome",
    title: "Brief Builder (AI rewrite)",
    description:
      "Take a thin or vague brief and BriefFill rewrites it into a complete, scoped brief ready to quote against.",
    core: true,
  },
  {
    icon: "psychology",
    title: "12-field analysis",
    description:
      "Every brief is scored across the 12 fields agencies rely on: budget, timeline, audience, deliverables, brand voice, and more.",
  },
  {
    icon: "mail",
    title: "Email Draft Generation",
    description:
      "Generate a polished, on-tone clarification email in one click. Copy to clipboard, export as PDF, or send in your email client.",
  },
  {
    icon: "timeline",
    title: "Score Timeline + Benchmarks",
    description:
      "Track your brief quality over time and benchmark against your own industry average.",
  },
  {
    icon: "groups",
    title: "Team Collaboration",
    description:
      "Share briefs across your studio with role-based permissions, team workspaces, and invite-based access control.",
  },
];

export default function FeaturesGrid() {
  return (
    <section className="bg-surface py-12 md:py-16">
      <div className="container mx-auto px-margin-mobile md:px-margin-desktop max-w-container-max">
        <div className="mb-stack-md text-center">
          <h2 className="font-headline-lg text-headline-lg mb-4 text-on-background">
            Everything you need to brief like a pro
          </h2>
          <p className="text-body-lg text-on-surface-variant">
            One tool, end-to-end — from the first client email to a fully scoped, signed-off brief.
          </p>
          <p className="mt-4 text-sm text-on-surface-variant flex items-center justify-center gap-2">
            <Icon name="psychology" className="text-[18px] text-primary shrink-0" />
            Unlike ChatGPT, BriefFill scores every brief against a consistent 12-field framework designed by senior creatives — not a generic prompt.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={`bento-card flex flex-col rounded-2xl border p-8 transition-all duration-300 hover:border-primary/40 ${
                f.core
                  ? "md:col-span-2 lg:col-span-1 border-primary/40 bg-primary-container/5 shadow-md"
                  : "border-outline-variant bg-surface-container-lowest"
              }`}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
                  <Icon name={f.icon} className="text-[28px]" />
                </div>
                {f.core && (
                  <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-on-primary">Core feature</span>
                )}
              </div>
              <h3 className="font-headline-md text-headline-md mb-3 text-on-background">{f.title}</h3>
              <p className="text-on-surface-variant">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
