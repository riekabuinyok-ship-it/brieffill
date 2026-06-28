import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";

const stats = [
  { icon: "group", value: "1,000+", label: "Members" },
  { icon: "chat", value: "2,500+", label: "Posts" },
  { icon: "check_circle", value: "500+", label: "Solutions" },
  { icon: "language", value: "30+", label: "Countries" },
];

const channels = [
  { id: "general", icon: "chat", name: "General Discussion", desc: "Chat about everything BriefFill", posts: 450 },
  { id: "tips", icon: "auto_awesome", name: "Brief Tips & Best Practices", desc: "Share your best brief-writing tips", posts: 320 },
  { id: "showcase", icon: "trending_up", name: "Creative Showcase", desc: "Show off your work using BriefFill", posts: 180 },
  { id: "help", icon: "help", name: "Help & Support", desc: "Get help from the community", posts: 280 },
  { id: "feature-requests", icon: "add_circle", name: "Feature Requests", desc: "Suggest new features", posts: 150 },
  { id: "agency", icon: "business_center", name: "Agency Connection", desc: "Connect with other agencies", posts: 120 },
];

const recentPosts = [
  { id: 1, channel: "general", author: "Sarah Chen", title: "How to get better scores on brief analysis?", replies: 12, time: "2 hours ago" },
  { id: 2, channel: "tips", author: "Mike Johnson", title: "My top 5 tips for writing better briefs", replies: 8, time: "5 hours ago" },
  { id: 3, channel: "showcase", author: "Emily Davis", title: "My latest logo design project using BriefFill", replies: 15, time: "1 day ago" },
];

const events = [
  { id: 1, title: "BriefFill Masterclass: How to Write Perfect Briefs", date: "June 30, 2026", time: "2:00 PM EST", attendees: 45 },
  { id: 2, title: "Community AMA: Ask Us Anything About BriefFill", date: "July 5, 2026", time: "12:00 PM EST", attendees: 32 },
];

const socialLinks = [
  { name: "X/Twitter", icon: "alternate_email", url: "https://twitter.com/brieffill", handle: "@BriefFill" },
  { name: "LinkedIn", icon: "work", url: "https://linkedin.com/company/brieffill", handle: "BriefFill" },
  { name: "YouTube", icon: "play_circle", url: "https://youtube.com/@brieffill", handle: "BriefFill" },
  { name: "Instagram", icon: "photo_camera", url: "https://instagram.com/brieffill", handle: "@BriefFill" },
];

const colorPairs = [
  "border-indigo-200 bg-indigo-50 text-indigo-600",
  "border-green-200 bg-green-50 text-green-600",
  "border-purple-200 bg-purple-50 text-purple-600",
  "border-blue-200 bg-blue-50 text-blue-600",
  "border-orange-200 bg-orange-50 text-orange-600",
  "border-teal-200 bg-teal-50 text-teal-600",
];

function getChannelName(id) {
  const c = channels.find((ch) => ch.id === id);
  return c ? c.name : id;
}

function getChannelIcon(id) {
  const c = channels.find((ch) => ch.id === id);
  return c ? c.icon : "chat";
}

