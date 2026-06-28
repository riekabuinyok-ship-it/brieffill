import Icon from "../components/Icon";
import Button from "../components/Button";
import Footer from "../components/Footer";

const team = [
  {
    name: "Alex Chen",
    role: "CEO & Co-Founder",
    famous: "Building the vision from day one",
    bio: "15 years in agency operations. Alex saw first-hand how unclear briefs cost agencies millions in scope creep. Built BriefFill to fix it.",
    image: "/Alex.jpg",
    social: { linkedin: "#", twitter: "#", github: "#" },
  },
  {
    name: "Maya Patel",
    role: "CTO & Co-Founder",
    famous: "Architecting the AI engine",
    bio: "Former ML engineer at Google. Maya designed BriefFill's gap-detection models that achieve 98% accuracy across 40+ project types.",
    image: "/Maya-p.jpg",
    social: { linkedin: "#", twitter: "#", github: "#" },
  },
  {
    name: "Jordan Kim",
    role: "Head of Product",
    famous: "Designing the experience",
    bio: "Product leader who shaped tools used by 50k+ freelancers. Jordan obsesses over every click, reducing analysis time from minutes to seconds.",
    image: "/Jordan.jpg",
    social: { linkedin: "#", twitter: "#", github: "#" },
  },
  {
    name: "Sam Rivera",
    role: "Lead Engineer",
    famous: "Shipping quality code",
    bio: "Full-stack engineer with a passion for performance. Sam built the real-time analysis pipeline that processes briefs in under 30 seconds.",
    image: "/Sam.jpg",
    social: { linkedin: "#", twitter: "#", github: "#" },
  },
  {
    name: "Priya Sharma",
    role: "Head of Design",
    famous: "Crafting the look & feel",
    bio: "Designer who believes clarity is beautiful. Priya shapes every pixel of BriefFill's interface, making complex data feel approachable.",
    image: "/Priya.jpg",
    social: { linkedin: "#", twitter: "#", github: "#" },
  },
  {
    name: "Taylor Brooks",
    role: "Head of Growth",
    famous: "Driving adoption",
    bio: "Growth strategist who scaled three startups to 6-figure ARR. Taylor turns brief-clarity into a movement that agencies can't ignore.",
    image: "/Taylor.jpg",
    social: { linkedin: "#", twitter: "#", github: "#" },
  },
];

