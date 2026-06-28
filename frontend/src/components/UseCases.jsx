import { useState } from "react";
import Icon from "./Icon";

function FreelancerVisual() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" className="h-full w-full">
      <rect x="0" y="0" width="400" height="240" fill="#FFFFFF" />
      <rect x="20" y="20" width="360" height="200" rx="16" fill="#F8F9FB" stroke="#E5E7EB" />
      <text x="40" y="56" fontFamily="Inter" fontSize="14" fontWeight="700" fill="#1F2937">Brief Health</text>
      <circle cx="200" cy="140" r="56" fill="none" stroke="#E5E7EB" strokeWidth="10" />
      <circle cx="200" cy="140" r="56" fill="none" stroke="#14A800" strokeWidth="10" strokeDasharray="316" strokeDashoffset="35" transform="rotate(-90 200 140)" />
      <text x="200" y="148" textAnchor="middle" fontFamily="Inter" fontSize="32" fontWeight="800" fill="#1F2937">89%</text>
      <text x="200" y="170" textAnchor="middle" fontFamily="Inter" fontSize="10" fontWeight="600" fill="#6B7280">COMPLETE</text>
    </svg>
  );
}

function AgencyVisual() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" className="h-full w-full">
      <rect x="0" y="0" width="400" height="240" fill="#FFFFFF" />
      <rect x="20" y="20" width="360" height="200" rx="16" fill="#F8F9FB" stroke="#E5E7EB" />
      <text x="40" y="48" fontFamily="Inter" fontSize="12" fontWeight="700" fill="#1F2937">SCORE OVER TIME</text>
      <text x="40" y="64" fontFamily="Inter" fontSize="10" fontWeight="500" fill="#6B7280">Last 4 briefs</text>
      <text x="340" y="56" textAnchor="end" fontFamily="Inter" fontSize="14" fontWeight="700" fill="#EA4335">-71 pts</text>
      <polyline points="40,180 120,140 200,160 280,100 360,200" fill="none" stroke="#7C3AED" strokeWidth="3" />
      <circle cx="40" cy="180" r="4" fill="#7C3AED" />
      <circle cx="120" cy="140" r="4" fill="#7C3AED" />
      <circle cx="200" cy="160" r="4" fill="#7C3AED" />
      <circle cx="280" cy="100" r="4" fill="#7C3AED" />
      <circle cx="360" cy="200" r="4" fill="#7C3AED" />
      <line x1="40" y1="200" x2="360" y2="200" stroke="#E5E7EB" strokeWidth="1" />
    </svg>
  );
}

function InHouseVisual() {
  const fields = [
    { name: "Project Overview", on: true },
    { name: "Target Audience", on: true },
    { name: "Core Problem", on: true },
    { name: "Solution/Offer", on: true },
    { name: "Tone of Voice", on: false },
    { name: "Brand Guidelines", on: false },
    { name: "Deliverables", on: true },
    { name: "Timeline", on: true },
    { name: "Budget", on: true },
    { name: "Competitors", on: true },
    { name: "Call to Action", on: false },
  ];
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" className="h-full w-full">
      <rect x="0" y="0" width="400" height="240" fill="#FFFFFF" />
      <rect x="20" y="20" width="360" height="200" rx="16" fill="#F8F9FB" stroke="#E5E7EB" />
      {fields.map((f, i) => {
        const y = 48 + i * 14;
        return (
          <g key={f.name}>
            <rect x="36" y={y - 8} width="14" height="10" rx="2" fill={f.on ? "#14A800" : "#FEE2E2"} />
            {f.on ? (
              <path d={`M ${38} ${y - 3} L ${42} ${y} L ${48} ${y - 6}`} stroke="#FFFFFF" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <path d={`M ${38} ${y - 6} L ${48} ${y} M ${48} ${y - 6} L ${38} ${y}`} stroke="#EA4335" strokeWidth="1.5" />
            )}
            <text x="60" y={y} fontFamily="Inter" fontSize="9" fontWeight="500" fill={f.on ? "#1F2937" : "#9CA3AF"}>
              {f.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const TABS = [
  {
    id: "freelancer",
    label: "For Freelancers",
    icon: "person",
    title: "Stop underquoting and scope-creep",
    body: "BriefFill catches missing budgets, timelines, and deliverables before you send a quote — so you stop absorbing unfunded work. Most freelancers recover the cost of the first paid month in their very first brief.",
    visual: <FreelancerVisual />,
  },
  {
    id: "agency",
    label: "For Agency PMs",
    icon: "business_center",
    title: "Onboard 5 new clients a week, no detail lost",
    body: "Standardize brief intake across your studio. BriefFill gives every PM the same 12-field analysis, the same score timeline, and the same team handoff — so nothing falls through the cracks between sales and creative.",
    visual: <AgencyVisual />,
  },
  {
    id: "inhouse",
    label: "For In-house Creatives",
    icon: "apartment",
    title: "Hand off briefs with zero ambiguity",
    body: "BriefFill lets your brand and marketing teams submit briefs that meet your own quality bar. Every brief lands on the creative team's desk with a completeness score, a clarification history, and a written sign-off.",
    visual: <InHouseVisual />,
  },
];

export default function UseCases() {
  const [active, setActive] = useState("freelancer");
  const current = TABS.find((t) => t.id === active);

  return (
    <section className="bg-surface-container-low py-12 md:py-16" id="use-cases">
      <div className="container mx-auto px-margin-mobile md:px-margin-desktop max-w-container-max">
        <div className="mb-stack-md text-center">
          <h2 className="font-headline-lg text-headline-lg mb-4 text-on-background">
            Built for the way you work
          </h2>
          <p className="text-body-lg text-on-surface-variant">
            Pick the role that sounds like you.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {TABS.map((t) => {
            const isActive = t.id === active;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActive(t.id)}
                className={`flex items-center gap-2 rounded-full border-2 px-5 py-2.5 font-semibold transition-all ${
                  isActive
                    ? "border-primary bg-primary text-on-primary shadow-md"
                    : "border-outline-variant bg-surface text-on-surface hover:border-primary/40"
                }`}
              >
                <Icon name={t.icon} className="text-[18px]" />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 items-center gap-12 overflow-hidden rounded-3xl border border-outline-variant bg-surface p-8 md:p-12 lg:grid-cols-2">
          <div>
            <h3 className="font-headline-lg text-headline-lg mb-4 text-on-background">{current.title}</h3>
            <p className="text-body-lg text-on-surface-variant">{current.body}</p>
          </div>
          <div className="aspect-[5/3] w-full overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-low">
            {current.visual}
          </div>
        </div>
      </div>
    </section>
  );
}
