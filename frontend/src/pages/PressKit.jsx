import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";

const colors = [
  { name: "Primary", hex: "#4F46E5", label: "Indigo" },
  { name: "Secondary", hex: "#7C3AED", label: "Purple" },
  { name: "Accent", hex: "#10B981", label: "Green" },
  { name: "Neutral", hex: "#1F2937", label: "Dark" },
];

const pressReleases = [
  { id: 1, title: "BriefFill Launches to Help Freelancers and Agencies Stop Guessing What Clients Want", date: "June 1, 2026", location: "London, UK", pdf: "/BriefFill-Launches-AI-Powered-Platform.pdf" },
  { id: 2, title: "BriefFill Announces Series A Funding to Expand AI-Powered Creative Brief Platform", date: "May 15, 2026", location: "London, UK", pdf: "/BriefFill-Launches-AI-Powered-Platform.pdf" },
];

const brandAssets = [
  { label: "Logo (Color)", file: "/Logo-color.png", bg: "bg-white", pad: "p-3" },
  { label: "Logo (White)", file: "/Logo-white.png", bg: "bg-gray-900", pad: "p-3" },
  { label: "Icon (Mark)", file: "/Icon-mark.png", bg: "bg-white", pad: "p-4" },
];

const screenshots = [
  { name: "Dashboard", file: "/Dashboard.png" },
  { name: "Brief Analysis", file: "/Brief Analysis.png" },
  { name: "Templates", file: "/Templates.png" },
  { name: "Team", file: "/Team.png" },
];

const teamPhotos = [
  { name: "Team Photo 1", file: "/Team Photo 1.jpg" },
  { name: "Team Photo 2", file: "/Team Photo 2.jpg" },
  { name: "Team Photo 3", file: "/Team Photo 3.jpg" },
];

