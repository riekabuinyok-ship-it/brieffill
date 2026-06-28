import { Link } from "react-router-dom";
import Icon from "../components/Icon";

const sections = [
  {
    id: "collect",
    icon: "database",
    title: "1. Information We Collect",
    content: "We collect information to provide, improve, and protect our services.",
    subsections: [
      {
        title: "Account Information",
        items: [
          "Name, email address, and password (encrypted)",
          "Profile information (bio, company name, job title)",
          "Payment information (processed securely by Stripe)",
        ],
      },
      {
        title: "Brief Content",
        items: [
          "Client briefs you upload or create",
          "Analysis results and scores",
          "Generated questions and email drafts",
          "Templates you use or create",
        ],
      },
      {
        title: "Usage Data",
        items: [
          "Pages you visit and features you use",
          "Time spent on the platform",
          "Device and browser information",
          "IP address and approximate location",
        ],
      },
    ],
  },
  {
    id: "use",
    icon: "settings",
    title: "2. How We Use Your Information",
    content: "We use your information to provide, improve, and protect our services.",
    subsections: [
      {
        title: "To provide and improve the service",
        items: [
          "Analyze client briefs and generate questions",
          "Save and retrieve your briefs and templates",
          "Improve our AI models and features",
        ],
      },
      {
        title: "To communicate with you",
        items: [
          "Send service updates and notifications",
          "Respond to support requests",
          "Send marketing communications (with your consent)",
        ],
      },
      {
        title: "To ensure security and compliance",
        items: [
          "Detect and prevent fraud",
          "Comply with legal obligations",
          "Protect the rights and safety of users",
        ],
      },
    ],
  },
  {
    id: "share",
    icon: "share",
    title: "3. How We Share Your Information",
    content: "We share data only with essential service providers.",
    subsections: [
      { title: "AI Service Providers", items: ["Groq API — for AI analysis"] },
      { title: "Payment Processors", items: ["Stripe — for payment processing"] },
      { title: "Integrations", items: ["Google Docs API — for export", "Notion API — for export"] },
    ],
    highlights: [
      "We DO NOT sell your personal information to third parties.",
      "We DO NOT share your data with advertisers.",
      "We DO NOT use your briefs to train public AI models.",
    ],
  },
  {
    id: "security",
    icon: "lock",
    title: "4. Data Storage and Security",
    content: "We take security seriously and protect your data with industry-standard measures.",
    subsections: [
      {
        title: "Encryption",
        items: [
          "Data is encrypted at rest (AES-256) and in transit (TLS 1.3)",
          "Passwords are hashed and salted",
          "API keys are stored securely",
        ],
      },
      {
        title: "Data Retention",
        items: [
          "Active account: Data retained for the duration of your account",
          "Deleted account: Data deleted within 30 days",
          "Anonymous analytics: Retained for 12 months",
        ],
      },
    ],
  },
  {
    id: "rights",
    icon: "person",
    title: "5. Your Rights and Choices",
    content: "Under GDPR, you have the following rights:",
    items: [
      "Access your data",
      "Correct inaccurate data",
      "Delete your data",
      "Restrict processing",
      "Data portability",
      "Withdraw consent",
    ],
  },
  {
    id: "cookies",
    icon: "cookie",
    title: "6. Cookies and Tracking",
    content: "We use essential and functional cookies for:",
    items: [
      "Authentication and login",
      "Session management",
      "Preferences and settings",
      "Analytics to improve the service",
    ],
    note: "You can manage cookie preferences in your browser settings.",
  },
  {
    id: "third-party",
    icon: "open_in_new",
    title: "7. Third-Party Services",
    content: "BriefFill uses these third-party services:",
    items: [
      "Groq API — for AI analysis",
      "Stripe — for payment processing",
      "Google Cloud — for infrastructure",
      "SendGrid — for email delivery",
      "Notion API — for export functionality",
      "Google Docs API — for export functionality",
    ],
  },
  {
    id: "contact",
    icon: "mail",
    title: "8. Contact Us",
    content: "If you have questions about this Privacy Policy:",
    items: [
      "Email: privacy@brieffill.com",
      "Address: 3rd Floor, 215 Great Portland St, London W1W 5PN, United Kingdom",
      "Phone: +44 7451 294024",
    ],
  },
];

export default function Privacy() {
  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Icon name="shield" className="text-[32px] text-primary" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-on-surface">Privacy Policy</h1>
          <p className="text-on-surface-variant mt-2">Last Updated: June 26, 2026</p>
        </div>

        {/* Table of Contents */}
        <div className="bg-surface-container-low rounded-2xl p-6 mb-10 border border-outline-variant">
          <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">
            Table of Contents
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`}
                className="text-on-surface-variant hover:text-primary transition flex items-center gap-2">
                <span className="text-outline">&bull;</span>
                {s.title.replace(/^\d+\.\s*/, "")}
              </a>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {sections.map((s) => (
            <div key={s.id} id={s.id} className="scroll-mt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center shrink-0">
                  <Icon name={s.icon} className="text-[20px] text-primary" />
                </div>
                <h2 className="text-xl font-bold text-on-surface">{s.title}</h2>
              </div>
              <p className="text-on-surface-variant mb-4">{s.content}</p>

              {s.subsections && (
                <div className="space-y-4">
                  {s.subsections.map((sub, i) => (
                    <div key={i} className="bg-surface-container-low rounded-xl p-4 border border-outline-variant">
                      <h3 className="text-sm font-bold text-on-surface mb-2">{sub.title}</h3>
                      <ul className="space-y-1">
                        {sub.items.map((item, j) => (
                          <li key={j} className="text-sm text-on-surface-variant flex items-start gap-2">
                            <span className="text-primary mt-0.5">&bull;</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {s.items && !s.subsections && (
                <ul className="space-y-2 bg-surface-container-low rounded-xl p-4 border border-outline-variant">
                  {s.items.map((item, i) => (
                    <li key={i} className="text-sm text-on-surface-variant flex items-start gap-2">
                      <span className="text-primary mt-0.5">&bull;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}

              {s.highlights && (
                <div className="mt-4 bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
                  {s.highlights.map((h, i) => (
                    <p key={i} className="text-sm text-primary font-medium flex items-start gap-2">
                      <Icon name="check_circle" className="text-[16px] text-primary mt-0.5 shrink-0" />
                      {h}
                    </p>
                  ))}
                </div>
              )}

              {s.note && <p className="text-sm text-on-surface-variant mt-2">{s.note}</p>}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-outline-variant text-center">
          <p className="text-sm text-on-surface-variant">BriefFill Inc. &bull; 3rd Floor, 215 Great Portland St, London W1W 5PN, United Kingdom</p>
          <div className="flex justify-center gap-6 mt-3">
            <Link to="/privacy" className="text-sm text-outline hover:text-primary transition">Privacy</Link>
            <Link to="/referral-terms" className="text-sm text-outline hover:text-primary transition">Terms</Link>
            <Link to="/help" className="text-sm text-outline hover:text-primary transition">Help Center</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
