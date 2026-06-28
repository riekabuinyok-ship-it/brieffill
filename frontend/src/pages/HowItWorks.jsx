import { Link } from "react-router-dom";
import Icon from "../components/Icon";

const steps = [
  {
    icon: "description",
    title: "Paste Your Brief",
    description: "Start with your client's brief — paste it, upload a file, or choose a template.",
    emoji: "📝",
    color: "indigo",
    details: [
      "Paste text directly into the editor",
      "Upload .docx, .pdf, or .txt files",
      "Choose from 42+ professional templates",
      "Edit and refine before analysis",
    ],
  },
  {
    icon: "auto_awesome",
    title: "AI Analysis",
    description: "Our AI analyzes your brief against 12 critical fields in under 30 seconds.",
    emoji: "🤖",
    color: "purple",
    details: [
      "Scans for 12 critical fields",
      "Identifies what's present, partial, or missing",
      "Calculates completeness score (0-100%)",
      "Generates specific, tailored questions",
    ],
  },
  {
    icon: "contact_support",
    title: "Get Your Brief and Questions",
    description: "Review the analysis and get specific, actionable questions to ask your client.",
    emoji: "📋",
    color: "green",
    details: [
      "Review field-by-field breakdown",
      "Copy AI-generated questions",
      "Generate professional email draft",
      "Export to PDF, Google Docs, or Notion",
    ],
  },
];

const benefits = [
  { icon: "timer", title: "Save Time", desc: "No more endless back-and-forth emails" },
  { icon: "target", title: "98% Gap Detection", desc: "AI identifies what's missing" },
  { icon: "bolt", title: "<30s Analysis", desc: "Instant results, no waiting" },
  { icon: "trending_up", title: "2.4x Faster", desc: "Get projects off the ground quicker" },
];

const audiences = [
  { icon: "person", title: "Freelancers", desc: "Save hours on client emails and deliver better work faster." },
  { icon: "business_center", title: "Agencies", desc: "Streamline workflows and keep your entire team aligned." },
  { icon: "assignment", title: "Project Managers", desc: "Align teams and clients with clear, complete briefs." },
];

export default function HowItWorks() {
  return (
    <div className="bg-background min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">How BriefFill Works</h1>
          <p className="text-xl text-indigo-100 max-w-2xl mx-auto mb-8">
            From vague brief to complete clarity in 3 simple steps.
          </p>
          <Link to="/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:shadow-lg transition">
            Start Your Free Trial
            <Icon name="arrow_forward" className="text-[18px]" />
          </Link>
        </div>
      </div>

      {/* Steps */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="space-y-16">
          {steps.map((step, i) => (
            <div key={step.title} className={`flex flex-col ${i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"} gap-8 items-center`}>
              <div className={`flex-1 ${i % 2 === 1 ? "md:text-right" : ""}`}>
                <div className="inline-flex items-center gap-2 bg-surface-container rounded-full px-4 py-1.5 text-sm font-medium text-on-surface mb-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  Step {i + 1}
                </div>
                <h2 className="text-2xl font-bold text-on-surface mb-2">{step.title}</h2>
                <p className="text-on-surface-variant mb-4">{step.description}</p>
                <ul className="space-y-2">
                  {step.details.map((d) => (
                    <li key={d} className="flex items-center gap-2 text-on-surface-variant">
                      <Icon name="check_circle" filled className="text-[16px] text-green-500 shrink-0" />
                      <span className="text-sm">{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="w-48 h-48 rounded-2xl bg-primary/5 flex items-center justify-center text-7xl">
                  {step.emoji}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-surface-container-low py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-center text-on-surface mb-4">Why BriefFill?</h2>
          <p className="text-center text-on-surface-variant mb-12 max-w-2xl mx-auto">Get your projects started with clarity and confidence.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="bg-white rounded-xl p-6 text-center border border-outline-variant hover:shadow-md transition">
                <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Icon name={b.icon} className="text-[24px] text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-on-surface">{b.title}</h3>
                <p className="text-sm text-on-surface-variant mt-1">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Who Benefits */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-on-surface mb-4">Who Benefits from BriefFill?</h2>
        <p className="text-center text-on-surface-variant mb-12 max-w-2xl mx-auto">Perfect for professionals who want to start every project with clarity.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {audiences.map((a, i) => (
            <div key={a.title} className={`bg-white rounded-xl p-6 text-center border ${i === 1 ? "border-primary/30 shadow-sm shadow-primary/5" : "border-outline-variant"} shadow-sm`}>
              <div className="w-14 h-14 bg-primary/5 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Icon name={a.icon} className="text-[28px] text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-on-surface">{a.title}</h3>
              <p className="text-sm text-on-surface-variant mt-2">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-surface-container-low py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex justify-center text-yellow-400 text-2xl mb-4">{"⭐".repeat(5)}</div>
          <p className="text-xl text-on-surface italic mb-4">
            &ldquo;BriefFill saved me 10 hours a week on client briefs. The AI questions are specific and actually helpful.&rdquo;
          </p>
          <p className="text-sm text-on-surface-variant">&mdash; Creative Agency, UK</p>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to start with clarity?</h2>
          <p className="text-indigo-100 mb-8">No credit card required. Get started today.</p>
          <Link to="/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:shadow-lg transition">
            Start Your Free Trial
            <Icon name="arrow_forward" className="text-[18px]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
