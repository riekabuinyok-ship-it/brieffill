import Icon from "./Icon";

const FEATURES = [
  {
    icon: "psychology",
    title: "12-field analysis",
    description:
      "Every brief is scored across the 12 fields agencies rely on: budget, timeline, audience, deliverables, brand voice, and more.",
  },
  {
    icon: "contact_support",
    title: "AI Clarification Questions",
    description:
      "Get a curated list of surgical, professional questions to send back to your client — no more 'TBD' or 'to be discussed'.",
  },
  {
    icon: "auto_awesome",
    title: "Brief Builder (AI rewrite)",
    description:
      "Take a thin or vague brief and BriefFill rewrites it into a complete, scoped brief ready to quote against.",
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
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bento-card flex flex-col rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 transition-all duration-300 hover:border-primary/40"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
                <Icon name={f.icon} className="text-[28px]" />
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
