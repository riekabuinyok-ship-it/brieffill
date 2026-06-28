import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";

const categories = [
  { id: "getting-started", icon: "rocket_launch", name: "Getting Started", count: 8 },
  { id: "brief-analysis", icon: "description", name: "Brief Analysis", count: 10 },
  { id: "templates", icon: "folder_copy", name: "Templates", count: 6 },
  { id: "teams", icon: "group", name: "Teams & Collaboration", count: 7 },
  { id: "billing", icon: "payments", name: "Billing & Plans", count: 6 },
  { id: "account", icon: "shield", name: "Account & Security", count: 5 },
  { id: "ai-technology", icon: "auto_awesome", name: "AI & Technology", count: 4 },
];

const faqs = [
  ...(function () {
    const r = [];
    const add = (id, cat, q, a) => r.push({ id, category: cat, question: q, answer: a });
    add("what-is-brieffill", "getting-started", "What is BriefFill?", "BriefFill is an AI-powered platform that analyzes client briefs against 12 critical fields, identifies gaps, and generates specific clarifying questions. It helps freelancers, agencies, and creative professionals start every project with absolute clarity.");
    add("create-account", "getting-started", "How do I create an account?", 'Click the "Get Started" button on the homepage. Enter your email, create a password, and verify your email address. You\'ll be ready to analyze your first brief in minutes.');
    add("login", "getting-started", "How do I log in?", 'Click "Sign In" in the top right corner. Enter your email and password. If you\'ve forgotten your password, click "Forgot password" to reset it.');
    add("dashboard", "getting-started", "What is the dashboard?", "The dashboard is your central hub. It shows your stats (briefs analyzed, average score, time saved), recent briefs, and a score chart. You can access all features from here.");
    add("get-started", "getting-started", "How do I get started?", "1. Create an account\n2. Click \"New Brief\"\n3. Paste your client brief\n4. Click \"Analyze Brief\"\n5. Review the results and clarifying questions");
    add("credit-card", "getting-started", "Do I need a credit card to sign up?", "No! The Free plan includes 5 briefs/month with no credit card required. You only need to add a payment method when upgrading to a paid plan.");
    add("mobile", "getting-started", "Can I use BriefFill on mobile?", "Yes! BriefFill is fully responsive and works on all devices. You can access your dashboard, create briefs, and analyze them from your phone or tablet.");
    add("browsers", "getting-started", "What browsers are supported?", "BriefFill supports all modern browsers: Chrome, Firefox, Safari, Edge, and Opera. We recommend using the latest version for the best experience.");
    add("ai-analysis", "brief-analysis", "How does the AI analysis work?", "Our AI scans your brief against 12 critical fields (Project Overview, Target Audience, Budget, Timeline, etc.). It identifies what's present, partial, or missing, calculates a completeness score (0-100%), and generates specific clarifying questions tailored to your industry.");
    add("critical-fields", "brief-analysis", "What are the 12 critical fields?", "1. Project Overview\n2. Target Audience\n3. Core Problem\n4. Solution/Offer\n5. Key Benefits\n6. Tone of Voice\n7. Brand Guidelines\n8. Deliverables\n9. Timeline\n10. Budget\n11. Competitors\n12. Call to Action");
    add("score-calculation", "brief-analysis", "How is the completeness score calculated?", "The score is calculated based on how many of the 12 critical fields are present and how complete each field is. Each field is weighted equally. The score ranges from 0-100%:\n- 80-100%: Excellent\n- 60-79%: Good\n- 40-59%: Needs Work\n- 0-39%: Needs Brief");
    add("status-meanings", "brief-analysis", 'What does "present," "partial," and "missing" mean?', '• Present: The field is clearly defined with specific details\n• Partial: The field is mentioned but lacks important details\n• Missing: The field is not mentioned at all');
    add("accuracy", "brief-analysis", "How accurate is the AI analysis?", "BriefFill achieves 98% gap detection accuracy using Groq's Llama 3.3 70B model. The AI is trained to identify even subtle gaps in briefs.");
    add("analysis-time", "brief-analysis", "How long does the analysis take?", "Most briefs are analyzed in under 30 seconds. The analysis time depends on the length and complexity of the brief.");
    add("upload-files", "brief-analysis", "Can I upload files?", "Yes! You can upload .docx, .pdf, and .txt files. BriefFill will extract the text and analyze it automatically.");
    add("file-formats", "brief-analysis", "What file formats are supported?", "Supported formats: .docx (Microsoft Word), .pdf (Adobe PDF), and .txt (plain text files).");
    add("edit-results", "brief-analysis", "Can I edit the analysis results?", "Yes! You can edit any field, add your own questions, and customize the generated email draft before exporting.");
    add("brief-storage", "brief-analysis", "What happens to my briefs?", "Your briefs are stored securely in our encrypted database. You can access them anytime from your dashboard. You can also delete them at any time.");
    add("templates-library", "templates", "What templates are available?", "BriefFill offers 42+ templates across 7 categories: Advertising & Strategy, Design, Development, Marketing, Photography & Architecture, UX/UI Design, and Video, Film, Music & Animation.");
    add("use-template", "templates", "How do I use a template?", "1. Browse the template library\n2. Click on a template\n3. Review the template fields\n4. Click \"Use This Template\"\n5. Fill in the fields\n6. Generate your brief");
    add("customize-templates", "templates", "Can I customize templates?", "Yes! You can edit any field in a template to match your specific needs. You can also create your own templates from scratch.");
    add("create-templates", "templates", "How do I create my own template?", "1. Go to the Templates page\n2. Click \"Create Template\"\n3. Name your template\n4. Add fields\n5. Save your template\n6. Use it for future briefs");
    add("template-ai", "templates", "Can the AI fill in templates?", "Yes! When you select a template, the AI can automatically generate content for all 12 fields based on your project details.");
    add("template-sharing", "templates", "Can I share templates with my team?", "Yes! Team and Agency plan users can create and share templates with their entire team. Templates are accessible from the team dashboard.");
    add("create-team", "teams", "How do I create a team?", "1. Go to the Teams page\n2. Click \"Create Team\"\n3. Enter a team name and description\n4. Click \"Create\"\n5. Invite members from the team dashboard");
    add("invite-members", "teams", "How do I invite team members?", "1. Open your team dashboard\n2. Click \"Invite Members\"\n3. Enter email addresses\n4. Assign roles (Admin, Member, Viewer)\n5. Click \"Send Invites\"");
    add("roles", "teams", "What are the team roles?", "• Owner: Full access, can delete team\n• Admin: Manage members, view all briefs\n• Member: Create and view briefs\n• Viewer: View-only access");
    add("collaboration-portal", "teams", "What is the Collaboration Portal?", "The Collaboration Portal is a public link you can share with clients. Clients can fill out brief exercises without creating an account. You can track their progress in real-time.");
    add("portal-link", "teams", "How do I create a Collaboration Portal link?", "1. Open a brief\n2. Click \"Create Portal\"\n3. Copy the unique link\n4. Share it with your client\n5. Clients can fill it out without signing up");
    add("client-portal", "teams", "Can clients use the portal without an account?", "Yes! The Collaboration Portal is designed for clients who don't have a BriefFill account. They can fill out exercises, upload files, and submit responses without signing up.");
    add("team-analytics", "teams", "Does BriefFill offer team analytics?", "Yes! The team dashboard shows aggregate stats: total briefs analyzed, average score, time saved, and individual member performance metrics.");
    add("plans", "billing", "What are the different plans?", "• Free: 5 briefs/month, 1 user\n• Pro ($19/month): Unlimited briefs, Brief Builder, exports\n• Team ($49/month): All Pro + 5 team members, Collaboration Portal\n• Agency ($99/month): All Team + 15 members, competitor analysis, API access");
    add("upgrade", "billing", "How do I upgrade my plan?", "1. Go to Settings > Billing\n2. Click \"Change Plan\"\n3. Select your desired plan\n4. Enter payment details\n5. Confirm the upgrade");
    add("annual-discount", "billing", "Is there a discount for annual billing?", "Yes! Annual plans are 20% off the monthly price:\n• Pro: $182/year ($15.20/month)\n• Team: $470/year ($39.20/month)\n• Agency: $950/year ($79.20/month)");
    add("invoices", "billing", "Where can I find my invoices?", "Go to Settings > Billing. You'll see a list of all invoices. Click \"Download\" to get a PDF copy of any invoice.");
    add("cancel-subscription", "billing", "Can I cancel my subscription anytime?", "Yes! You can cancel your subscription at any time from Settings > Billing > Cancel Subscription. Your account will remain active until the end of your billing cycle.");
    add("refund", "billing", "Do you offer refunds?", "We offer a 14-day money-back guarantee for new subscribers. If you're not satisfied, contact us within 14 days for a full refund.");
    add("profile", "account", "How do I update my profile?", "1. Go to Settings > Profile\n2. Upload a profile picture\n3. Edit your name, bio, company, and social links\n4. Click \"Save Changes\"");
    add("password", "account", "How do I change my password?", "1. Go to Settings > Security\n2. Enter your current password\n3. Enter your new password\n4. Confirm your new password\n5. Click \"Update Password\"");
    add("2fa", "account", "Does BriefFill support two-factor authentication?", "Yes! 2FA is available on Pro and higher plans. You can enable it from Settings > Security > Two-Factor Authentication.");
    add("delete-account", "account", "How do I delete my account?", "1. Go to Settings > Security\n2. Scroll to \"Delete Account\"\n3. Confirm your password\n4. Click \"Permanently Delete Account\"\n5. All data will be deleted within 30 days");
    add("api-keys", "account", "How do I get an API key?", "API keys are available on Team and Agency plans. Go to Settings > API Keys to generate, copy, and manage your keys. Keys start with bfk_.");
    add("ai-model", "ai-technology", "What AI model does BriefFill use?", "BriefFill uses Groq's Llama 3.3 70B model, which is one of the most advanced language models available. It's optimized for speed and accuracy.");
    add("data-privacy", "ai-technology", "How is my data used for AI training?", "We DO NOT use your briefs to train public AI models. Your data remains private and is only used to provide the service. See our Privacy Policy for more details.");
    add("ai-accuracy", "ai-technology", "How accurate is the AI analysis?", "BriefFill's AI achieves 98% gap detection accuracy. It's trained on thousands of creative briefs across multiple industries to identify even subtle gaps.");
    add("ai-updates", "ai-technology", "How often is the AI model updated?", "We continuously improve our AI models. Major updates are released quarterly, with minor improvements rolled out weekly.");
    return r;
  })(),
];