export default function PressKit() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText("press@brieffill.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Icon name="description" className="text-[32px] text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Press Kit</h1>
          <p className="text-xl text-indigo-100 max-w-2xl mx-auto mb-8">Everything you need to write about BriefFill.</p>
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:shadow-lg transition">
            <Icon name="download" className="text-[18px]" />
            Download All Assets
          </button>
        </div>
      </div>

      {/* About */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl border border-outline-variant p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-on-surface mb-4">About BriefFill</h2>
          <p className="text-on-surface-variant leading-relaxed mb-6">BriefFill is an AI-powered platform that helps freelancers and agencies analyze client briefs against 12 critical fields. It identifies gaps, generates specific clarifying questions, and helps teams start projects with absolute clarity.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 text-on-surface-variant"><Icon name="calendar_month" className="text-[16px] text-primary" /><span><strong className="text-on-surface">Founded:</strong> 2026</span></div>
            <div className="flex items-center gap-2 text-on-surface-variant"><Icon name="location_on" className="text-[16px] text-primary" /><span><strong className="text-on-surface">HQ:</strong> London, UK</span></div>
            <div className="flex items-center gap-2 text-on-surface-variant"><Icon name="language" className="text-[16px] text-primary" /><span><strong className="text-on-surface">Remote:</strong> First</span></div>
          </div>
          <div className="mt-4 pt-4 border-t border-outline-variant">
            <p className="text-sm text-on-surface-variant"><strong className="text-on-surface">Mission:</strong> Empower every creative professional to start with clarity.</p>
          </div>
          <a href="/BriefFill-Launches-AI-Powered-Platform.pdf" download
            className="mt-4 inline-flex items-center gap-2 text-primary font-semibold hover:underline transition">
            <Icon name="download" className="text-[16px]" />
            Download Press Release
          </a>
        </div>
      </div>

      {/* Brand Assets */}
      <div className="bg-surface-container-low py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-on-surface mb-6">Brand Assets</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {brandAssets.map((a) => (
              <div key={a.label} className="bg-white rounded-xl p-6 text-center border border-outline-variant shadow-sm hover:shadow-md transition">
                <div className={`w-full h-24 ${a.bg} rounded-xl flex items-center justify-center mx-auto mb-3 border border-outline-variant ${a.pad}`}>
                  <img src={a.file} alt={a.label} className="w-full h-full object-contain" />
                </div>
                <p className="font-semibold text-on-surface">{a.label}</p>
                <p className="text-xs text-outline">PNG, SVG</p>
                <a href={a.file} download
                  className="mt-3 inline-flex items-center gap-1 text-sm text-primary font-semibold hover:underline">
                  <Icon name="download" className="text-[14px]" />
                  Download
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Color Palette */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-2xl font-bold text-on-surface mb-6">Color Palette</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {colors.map((c) => (
            <div key={c.hex} className="rounded-xl overflow-hidden shadow-sm">
              <div className="h-16 flex items-center justify-center" style={{ backgroundColor: c.hex }}>
                <span className="text-sm font-medium text-white">{c.hex}</span>
              </div>
              <div className="bg-white p-3 text-center border border-outline-variant border-t-0">
                <p className="font-semibold text-on-surface">{c.name}</p>
                <p className="text-xs text-outline">{c.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Press Releases */}
      <div className="bg-surface-container-low py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-on-surface mb-6">Press Releases</h2>
          <div className="space-y-4">
            {pressReleases.map((r) => (
              <div key={r.id} className="bg-white rounded-xl p-6 border border-outline-variant shadow-sm hover:shadow-md transition">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-on-surface">{r.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-on-surface-variant">
                      <span className="flex items-center gap-1"><Icon name="calendar_month" className="text-[14px]" />{r.date}</span>
                      <span className="flex items-center gap-1"><Icon name="location_on" className="text-[14px]" />{r.location}</span>
                    </div>
                  </div>
                  <a href={r.pdf} download
                    className="flex items-center gap-1 px-4 py-2 bg-primary/5 text-primary text-sm font-semibold rounded-lg hover:bg-primary/10 transition">
                    <Icon name="download" className="text-[14px]" />
                    Download PDF
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Media Assets */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-2xl font-bold text-on-surface mb-6">Media Assets</h2>
        <div className="mb-8">
          <h3 className="font-semibold text-on-surface mb-4">Screenshots</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {screenshots.map((s) => (
              <a key={s.name} href={s.file} target="_blank" rel="noopener noreferrer"
                className="bg-surface-container-low rounded-xl h-28 flex items-center justify-center border border-outline-variant overflow-hidden hover:shadow-md transition">
                <img src={s.file} alt={s.name} className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
          <a href="/Dashboard.png" download
            className="mt-4 inline-flex items-center gap-1 text-sm text-primary font-semibold hover:underline">
            <Icon name="download" className="text-[14px]" />
            Download All Screenshots
          </a>
        </div>
        <div>
          <h3 className="font-semibold text-on-surface mb-4">Team Photos</h3>
          <div className="grid grid-cols-3 gap-4">
            {teamPhotos.map((p) => (
              <a key={p.name} href={p.file} target="_blank" rel="noopener noreferrer"
                className="bg-surface-container-low rounded-xl h-28 flex items-center justify-center border border-outline-variant overflow-hidden hover:shadow-md transition">
                <img src={p.file} alt={p.name} className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
          <a href="/Team Photo 1.jpg" download
            className="mt-4 inline-flex items-center gap-1 text-sm text-primary font-semibold hover:underline">
            <Icon name="download" className="text-[14px]" />
            Download All Photos
          </a>
        </div>
      </div>

      {/* Media Contacts */}
      <div className="bg-surface-container-low py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold text-on-surface mb-6">Media Contacts</h2>
          <div className="bg-white rounded-2xl p-8 border border-outline-variant shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 text-on-surface">
                <Icon name="mail" className="text-[20px] text-primary" />
                <span className="font-medium">press@brieffill.com</span>
                <button onClick={handleCopy}
                  className="p-1.5 text-outline hover:text-primary hover:bg-primary/5 rounded-lg transition">
                  <Icon name={copied ? "check_circle" : "content_copy"} className={copied ? "text-[16px] text-green-500" : "text-[16px]"} />
                </button>
              </div>
              <div className="flex items-center justify-center gap-3 text-on-surface">
                <Icon name="call" className="text-[20px] text-primary" />
                <span>+44 7451 294024</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-on-surface">
                <Icon name="chat" className="text-[20px] text-primary" />
                <span>WhatsApp: +44 7451 294024</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-on-surface">
                <Icon name="language" className="text-[20px] text-primary" />
                <a href="https://brieffill.com" className="text-primary hover:underline">brieffill.com</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
