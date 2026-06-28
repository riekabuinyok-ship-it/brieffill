import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";

const sections = [
  {
    id: "getting-started",
    icon: "rocket_launch",
    title: "Getting Started",
    articles: [
      { title: "How to create an account", link: "/guide" },
      { title: "Navigating the dashboard", link: "/guide" },
      { title: "Your first brief walkthrough", link: "/guide" },
    ],
  },
  {
    id: "analyzing-briefs",
    icon: "description",
    title: "Analyzing Briefs",
    articles: [
      { title: "How to paste a brief", link: "/new" },
      { title: "Uploading files (docx, pdf, txt)", link: "/new" },
      { title: "Understanding the AI analysis", link: "/guide" },
      { title: "Reading the completeness score", link: "/guide" },
      { title: "Using clarification questions", link: "/guide" },
      { title: "Generating an email draft", link: "/guide" },
    ],
  },
  {
    id: "templates",
    icon: "folder_copy",
    title: "Templates",
    articles: [
      { title: "Browsing the template library", link: "/templates" },
      { title: "Using a template", link: "/templates" },
      { title: "Customizing templates", link: "/templates" },
      { title: "Creating your own templates", link: "/templates" },
    ],
  },
  {
    id: "teams",
    icon: "group",
    title: "Teams & Collaboration",
    articles: [
      { title: "Creating a team", link: "/teams" },
      { title: "Inviting team members", link: "/teams" },
      { title: "Managing roles", link: "/teams" },
      { title: "Using the Collaboration Portal", link: "/portal" },
      { title: "Client portal guide", link: "/portal" },
    ],
  },
  {
    id: "billing",
    icon: "payments",
    title: "Billing & Plans",
    articles: [
      { title: "Understanding plans (Free, Pro, Team, Agency)", link: "/pricing" },
      { title: "Upgrading your plan", link: "/dashboard/billing" },
      { title: "Viewing invoices", link: "/dashboard/billing" },
      { title: "Canceling your subscription", link: "/dashboard/billing" },
    ],
  },
  {
    id: "settings",
    icon: "settings",
    title: "Settings & Security",
    articles: [
      { title: "Updating your profile", link: "/profile" },
      { title: "Changing your password", link: "/security" },
      { title: "Managing API keys", link: "/api-keys" },
      { title: "Two-factor authentication", link: "/security" },
      { title: "Deleting your account", link: "/security" },
    ],
  },
];

const quickStartSteps = [
  { step: 1, title: "Create Account", desc: "Sign up for free" },
  { step: 2, title: "Paste Brief", desc: "Add your client brief" },
  { step: 3, title: "Click Analyze", desc: "AI processes your brief" },
  { step: 4, title: "Review Results", desc: "Get questions and score" },
];

const colorPairs = [
  "border-indigo-200 bg-indigo-50",
  "border-purple-200 bg-purple-50",
  "border-green-200 bg-green-50",
  "border-blue-200 bg-blue-50",
  "border-orange-200 bg-orange-50",
  "border-gray-200 bg-gray-50",
];

export default function UserGuide() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="bg-background min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Icon name="menu_book" className="text-[32px] text-white" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">User Guide</h1>
          <p className="text-indigo-100 max-w-2xl mx-auto">Everything you need to know about BriefFill</p>
          <div className="relative max-w-2xl mx-auto mt-6">
            <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-outline" />
            <input type="text" placeholder="Search the user guide..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm text-on-surface" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* Quick Start */}
        <div className="bg-white rounded-2xl border border-outline-variant shadow-sm p-6 mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Icon name="rocket_launch" className="text-[20px] text-primary" />
            <h2 className="text-lg font-bold text-on-surface">Quick Start Guide</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickStartSteps.map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-lg font-bold text-primary">{s.step}</span>
                </div>
                <h3 className="font-semibold text-on-surface text-sm">{s.title}</h3>
                <p className="text-xs text-on-surface-variant">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Guide Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section, i) => {
            const colors = colorPairs[i % colorPairs.length];
            return (
              <div key={section.id} className={`p-6 rounded-xl border-2 transition ${colors} hover:shadow-md`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg ${colors} flex items-center justify-center shrink-0`}>
                    <Icon name={section.icon} className="text-[20px]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-on-surface mb-2">{section.title}</h3>
                    <ul className="space-y-1">
                      {section.articles.map((a, j) => (
                        <li key={j}>
                          <Link to={a.link}
                            className="text-sm text-on-surface-variant hover:text-primary transition flex items-center gap-1">
                            <Icon name="chevron_right" className="text-[12px] text-outline" />
                            {a.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* All Articles */}
        <div className="mt-12 bg-surface-container-low rounded-2xl p-6 border border-outline-variant">
          <h2 className="text-lg font-bold text-on-surface mb-4">All User Guide Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sections.map((section) => (
              <div key={section.id}>
                <h4 className="font-semibold text-on-surface mb-2">{section.title}</h4>
                <ul className="space-y-1">
                  {section.articles.map((a, j) => (
                    <li key={j}>
                      <Link to={a.link}
                        className="text-sm text-on-surface-variant hover:text-primary transition flex items-center gap-1">
                        <Icon name="chevron_right" className="text-[12px] text-outline" />
                        {a.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Still Need Help */}
        <div className="mt-12 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 text-center border border-indigo-100">
          <h3 className="text-lg font-bold text-on-surface mb-2">Still have questions?</h3>
          <p className="text-on-surface-variant mb-4">Can't find what you're looking for? We're here to help.</p>
          <Link to="/help"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition">
            Visit Help Center
            <Icon name="arrow_forward" className="text-[16px]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
