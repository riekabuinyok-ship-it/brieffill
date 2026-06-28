import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import { LogoIcon } from "../components/Logo";
import Button from "../components/Button";
import Footer from "../components/Footer";
import TrustedLogos from "../components/TrustedLogos";
import FeaturesGrid from "../components/FeaturesGrid";
import Integrations from "../components/Integrations";
import Testimonials from "../components/Testimonials";
import UseCases from "../components/UseCases";
import StatsBand from "../components/StatsBand";
import FinalCTA from "../components/FinalCTA";
import FAQ from "../components/FAQ";
import { HeroDocumentIllustration } from "../components/illustrations/DocAnalyzeIllustration";

const steps = [
  { num: "01", title: "Paste your brief", desc: "Drop your client's messy email, PDF, or document link into our secure analyzer. We support any text format.", icon: "content_paste", color: "primary" },
  { num: "02", title: "AI analyzes for gaps", desc: "Our engine scans for missing budget details, timeline ambiguities, technical constraints, and hidden risks.", icon: "psychology", color: "secondary" },
  { num: "03", title: "Generate questions", desc: "Receive a curated list of clarification questions to send back to the client. Professional, surgical, and effective.", icon: "contact_support", color: "primary" },
];

const afterContent = (
  <div className="space-y-stack-md">
    <div className="rounded-xl border-l-4 border-error bg-error-container/30 p-stack-md">
      <h4 className="mb-1 text-sm font-bold uppercase text-on-error-container">Critical Missing Data</h4>
      <p className="font-body-md font-medium text-on-surface">The client hasn't specified the hosting environment. This impacts tech stack decisions.</p>
    </div>
    <div className="rounded-xl border-l-4 border-primary bg-primary-container/10 p-stack-md">
      <h4 className="mb-1 text-sm font-bold uppercase text-primary">Generated Question</h4>
      <p className="font-body-md italic text-on-surface">"Could you clarify if the existing AWS infrastructure must be used, or are we free to propose a headless architecture?"</p>
    </div>
    <div className="rounded-xl border-l-4 border-secondary bg-secondary-container/10 p-stack-md">
      <h4 className="mb-1 text-sm font-bold uppercase text-secondary">Strategic Insight</h4>
      <p className="font-body-md font-medium text-on-surface">Budget mention of $50k is 20% lower than previous similar projects for this scope.</p>
    </div>
  </div>
);

const beforeContent = (
  <div className="space-y-stack-md">
    <div className="rounded-xl border border-outline-variant bg-surface-container-low p-stack-md">
      <p className="font-body-md text-on-surface-variant">"Hey team, we need a simple website for our new product launch next month. Budget is around $50k. Needs to be clean and modern. Let's chat Monday."</p>
    </div>
    <div className="flex gap-3 rounded-xl border border-error/30 bg-error/10 p-stack-md">
      <Icon name="warning" className="text-error" />
      <p className="font-medium text-error">You have 0% visibility into technical requirements or success metrics.</p>
    </div>
  </div>
);

