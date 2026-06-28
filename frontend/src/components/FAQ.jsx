const FAQ_ITEMS = [
  {
    q: "Is my brief data private?",
    a: "Yes — we never train on your data, and briefs are encrypted at rest. Only you can see your briefs. Team and Agency plans let you share briefs with collaborators you explicitly invite.",
  },
  {
    q: "What happens to my briefs after the trial ends?",
    a: "They stay in your account indefinitely. You can still view and export them on the Free plan — you just can't run new analyses or generate new clarification emails.",
  },
  {
    q: "How is this different from just using ChatGPT?",
    a: "BriefFill uses a 12-field framework designed by senior creatives, not a generic prompt. You get consistent scoring, industry benchmarks, and a trackable history across briefs — none of which ChatGPT provides out of the box.",
  },
  {
    q: "How accurate is the gap detection?",
    a: "In testing, BriefFill identifies missing fields with 98% accuracy on briefs longer than 200 words. The 12-field framework covers the fields agencies actually scope against, so what you get is decision-ready, not a generic summary.",
  },
  {
    q: "Can I use BriefFill with my team?",
    a: "Yes — Team and Agency plans include shared briefs, role-based permissions, and inline comments. Solo plans can be upgraded at any time without losing history.",
  },
  {
    q: "Do you support briefs in languages other than English?",
    a: "Yes — the analysis engine is multilingual. BriefFill works with briefs in English, Spanish, French, German, Portuguese, and Italian out of the box, with more languages on the roadmap.",
  },
  {
    q: "Can I integrate BriefFill with my existing tools?",
    a: "Yes — Pro+ plans export to Notion, Google Docs, ClickUp, and Airtable. Agency plans also include a REST API + webhooks, so you can pipe analyses into your own CRM, project management tool, or internal dashboard.",
  },
  {
    q: "Is there a free trial for paid plans?",
    a: "Yes — every paid plan starts with a 7-day free trial. Cancel anytime, no credit-card commitment, and your briefs stay accessible on the Free plan after the trial ends.",
  },
];

export default function FAQ() {
  return (
    <section className="bg-background py-12 md:py-16" id="faq">
      <div className="container mx-auto px-margin-mobile md:px-margin-desktop max-w-container-max">
        <div className="mb-stack-md text-center">
          <h2 className="font-headline-lg text-headline-lg mb-4 text-on-background">
            Frequently asked questions
          </h2>
          <p className="text-body-lg text-on-surface-variant">
            Everything you need to know before you start.
          </p>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">
          {FAQ_ITEMS.map((f, i) => (
            <details
              key={i}
              className="group rounded-2xl border border-outline-variant bg-surface-container-lowest p-stack-md transition-all open:bg-surface-container-low"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-on-background">
                <span>{f.q}</span>
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container transition-transform group-open:rotate-45">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
                    <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <p className="mt-3 text-sm text-on-surface-variant">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
