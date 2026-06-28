import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";

const categories = [
  { id: "getting-started", icon: "rocket_launch", name: "Getting Started", desc: "Learn the basics of BriefFill", count: 6 },
  { id: "brief-analysis", icon: "description", name: "Brief Analysis", desc: "How to analyze and improve briefs", count: 8 },
  { id: "templates", icon: "folder_copy", name: "Templates", desc: "Using and creating templates", count: 5 },
  { id: "teams", icon: "group", name: "Teams & Collaboration", desc: "Working with your team and clients", count: 4 },
  { id: "billing", icon: "payments", name: "Billing & Plans", desc: "Manage your subscription", count: 3 },
  { id: "account", icon: "shield", name: "Account & Security", desc: "Manage your account settings", count: 4 },
  { id: "integrations", icon: "extension", name: "API & Integrations", desc: "Connect with other tools", count: 3 },
  { id: "faq", icon: "help", name: "FAQ", desc: "Frequently asked questions", count: 12 },
];

const popularArticles = [
  { title: "How to analyze your first brief", link: "/guide" },
  { title: "Understanding the completeness score", link: "/guide" },
  { title: "How to use templates", link: "/templates" },
  { title: "Setting up team collaboration", link: "/teams" },
  { title: "Export your brief to PDF, Google Docs, or Notion", link: "/docs" },
  { title: "How to invite team members", link: "/teams" },
];

const colorPairs = [
  "border-indigo-200 bg-indigo-50 text-indigo-600",
  "border-purple-200 bg-purple-50 text-purple-600",
  "border-green-200 bg-green-50 text-green-600",
  "border-blue-200 bg-blue-50 text-blue-600",
  "border-orange-200 bg-orange-50 text-orange-600",
  "border-red-200 bg-red-50 text-red-600",
  "border-teal-200 bg-teal-50 text-teal-600",
  "border-gray-200 bg-gray-50 text-gray-600",
];

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="bg-background min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            How can we help you?
          </h1>
          <div className="relative max-w-2xl mx-auto mt-6">
            <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-outline" />
            <input type="text" placeholder="Search for articles..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm text-on-surface" />
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <span className="text-sm text-indigo-200">Popular searches:</span>
            {["Getting Started", "Analyze Brief", "Templates"].map((s) => (
              <span key={s} className="text-sm text-white bg-white/20 px-3 py-1 rounded-full cursor-pointer hover:bg-white/30 transition">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-2xl font-bold text-on-surface mb-6">Browse by Category</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat, i) => {
            const colors = colorPairs[i];
            return (
              <Link key={cat.id} to="/docs"
                className={`p-6 rounded-xl border-2 transition ${colors} hover:shadow-md`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colors}`}>
                    <Icon name={cat.icon} className="text-[20px]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-on-surface">{cat.name}</h3>
                    <p className="text-sm text-on-surface-variant">{cat.desc}</p>
                    <span className="text-xs text-outline">{cat.count} articles</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Popular Articles */}
      <div className="bg-surface-container-low py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-on-surface">Popular Articles</h2>
            <Link to="/docs" className="text-sm text-primary font-semibold flex items-center gap-1 hover:underline">
              View all articles
              <Icon name="arrow_forward" className="text-[14px]" />
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-outline-variant divide-y divide-outline-variant">
            {popularArticles.map((a, i) => (
              <Link key={i} to={a.link}
                className="flex items-center justify-between p-4 hover:bg-surface-container-low transition">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-outline">#{i + 1}</span>
                  <span className="text-sm text-on-surface hover:text-primary transition">{a.title}</span>
                </div>
                <Icon name="chevron_right" className="text-[16px] text-outline" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Still Need Help */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-2xl font-bold text-center text-on-surface mb-4">Still need help?</h2>
        <p className="text-center text-on-surface-variant mb-8 max-w-2xl mx-auto">Our support team is here to help you with any questions.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 text-center border border-outline-variant shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Icon name="mail" className="text-[24px] text-primary" />
            </div>
            <h3 className="font-semibold text-on-surface">Email Support</h3>
            <p className="text-sm text-on-surface-variant mt-1">We respond within 24 hours</p>
            <a href="mailto:support@brieffill.com" className="inline-flex items-center gap-1 mt-3 text-sm text-primary font-semibold hover:underline">
              Email us &rarr;
            </a>
          </div>
          <div className="bg-white rounded-xl p-6 text-center border border-primary/20 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Icon name="chat" className="text-[24px] text-primary" />
            </div>
            <h3 className="font-semibold text-on-surface">Live Chat</h3>
            <p className="text-sm text-on-surface-variant mt-1">Chat with us in real-time</p>
            <span className="inline-flex items-center gap-1 mt-3 text-sm text-primary font-semibold cursor-default">
              Start chat &rarr;
            </span>
          </div>
          <div className="bg-white rounded-xl p-6 text-center border border-outline-variant shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Icon name="play_circle" className="text-[24px] text-primary" />
            </div>
            <h3 className="font-semibold text-on-surface">Video Tutorials</h3>
            <p className="text-sm text-on-surface-variant mt-1">Watch our guide videos</p>
            <Link to="/guide" className="inline-flex items-center gap-1 mt-3 text-sm text-primary font-semibold hover:underline">
              Watch now &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Ready to get started?</h2>
          <p className="text-indigo-100 mb-6">Join thousands of freelancers and agencies using BriefFill.</p>
          <Link to="/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:shadow-lg transition">
            Start Free Trial
            <Icon name="arrow_forward" className="text-[18px]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