export default function Team() {
  return (
    <div className="bg-background text-on-background font-body-md">

      <section className="relative overflow-hidden bg-surface py-8 md:py-12">
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-container rounded-full blur-[120px]" />
          <div className="absolute top-1/2 -right-24 w-80 h-80 bg-secondary-container rounded-full blur-[100px]" />
        </div>
        <div className="container mx-auto px-margin-mobile md:px-margin-desktop relative z-10 max-w-container-max text-center">
          <span className="mb-8 inline-flex items-center gap-2 rounded-full bg-primary-fixed px-4 py-1.5 font-label-sm text-label-sm text-on-primary-fixed">
            <Icon name="groups" className="text-[16px]" /> THE TEAM
          </span>
          <h1 className="font-display text-display text-on-background leading-tight mb-6">
            Meet the people behind <span className="italic text-primary">BriefFill</span>
          </h1>
          <p className="text-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-10">
            A small team with a big mission: make every project start with absolute clarity.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button as="a" to="/register" size="lg" iconRight="arrow_forward">
              Start Building Better Briefs
            </Button>
            <Button as="a" variant="outline" size="lg" to="/values">Our Values</Button>
          </div>
        </div>
      </section>

      <section className="bg-background py-12 md:py-16" id="team-grid">
        <div className="container mx-auto px-margin-mobile md:px-margin-desktop max-w-container-max">
          <div className="text-center mb-stack-md">
            <h2 className="font-headline-lg text-headline-lg mb-4">The people powering the platform</h2>
            <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              Diverse backgrounds, one shared obsession with project clarity.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {team.map((m) => (
              <div key={m.name} className="group relative rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1">
                <div className="mb-4 flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl overflow-hidden shadow-md flex-shrink-0">
                    <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-headline-md text-headline-md font-bold truncate">{m.name}</h3>
                    <p className="text-sm font-medium text-primary">{m.role}</p>
                  </div>
                </div>
                <div className="mb-3 flex items-center gap-1.5">
                  <Icon name="emoji_objects" className="text-[16px] text-secondary flex-shrink-0" />
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{m.famous}</span>
                </div>
                <p className="text-body-md text-on-surface-variant">{m.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-container-low py-12 md:py-16" id="values">
        <div className="container mx-auto px-margin-mobile md:px-margin-desktop max-w-container-max">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <div>
              <h2 className="font-headline-lg text-headline-lg mb-6">Built through collaboration</h2>
              <p className="text-body-lg text-on-surface-variant mb-8">
                We don't just build software — we live the process our customers use every day. Every feature starts with a brief, gets stress-tested by the team, and ships only when it brings clarity.
              </p>
              <ul className="space-y-stack-md">
                <li className="flex items-start gap-3">
                  <Icon name="sync_alt" className="mt-1 text-primary" />
                  <div><span className="font-semibold text-on-surface">Cross-functional squads</span><p className="text-sm text-on-surface-variant">Engineers, designers, and product thinkers in every discussion.</p></div>
                </li>
                <li className="flex items-start gap-3">
                  <Icon name="speed" className="mt-1 text-primary" />
                  <div><span className="font-semibold text-on-surface">Ship fast, iterate</span><p className="text-sm text-on-surface-variant">Weekly releases shaped by real user feedback, not guesswork.</p></div>
                </li>
                <li className="flex items-start gap-3">
                  <Icon name="lightbulb" className="mt-1 text-primary" />
                  <div><span className="font-semibold text-on-surface">Radical transparency</span><p className="text-sm text-on-surface-variant">Every decision, roadmap item, and metric is open to the whole team.</p></div>
                </li>
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: "groups", stat: "6", label: "Team members", color: "primary" },
                { icon: "calendar_month", stat: "3 yrs", label: "Building together", color: "secondary" },
                { icon: "business", stat: "1,000+", label: "Agencies powered", color: "primary" },
                { icon: "checklist", stat: "98%", label: "Gap detection", color: "secondary" },
              ].map((c) => (
                <div key={c.label} className="rounded-2xl border border-outline-variant bg-surface p-5 text-center transition-all duration-300 hover:border-primary/30 hover:shadow-md">
                  <Icon name={c.icon} className={`text-[28px] mb-2 text-${c.color}`} />
                  <p className="font-display text-headline-md font-bold text-primary">{c.stat}</p>
                  <p className="text-sm text-on-surface-variant">{c.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-primary py-stack-lg text-on-primary">
        <div className="container mx-auto px-margin-mobile md:px-margin-desktop max-w-container-max">
          <div className="grid grid-cols-2 gap-stack-md md:grid-cols-4">
            {[
              { value: "6", label: "Team members" },
              { value: "3 yrs", label: "Building together" },
              { value: "1,000+", label: "Agencies powered" },
              { value: "98%", label: "Gap detection accuracy" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-display-md mb-1 font-bold leading-none">{s.value}</p>
                <p className="text-sm font-medium opacity-90">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background py-12 md:py-16">
        <div className="container mx-auto px-margin-mobile md:px-margin-desktop max-w-container-max text-center">
          <h2 className="font-headline-lg text-headline-lg mb-4">Ready to build better briefs?</h2>
          <p className="text-body-lg text-on-surface-variant max-w-xl mx-auto mb-8">
            Join thousands of professionals who start every project with clarity.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button as="a" to="/register" size="lg" iconRight="arrow_forward">
              Start Free Trial
            </Button>
            <Button as="a" variant="outline" size="lg" to="/pricing">
              View Pricing
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
