import { Link } from "react-router-dom";
import Icon from "../components/Icon";

const features = [
  {
    icon: "psychology",
    title: "AI Brief Analysis",
    description: "Our AI analyzes your client's brief against 12 critical fields in seconds, scoring completeness and identifying gaps.",
    items: [
      "Scans for 12 critical fields across every brief",
      "Calculates completeness score (0–100%)",
      "Flags what's present, partial, or missing",
      "Generates tailored clarification questions",
    ],
  },
  {
    icon: "folder_open",
    title: "42+ Professional Templates",
    description: "Jump-start any project with a library of pre-built templates designed for every industry and use case.",
    items: [
      "42+ industry-specific templates",
      "Creative, digital, branding, and more",
      "Custom template creation",
      "Save your own templates for reuse",
    ],
  },
  {
    icon: "edit",
    title: "Brief Builder",
    description: "Take a vague or thin brief and turn it into a fully scoped, actionable project brief your whole team can work from.",
    items: [
      "AI-powered brief rewriting",
      "Fill gaps intelligently",
      "Keep it scoped and quote-ready",
      "Export in multiple formats",
    ],
  },
  {
    icon: "mail",
    title: "Email Generation",
    description: "Generate polished, professional clarification emails from the AI's questions — ready to send in one click.",
    items: [
      "One-click email draft generation",
      "Copy to clipboard instantly",
      "Export as PDF for records",
      "Send directly in Gmail",
    ],
  },
  {
    icon: "group",
    title: "Team Collaboration",
    description: "Share briefs, notes, and analysis across your team with role-based permissions and shared workspaces.",
    items: [
      "Role-based access (admin, editor, viewer)",
      "Shared team workspaces",
      "Real-time collaboration",
      "Activity tracking and audit logs",
    ],
  },
  {
    icon: "public",
    title: "Collaboration Portal",
    description: "Invite clients to a branded portal where they can submit briefs, answer questions, and track progress.",
    items: [
      "Branded client portal",
      "Secure brief submission",
      "Client Q&A workflows",
      "Status tracking for both sides",
    ],
  },
  {
    icon: "bar_chart",
    title: "Dashboard & Analytics",
    description: "Get a bird's-eye view of all your projects with real-time analytics, score tracking, and performance benchmarks.",
    items: [
      "Central project dashboard",
      "Brief quality score trends",
      "Team performance metrics",
      "Exportable reports",
    ],
  },
  {
    icon: "shield",
    title: "Security & Privacy",
    description: "Your data is encrypted end-to-end with enterprise-grade security. SOC 2 compliant and GDPR ready.",
    items: [
      "End-to-end encryption",
      "SOC 2 compliance",
      "GDPR ready",
      "Role-based access control",
    ],
  },
];

const trustBadges = [
  { icon: "verified", text: "14-Day Money-Back Guarantee" },
  { icon: "credit_card", text: "No Credit Card Required" },
  { icon: "cancel", text: "Cancel Anytime" },
];

export default function Features() {
  return (
    <div className="bg-background min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Icon name="auto_awesome" className="text-white !text-3xl" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            🚀 Features
          </h1>
          <p className="text-xl text-indigo-100 max-w-2xl mx-auto mb-8">
            Everything you need to start every project with absolute clarity.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:shadow-lg transition"
          >
            Start Free Trial
            <Icon name="arrow_forward" className="!text-lg" />
          </Link>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-indigo-200 text-sm">
            <span className="flex items-center gap-1">
              <Icon name="verified" className="!text-base" />
              14-Day Money-Back Guarantee
            </span>
            <span className="w-px h-4 bg-indigo-400/30" />
            <span>No credit card required</span>
            <span className="w-px h-4 bg-indigo-400/30" />
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl p-6 border border-outline-variant shadow-sm hover:shadow-md transition"
            >
              <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center mb-4">
                <Icon name={f.icon} className="text-[24px] text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-on-surface mb-2">{f.title}</h3>
              <p className="text-sm text-on-surface-variant mb-4">{f.description}</p>
              <ul className="space-y-1.5">
                {f.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-on-surface-variant">
                    <Icon name="check" className="!text-base text-green-500 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="bg-surface-container-low py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {trustBadges.map((b) => (
              <div key={b.text} className="bg-white rounded-xl p-6 text-center border border-outline-variant">
                <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Icon name={b.icon} className="text-[24px] text-primary" />
                </div>
                <p className="text-sm font-medium text-on-surface">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to start with clarity?</h2>
          <p className="text-indigo-100 mb-8">No credit card required — start your free trial today.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:shadow-lg transition"
            >
              Start Free Trial
              <Icon name="arrow_forward" className="!text-lg" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition"
            >
              View Pricing
              <Icon name="arrow_forward" className="!text-lg" />
            </Link>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-indigo-200 text-sm">
            <Icon name="verified" className="!text-base" />
            14-Day Money-Back Guarantee
          </div>
        </div>
      </div>
    </div>
  );
}
