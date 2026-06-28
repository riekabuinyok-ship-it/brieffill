const INTEGRATIONS = [
  {
    name: "Notion",
    logo: "/Notion.png",
    tagline: "Send briefs straight to your Notion workspace",
  },
  {
    name: "Google Docs",
    logo: "/Google-Docs.png",
    tagline: "Export polished docs in one click",
  },
  {
    name: "ClickUp",
    logo: "/ClickUp.png",
    tagline: "Push briefs to any ClickUp list",
  },
  {
    name: "Airtable",
    logo: "/Airtable.png",
    tagline: "Sync briefs to your Airtable base",
  },
  {
    name: "Gmail",
    logo: "/Gmail.png",
    tagline: "Generate the clarification email ready to send",
  },
];

export default function Integrations() {
  return (
    <section className="bg-surface-container-low py-12 md:py-16">
      <div className="container mx-auto px-margin-mobile md:px-margin-desktop max-w-container-max">
        <div className="mb-stack-md text-center">
          <h2 className="font-headline-lg text-headline-lg mb-4 text-on-background">
            Works with the tools you already use
          </h2>
          <p className="text-body-lg text-on-surface-variant">
            BriefFill plugs into your existing stack — no new tab, no copy-paste, no reformatting.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {INTEGRATIONS.map((i) => (
            <div
              key={i.name}
              className="bento-card flex flex-col items-center rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 text-center transition-all duration-300 hover:border-primary/40"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container">
                <img src={i.logo} alt={i.name} className="w-8 h-8 object-contain" />
              </div>
              <h3 className="font-headline-md text-headline-md mb-2 text-on-background">{i.name}</h3>
              <p className="text-sm text-on-surface-variant">{i.tagline}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
