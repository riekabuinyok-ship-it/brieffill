function StarRow() {
  return (
    <div className="mb-3 flex gap-0.5 text-[#F5A623]" aria-label="5 out of 5 stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
          <path d="M10 1.5l2.6 5.5 6 .9-4.3 4.1 1 6L10 15.1 4.7 18l1-6L1.4 7.9l6-.9L10 1.5z" />
        </svg>
      ))}
    </div>
  );
}

const TESTIMONIALS = [
  {
    name: "Maya R.",
    role: "Brand Strategist · Stellar Studio",
    image: "/Maya.jpg",
    quote:
      "BriefFill caught 4 missing fields in a brief I would have otherwise quoted against. Saved me a week of rework.",
  },
  {
    name: "James T.",
    role: "Founder · Volt Creative",
    image: "/James.jpg",
    quote:
      "I run 3 client briefs a week. BriefFill turns a 30-minute analysis into 30 seconds.",
  },
  {
    name: "Ana L.",
    role: "Creative Director · North Studio",
    image: "/Ana.jpg",
    quote:
      "The AI rewrite feature is the closest thing to having a senior PM in the room.",
  },
];

export default function Testimonials() {
  return (
    <section className="bg-background py-12 md:py-16">
      <div className="container mx-auto px-margin-mobile md:px-margin-desktop max-w-container-max">
        <div className="mb-stack-md text-center">
          <h2 className="font-headline-lg text-headline-lg mb-4 text-on-background">
            Loved by creatives worldwide
          </h2>
          <p className="text-body-lg text-on-surface-variant">
            Hear from freelancers, founders, and agency leads using BriefFill every day.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="bento-card flex h-full flex-col rounded-2xl border border-outline-variant bg-surface-container-lowest p-8"
            >
              <StarRow />
              <p className="mb-6 flex-1 text-on-surface italic">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <img
                  src={t.image}
                  alt={t.name}
                  className="h-12 w-12 rounded-full object-cover border-2 border-outline-variant"
                  loading="lazy"
                />
                <div>
                  <p className="font-semibold text-on-background">{t.name}</p>
                  <p className="text-sm text-on-surface-variant">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