const colorPairs = [
  { border: "border-indigo-200", bg: "bg-indigo-50", text: "text-indigo-600", active: "bg-indigo-50 border-indigo-400" },
  { border: "border-purple-200", bg: "bg-purple-50", text: "text-purple-600", active: "bg-purple-50 border-purple-400" },
  { border: "border-green-200", bg: "bg-green-50", text: "text-green-600", active: "bg-green-50 border-green-400" },
  { border: "border-blue-200", bg: "bg-blue-50", text: "text-blue-600", active: "bg-blue-50 border-blue-400" },
  { border: "border-orange-200", bg: "bg-orange-50", text: "text-orange-600", active: "bg-orange-50 border-orange-400" },
  { border: "border-red-200", bg: "bg-red-50", text: "text-red-600", active: "bg-red-50 border-red-400" },
  { border: "border-teal-200", bg: "bg-teal-50", text: "text-teal-600", active: "bg-teal-50 border-teal-400" },
];

const mostAskedIds = ["what-is-brieffill", "ai-analysis", "plans", "cancel-subscription", "accuracy", "upgrade"];

function getCategoryName(id) {
  const cat = categories.find((c) => c.id === id);
  return cat ? cat.name : id;
}

function getCategoryColor(id) {
  const idx = categories.findIndex((c) => c.id === id);
  return colorPairs[idx >= 0 ? idx : 0];
}

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [open, setOpen] = useState({});

  const toggle = (id) => setOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  const mostAsked = faqs.filter((f) => mostAskedIds.includes(f.id));
  const filtered = faqs.filter((f) => {
    const matchCat = activeCategory === "all" || f.category === activeCategory;
    const matchSearch = f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  function AnswerText({ text }) {
    return (
      <div className="space-y-1">
        {text.split("\n").map((line, i) => (
          <p key={i} className={line.startsWith("•") || line.startsWith("-") ? "pl-4" : ""}>{line}</p>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Icon name="help" className="text-[32px] text-white" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Frequently Asked Questions</h1>
          <p className="text-indigo-100 max-w-2xl mx-auto">Find answers to the most common questions about BriefFill.</p>
          <div className="relative max-w-2xl mx-auto mt-6">
            <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-outline" />
            <input type="text" placeholder="Search FAQs..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm text-on-surface" />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <button onClick={() => setActiveCategory("all")}
            className={`p-3 rounded-xl border-2 transition text-center ${
              activeCategory === "all" ? "bg-primary/5 border-primary text-primary" : "bg-white border-outline-variant text-on-surface-variant hover:border-outline"
            }`}>
            <span className="text-lg">All</span>
            <p className="text-[10px] text-outline mt-1">{faqs.length}</p>
          </button>
          {categories.map((cat, i) => {
            const isActive = activeCategory === cat.id;
            const c = colorPairs[i % colorPairs.length];
            return (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`p-3 rounded-xl border-2 transition text-center ${isActive ? c.active : "bg-white border-outline-variant text-on-surface-variant hover:border-outline"}`}>
                <Icon name={cat.icon} className={`text-[20px] mx-auto ${isActive ? c.text : "text-outline"}`} />
                <p className="text-xs font-semibold mt-1 truncate">{cat.name}</p>
                <p className="text-[10px] text-outline">{cat.count}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Most Asked */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="trending_up" className="text-[20px] text-orange-500" />
            <h2 className="text-lg font-bold text-on-surface">Most Asked Questions</h2>
          </div>
          <div className="space-y-2">
            {mostAsked.map((faq) => (
              <div key={faq.id} className="bg-white rounded-xl border border-outline-variant overflow-hidden">
                <button onClick={() => toggle(faq.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition text-left">
                  <span className="font-semibold text-sm text-on-surface">{faq.question}</span>
                  <Icon name={open[faq.id] ? "expand_less" : "expand_more"} className="text-[18px] text-outline shrink-0" />
                </button>
                {open[faq.id] && (
                  <div className="px-4 pb-4 text-sm text-on-surface-variant border-t border-outline-variant pt-3">
                    <AnswerText text={faq.answer} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* All FAQs */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-12">
        <h2 className="text-xl font-bold text-on-surface mb-6">All Questions</h2>
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant">No questions found matching your search.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((faq) => (
              <div key={faq.id} className="bg-white rounded-xl border border-outline-variant overflow-hidden shadow-sm hover:shadow-md transition">
                <button onClick={() => toggle(faq.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition text-left gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[10px] font-bold text-outline uppercase shrink-0">{getCategoryName(faq.category)}</span>
                    <span className="font-semibold text-sm text-on-surface">{faq.question}</span>
                  </div>
                  <Icon name={open[faq.id] ? "expand_less" : "expand_more"} className="text-[18px] text-outline shrink-0" />
                </button>
                {open[faq.id] && (
                  <div className="px-4 pb-4 text-sm text-on-surface-variant border-t border-outline-variant pt-3">
                    <AnswerText text={faq.answer} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Still Have Questions */}
      <div className="bg-surface-container-low border-t border-outline-variant py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h3 className="text-xl font-bold text-on-surface mb-2">Still have questions?</h3>
          <p className="text-on-surface-variant mb-6 max-w-2xl mx-auto">Can't find what you're looking for? Our support team is here to help.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="mailto:support@brieffill.com"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition">
              <Icon name="mail" className="text-[16px]" />
              Contact Support
            </a>
            <Link to="/help"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-on-surface font-semibold rounded-lg border border-outline-variant hover:bg-surface-container-low transition">
              <Icon name="help" className="text-[16px]" />
              Visit Help Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