export default function Community() {
  const [activeChannel, setActiveChannel] = useState("all");

  const filteredPosts = activeChannel === "all" ? recentPosts : recentPosts.filter((p) => p.channel === activeChannel);

  return (
    <div className="bg-background min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Icon name="group" className="text-[32px] text-white" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Community</h1>
          <p className="text-indigo-100 max-w-2xl mx-auto">Connect, learn, and grow with fellow BriefFill users.</p>
          <Link to="/register"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:shadow-lg transition">
            <Icon name="group" className="text-[16px]" />
            Join Our Community
            <Icon name="arrow_forward" className="text-[16px]" />
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8">
        <div className="bg-white rounded-2xl shadow-sm border border-outline-variant p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center mx-auto mb-2">
                  <Icon name={s.icon} className="text-[24px] text-primary" />
                </div>
                <p className="text-2xl font-bold text-on-surface">{s.value}</p>
                <p className="text-sm text-on-surface-variant">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Channels */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-2xl font-bold text-on-surface mb-6">Community Channels</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((ch, i) => {
            const colors = colorPairs[i % colorPairs.length];
            return (
              <div key={ch.id} className={`p-6 rounded-xl border-2 transition ${colors} hover:shadow-md`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg ${colors} flex items-center justify-center shrink-0`}>
                    <Icon name={ch.icon} className="text-[20px]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-on-surface">{ch.name}</h3>
                    <p className="text-sm text-on-surface-variant">{ch.desc}</p>
                    <span className="text-xs text-outline">{ch.posts} posts</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Posts */}
      <div className="bg-surface-container-low py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-on-surface">Recent Community Posts</h2>
            <Link to="/community" className="text-sm text-primary font-semibold flex items-center gap-1 hover:underline">
              View all posts
              <Icon name="arrow_forward" className="text-[14px]" />
            </Link>
          </div>

          {/* Channel filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => setActiveChannel("all")}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${activeChannel === "all" ? "bg-primary text-white" : "bg-white text-on-surface-variant border border-outline-variant hover:bg-surface-container"}`}>
              All
            </button>
            {channels.map((ch) => (
              <button key={ch.id} onClick={() => setActiveChannel(ch.id)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${activeChannel === ch.id ? "bg-primary text-white" : "bg-white text-on-surface-variant border border-outline-variant hover:bg-surface-container"}`}>
                {ch.name}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredPosts.map((post) => {
              const icon = getChannelIcon(post.channel);
              return (
                <div key={post.id}
                  className="bg-white rounded-xl p-4 border border-outline-variant hover:shadow-md hover:border-primary/30 transition flex items-start gap-4 cursor-default">
                  <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                    <Icon name={icon} className="text-[20px] text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-on-surface">{post.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant mt-1">
                      <span className="flex items-center gap-1">
                        <Icon name="person" className="text-[12px]" />
                        {post.author}
                      </span>
                      <span className="text-outline">&bull;</span>
                      <span className="flex items-center gap-1">
                        <Icon name="chat" className="text-[12px]" />
                        {post.replies} replies
                      </span>
                      <span className="text-outline">&bull;</span>
                      <span>{post.time}</span>
                    </div>
                  </div>
                  <Icon name="chevron_right" className="text-[16px] text-outline shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Events */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-2xl font-bold text-on-surface mb-6">Upcoming Events</h2>
        <div className="space-y-4">
          {events.map((ev) => (
            <div key={ev.id} className="bg-white rounded-xl p-6 border border-outline-variant shadow-sm hover:shadow-md transition">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-on-surface">{ev.title}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-on-surface-variant mt-2">
                    <span className="flex items-center gap-1"><Icon name="calendar_month" className="text-[14px]" />{ev.date}</span>
                    <span className="flex items-center gap-1"><Icon name="schedule" className="text-[14px]" />{ev.time}</span>
                    <span className="flex items-center gap-1"><Icon name="group" className="text-[14px]" />{ev.attendees} attending</span>
                  </div>
                </div>
                <button className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition">Register &rarr;</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Social */}
      <div className="bg-surface-container-low border-t border-outline-variant py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold text-on-surface mb-2">Connect With Us</h2>
          <p className="text-on-surface-variant mb-6">Follow us on social media for updates, tips, and community highlights.</p>
          <div className="flex flex-wrap justify-center gap-4">
            {socialLinks.map((s) => (
              <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 px-6 py-3 bg-white rounded-xl border border-outline-variant hover:shadow-md hover:border-primary/30 transition">
                <Icon name={s.icon} className="text-[20px] text-on-surface-variant" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-on-surface">{s.name}</p>
                  <p className="text-xs text-outline">{s.handle}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
