import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";

const benefits = [
  { icon: "language", title: "Remote First", desc: "Work from anywhere in the world" },
  { icon: "rocket_launch", title: "Fast Growth", desc: "Be part of a high-growth startup" },
  { icon: "track_changes", title: "Impact Matters", desc: "Help thousands of creatives" },
  { icon: "school", title: "Learn Every Day", desc: "Work with cutting-edge technology" },
  { icon: "favorite", title: "Great Benefits", desc: "Competitive salary + equity" },
  { icon: "trending_up", title: "Growth Mindset", desc: "Career development opportunities" },
];

const positions = [
  { id: "engineer", icon: "rocket_launch", title: "Full Stack Engineer", dept: "Engineering", location: "Remote", type: "Full-time", salary: "$120k-160k", desc: "We're looking for a talented full-stack engineer to help build the future of creative collaboration. You'll work with React, Node.js, and cutting-edge AI technologies." },
  { id: "product", icon: "track_changes", title: "Product Manager", dept: "Product", location: "Remote", type: "Full-time", salary: "$110k-150k", desc: "Lead product strategy and execution for our core platform. Work closely with engineering, design, and customers to build products that users love." },
  { id: "designer", icon: "palette", title: "Senior Product Designer", dept: "Design", location: "Remote", type: "Full-time", salary: "$100k-140k", desc: "Shape the product experience for thousands of creative professionals. Own the end-to-end design process from research to pixel-perfect execution." },
  { id: "marketing", icon: "campaign", title: "Marketing Lead", dept: "Marketing", location: "Remote", type: "Full-time", salary: "$90k-120k", desc: "Drive growth and brand awareness for BriefFill. Lead marketing strategy, content, and campaigns to reach creative professionals worldwide." },
];

const colorPairs = [
  "border-indigo-200 bg-indigo-50 text-indigo-600",
  "border-purple-200 bg-purple-50 text-purple-600",
  "border-green-200 bg-green-50 text-green-600",
  "border-blue-200 bg-blue-50 text-blue-600",
];

export default function Careers() {
  return (
    <div className="bg-background min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Icon name="work" className="text-[32px] text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Join Our Team</h1>
          <p className="text-xl text-indigo-100 max-w-2xl mx-auto mb-8">Help us build the future of creative collaboration.</p>
          <a href="#positions"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:shadow-lg transition">
            View Open Positions
            <Icon name="arrow_forward" className="text-[18px]" />
          </a>
        </div>
      </div>

      {/* Why Work Here */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-on-surface mb-4">Why Work at BriefFill?</h2>
        <p className="text-center text-on-surface-variant mb-12 max-w-2xl mx-auto">We're building a company where you can do your best work and grow your career.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <div key={i} className="bg-white rounded-xl p-6 text-center border border-outline-variant shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Icon name={b.icon} className="text-[24px] text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-on-surface">{b.title}</h3>
              <p className="text-sm text-on-surface-variant mt-1">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Open Positions */}
      <div id="positions" className="bg-surface-container-low py-16 scroll-mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-on-surface mb-4">Open Positions</h2>
          <p className="text-on-surface-variant mb-8">Join our team and help shape the future of creative collaboration.</p>
          <div className="space-y-4">
            {positions.map((p, i) => {
              const colors = colorPairs[i % colorPairs.length];
              return (
                <div key={p.id} className="bg-white rounded-xl p-6 border border-outline-variant shadow-sm hover:shadow-md transition">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${colors} flex items-center justify-center`}>
                          <Icon name={p.icon} className="text-[20px]" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-on-surface">{p.title}</h3>
                          <p className="text-sm text-on-surface-variant">{p.dept}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-on-surface-variant">
                        <span className="flex items-center gap-1"><Icon name="language" className="text-[14px]" />{p.location}</span>
                        <span className="flex items-center gap-1"><Icon name="schedule" className="text-[14px]" />{p.type}</span>
                        <span className="flex items-center gap-1"><Icon name="payments" className="text-[14px]" />{p.salary}</span>
                      </div>
                      <p className="text-sm text-on-surface-variant mt-3">{p.desc}</p>
                    </div>
                    <Link to={`/careers/${p.id}`}
                      className="flex items-center gap-1 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition whitespace-nowrap">
                      Apply Now
                      <Icon name="chevron_right" className="text-[16px]" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Life at BriefFill */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-on-surface mb-4">Life at BriefFill</h2>
        <p className="text-center text-on-surface-variant mb-8 max-w-2xl mx-auto">We're a distributed team of passionate builders. We believe in work-life balance, continuous learning, and having fun while building something meaningful.</p>
        <div className="bg-surface-container-low rounded-2xl p-12 text-center border border-outline-variant">
          <div className="text-6xl mb-4">🌍</div>
          <p className="text-on-surface-variant max-w-lg mx-auto">We're a distributed team spanning 30+ countries. Our culture is built on trust, collaboration, and a shared passion for helping creatives do their best work.</p>
        </div>
      </div>

      {/* Testimonial */}
      <div className="bg-surface-container-low py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex justify-center text-yellow-400 text-2xl mb-4">{"⭐".repeat(5)}</div>
          <p className="text-xl text-on-surface italic mb-4">&ldquo;BriefFill is the best place I've ever worked. The team is incredible, and the impact we're making is real.&rdquo;</p>
          <p className="text-sm text-on-surface-variant">&mdash; Taylor Brooks, Head of Growth</p>
        </div>
      </div>

      {/* Talent Pool */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Join Our Talent Pool</h2>
          <p className="text-indigo-100 mb-6">Not seeing the right role? Send us your resume. We're always looking for amazing talent.</p>
          <a href="mailto:careers@brieffill.com"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:shadow-lg transition">
            <Icon name="mail" className="text-[18px]" />
            careers@brieffill.com
            <Icon name="arrow_forward" className="text-[18px]" />
          </a>
        </div>
      </div>
    </div>
  );
}