export default function Landing() {
  const [showAfter, setShowAfter] = useState(true);

  return (
    <div className="bg-background text-on-background font-body-md">
      {/* Hero */}
      <section className="relative overflow-hidden bg-surface py-8 md:py-12">
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-container rounded-full blur-[120px]" />
          <div className="absolute top-1/2 -right-24 w-80 h-80 bg-secondary-container rounded-full blur-[100px]" />
        </div>
        <div className="container mx-auto px-margin-mobile md:px-margin-desktop relative z-10 max-w-container-max">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              <span className="mb-8 inline-flex items-center gap-2 rounded-full bg-primary-fixed px-4 py-1.5 font-label-sm text-label-sm text-on-primary-fixed animate-pulse">
                <Icon name="bolt" className="text-[16px]" /> AI-POWERED ANALYSIS ENGINE
              </span>
              <h1 className="font-display text-display text-on-background leading-tight mb-6">
                Never start a project <br className="hidden md:block" /> <span className="italic text-primary">blind</span> again.
              </h1>
              <p className="text-body-lg text-body-lg text-on-surface-variant max-w-2xl mb-10">
                Stop guessing client expectations. BriefFill analyzes your project briefs instantly, highlighting gaps, risks, and missing data before you even send a quote.
              </p>
              <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
                <Button as="a" to="/register" size="lg" iconRight="arrow_forward">
                  Start Analyzing Your First Brief
                </Button>
                <Button as="a" variant="outline" size="lg" to="/sample-report">View Sample Report</Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                <HeroDocumentIllustration />
              </div>
              <img
                src="/hero.png"
                alt="BriefFill dashboard preview showing score timeline and AI clarification questions"
                className="w-full rounded-2xl border border-outline-variant shadow-2xl relative z-10"
                loading="eager"
                width="1146"
                height="640"
              />
            </div>
          </div>
          <div className="mx-auto mt-16 grid w-full max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
            {[{ n: "98%", l: "Gap detection accuracy" }, { n: "< 30s", l: "Average analysis time" }, { n: "2.4x", l: "Faster project onboarding" }].map((s) => (
              <div key={s.l} className="flex flex-col items-center rounded-2xl border border-white/20 bg-white/50 p-6 shadow-sm backdrop-blur-sm">
                <span className="font-display text-headline-md text-primary mb-1">{s.n}</span>
                <p className="font-medium text-on-surface-variant">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <FeaturesGrid />

      {/* How It Works */}
      <section className="bg-background py-12 md:py-16" id="how-it-works">
        <div className="container mx-auto px-margin-mobile md:px-margin-desktop max-w-container-max">
          <div className="mb-stack-md text-center">
            <h2 className="font-headline-lg text-headline-lg mb-4">From Chaos to Clarity</h2>
            <p className="text-body-lg text-on-surface-variant">Three steps to a bulletproof project foundation.</p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:gap-12 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.num} className="bento-card group flex flex-col rounded-3xl border border-outline-variant bg-surface p-8 transition-all duration-300 hover:border-primary/30">
                <div className={`mb-8 flex h-14 w-14 items-center justify-center rounded-2xl ${s.color === "secondary" ? "bg-secondary text-white" : "bg-primary-container text-white"} group-hover:scale-110 transition-transform`}>
                  <Icon name={s.icon} className="text-[32px]" />
                </div>
                <span className="font-label-sm text-label-sm uppercase text-primary mb-2">STEP {s.num}</span>
                <h3 className="font-headline-md text-headline-md mb-4">{s.title}</h3>
                <p className="text-on-surface-variant mb-6">{s.desc}</p>
                <div className="mt-auto pt-4 flex items-center gap-2 font-semibold text-primary">
                  Learn more <Icon name="arrow_forward" className="text-[18px]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <Integrations />

      {/* Before vs After */}
      <section className="bg-surface-container-low py-12 md:py-16 overflow-hidden" id="comparison">
        <div className="container mx-auto px-margin-mobile md:px-margin-desktop max-w-container-max">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <div>
              <h2 className="font-headline-lg text-headline-lg mb-6">Stop missing the fine print</h2>
              <p className="text-body-lg text-on-surface-variant mb-8">
                A typical project brief contains only 65% of the information needed to actually start work. We find the remaining 35% before it costs you money.
              </p>
              <ul className="space-y-stack-md">
                <li className="flex items-start gap-3"><Icon name="cancel" className="mt-1 text-error" /><span className="text-on-surface">Undefined scope leading to creep</span></li>
                <li className="flex items-start gap-3"><Icon name="cancel" className="mt-1 text-error" /><span className="text-on-surface">Vague timelines causing bottlenecks</span></li>
                <li className="flex items-start gap-3"><Icon name="check_circle" filled className="mt-1 text-primary" /><span className="font-semibold text-on-surface">Crystal clear project milestones</span></li>
              </ul>
            </div>
            <div className="relative">
              <div className="overflow-hidden rounded-3xl border border-outline-variant bg-white shadow-2xl">
                <div className="flex border-b border-outline-variant">
                  <button onClick={() => setShowAfter(false)}
                    className={`flex-1 py-4 font-bold transition-all border-b-2 ${
                      showAfter ? "border-transparent text-on-surface-variant" : "border-primary bg-primary-container/10 text-primary"
                    }`}>
                    BEFORE
                  </button>
                  <button onClick={() => setShowAfter(true)}
                    className={`flex-1 py-4 font-bold transition-all border-b-2 ${
                      showAfter ? "border-primary bg-primary-container/10 text-primary" : "border-transparent text-on-surface-variant"
                    }`}>
                    AFTER
                  </button>
                </div>
                <div className="min-h-[400px] p-8 transition-all duration-500">
                  {showAfter ? afterContent : beforeContent}
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 brand-gradient rounded-full blur-3xl opacity-40" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* Trusted by */}
      <TrustedLogos />

      {/* Use cases */}
      <UseCases />

      {/* Pricing */}
      <section className="bg-background py-12 md:py-16" id="pricing">
        <div className="container mx-auto px-margin-mobile md:px-margin-desktop max-w-container-max">
          <div className="mb-stack-md text-center">
            <h2 className="font-headline-lg text-headline-lg mb-4">Simple, Fair Pricing</h2>
            <p className="text-body-lg text-on-surface-variant">No hidden fees. Start for free and upgrade as you grow. 20% off annual.</p>
            <div className="mt-4">
              <Link to="/pricing" className="text-sm font-semibold text-primary hover:underline">Compare all features on the full Pricing page &rarr;</Link>
            </div>
          </div>
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Free */}
            <div className="flex flex-col rounded-[24px] border border-outline-variant bg-surface p-8">
              <div className="mb-6">
                <h3 className="font-headline-md text-headline-md mb-2">Free</h3>
                <p className="text-sm text-on-surface-variant">Try BriefFill on your next project.</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-on-background">$0</span>
                <span className="text-on-surface-variant">/month</span>
              </div>
              <ul className="mb-8 flex-1 space-y-stack-sm text-sm text-on-surface">
                {["5 briefs / month", "1 user", "12-field analysis", "Email draft generation"].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Icon name="check" className="mt-0.5 flex-shrink-0 text-[18px] text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="block w-full rounded-xl border border-primary py-3 text-center text-sm font-bold text-primary hover:bg-primary-container/5">
                Get started
              </Link>
            </div>

            {/* Pro */}
            <div className="flex flex-col rounded-[24px] border-2 border-primary bg-surface p-8 shadow-xl relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wider text-on-primary">Most popular</div>
              <div className="mb-6">
                <h3 className="font-headline-md text-headline-md mb-2">Pro</h3>
                <p className="text-sm text-on-surface-variant">For freelancers and solo creatives.</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-on-background">$19</span>
                <span className="text-on-surface-variant">/month</span>
                <p className="mt-1 text-xs text-on-surface-variant">$182/yr — save 20%</p>
              </div>
              <ul className="mb-8 flex-1 space-y-stack-sm text-sm text-on-surface">
                {["Unlimited briefs", "Brief Builder (AI rewrite)", "PDF + clipboard export", "12-field analysis", "Outcome tracking"].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Icon name="check" className="mt-0.5 flex-shrink-0 text-[18px] text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/pricing" className="block w-full rounded-xl bg-primary py-3 text-center text-sm font-bold text-on-primary hover:bg-primary/90">
                Choose Pro
              </Link>
            </div>

            {/* Team */}
            <div className="flex flex-col rounded-[24px] border border-outline-variant bg-surface p-8">
              <div className="mb-6">
                <h3 className="font-headline-md text-headline-md mb-2">Team</h3>
                <p className="text-sm text-on-surface-variant">For small agencies. 5 seats.</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-on-background">$49</span>
                <span className="text-on-surface-variant">/month</span>
                <p className="mt-1 text-xs text-on-surface-variant">$470/yr — save 20%</p>
              </div>
              <ul className="mb-8 flex-1 space-y-stack-sm text-sm text-on-surface">
                {["Unlimited briefs", "5 team members", "Team collaboration", "Notion + Google Docs export", "All Pro features"].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Icon name="check" className="mt-0.5 flex-shrink-0 text-[18px] text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/pricing" className="block w-full rounded-xl border border-primary py-3 text-center text-sm font-bold text-primary hover:bg-primary-container/5">
                Choose Team
              </Link>
            </div>

            {/* Agency */}
            <div className="flex flex-col rounded-[24px] border border-outline-variant bg-surface p-8">
              <div className="mb-6">
                <h3 className="font-headline-md text-headline-md mb-2">Agency</h3>
                <p className="text-sm text-on-surface-variant">For agencies at scale. 15 seats.</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-on-background">$99</span>
                <span className="text-on-surface-variant">/month</span>
                <p className="mt-1 text-xs text-on-surface-variant">$950/yr — save 20%</p>
              </div>
              <ul className="mb-8 flex-1 space-y-stack-sm text-sm text-on-surface">
                {["Unlimited briefs", "15 team members", "Competitor analysis", "API access (REST + webhooks)", "PDF + clipboard export", "Priority support"].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Icon name="check" className="mt-0.5 flex-shrink-0 text-[18px] text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/pricing" className="block w-full rounded-xl border border-primary py-3 text-center text-sm font-bold text-primary hover:bg-primary-container/5">
                Choose Agency
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <FinalCTA />

      {/* FAQ */}
      <FAQ />

      {/* Stats band */}
      <StatsBand />

      {/* Footer */}
      <Footer />
    </div>
  );
}
