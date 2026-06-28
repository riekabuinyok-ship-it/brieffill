export const FIELDS = [
  "Project Overview", "Target Audience", "Core Problem", "Solution/Offer",
  "Key Benefits", "Tone of Voice", "Brand Guidelines", "Deliverables",
  "Timeline", "Budget", "Competitors", "Call to Action",
];

export const FIELDS_WITH_PLACEHOLDERS = [
  { name: "Project Overview", placeholder: "We are launching a [product/service] campaign targeting [audience]..." },
  { name: "Target Audience", placeholder: "Our primary audience is [demographic] who care about [values]..." },
  { name: "Core Problem", placeholder: "This campaign addresses the problem of [problem]..." },
  { name: "Solution/Offer", placeholder: "We are solving this with [solution]..." },
  { name: "Key Benefits", placeholder: "The key benefits include [benefit 1], [benefit 2]..." },
  { name: "Tone of Voice", placeholder: "The campaign should be [tone] with [style]..." },
  { name: "Brand Guidelines", placeholder: "All assets must follow [brand guidelines]..." },
  { name: "Deliverables", placeholder: "The deliverables include [deliverable 1], [deliverable 2]..." },
  { name: "Timeline", placeholder: "The timeline is [timeframe] with key milestones on [dates]..." },
  { name: "Budget", placeholder: "The budget for this campaign is [budget] covering [expenses]..." },
  { name: "Competitors", placeholder: "Our competitors include [competitor 1], [competitor 2]..." },
  { name: "Call to Action", placeholder: "We want [audience] to [action]..." },
];

const T = (id, name, desc, usage) => ({ id, name, description: desc, usageCount: usage, fields: FIELDS_WITH_PLACEHOLDERS });

export const templateCategories = [
  {
    id: "advertising", name: "Advertising & Strategy", icon: "campaign",
    description: "Briefs for campaigns, influencers, PR, and market research",
    templates: [
      T("advertising-campaign", "Advertising Campaign Brief", "Complete campaign brief including creative concept, media strategy, and target audience", 87),
      T("influencer", "Influencer Partnership Brief", "Brief for influencer partnerships, content requirements, and disclosure guidelines", 45),
      T("pr", "PR Press Release Brief", "Brief for press releases, media outreach, and crisis communication", 62),
      T("market-research", "Market Research Brief", "Brief for research objectives, methodology, and target respondents", 28),
      T("press-release", "Press Release Brief", "Brief for news announcements and distribution strategy", 93),
      T("naming", "Naming Brief", "Brief for brand/product naming and tagline development", 34),
    ],
  },
  {
    id: "design", name: "Design Briefs", icon: "palette",
    description: "Briefs for graphic design, logo, packaging, and brand identity",
    templates: [
      T("graphic-design", "Graphic Design Brief", "Brief for posters, brochures, and illustrations", 55),
      T("logo-design", "Logo Design Brief", "Brief for brand mark, wordmark, and icon design", 78),
      T("packaging-design", "Packaging Design Brief", "Brief for product packaging, labels, and unboxing experience", 31),
      T("brand-identity", "Brand Identity Brief", "Brief for full brand system, guidelines, and applications", 42),
      T("print-design", "Print Design Brief", "Brief for magazines, catalogs, and business cards", 19),
      T("presentation-design", "Presentation Design Brief", "Brief for pitch decks, slide decks, and templates", 27),
    ],
  },
  {
    id: "development", name: "Development Briefs", icon: "code",
    description: "Briefs for web, mobile, API, and technical projects",
    templates: [
      T("web-development", "Web Development Brief", "Brief for full website build and CMS integration", 63),
      T("mobile-app", "Mobile App Brief", "Brief for iOS/Android app development", 41),
      T("software-feature", "Software Feature Brief", "Brief for new feature, enhancement, or update", 23),
      T("api-development", "API Development Brief", "Brief for API endpoints, integrations, and documentation", 17),
      T("technical-migration", "Technical Migration Brief", "Brief for platform migration, upgrade, or refactoring", 9),
      T("performance-optimization", "Performance Optimization Brief", "Brief for speed, scalability, and security improvements", 14),
    ],
  },
  {
    id: "marketing", name: "Marketing Briefs", icon: "trending_up",
    description: "Briefs for content, social media, email, and SEO",
    templates: [
      T("content-marketing", "Content Marketing Brief", "Brief for blog posts, articles, and whitepapers", 48),
      T("social-media", "Social Media Campaign Brief", "Brief for platform-specific content and engagement plan", 52),
      T("email-marketing", "Email Marketing Brief", "Brief for newsletters, drip campaigns, and nurture sequences", 37),
      T("seo-strategy", "SEO Strategy Brief", "Brief for keyword targeting and content optimization", 29),
      T("paid-advertising", "Paid Advertising Brief", "Brief for PPC, display ads, and retargeting campaigns", 33),
      T("event-marketing", "Event Marketing Brief", "Brief for webinars, conferences, and virtual events", 16),
    ],
  },
  {
    id: "ux-ui", name: "UX/UI Design Briefs", icon: "devices",
    description: "Briefs for user research, interface design, and prototyping",
    templates: [
      T("ux-research", "UX Research Brief", "Brief for user research, testing, and interviews", 26),
      T("ui-design", "UI Design Brief", "Brief for interface design and visual components", 44),
      T("user-flow", "User Flow Brief", "Brief for navigation and journey mapping", 21),
      T("prototyping", "Prototyping Brief", "Brief for interactive prototypes and wireframes", 18),
      T("design-system", "Design System Brief", "Brief for component libraries and style guides", 35),
      T("accessibility", "Accessibility Brief", "Brief for WCAG compliance and inclusive design", 12),
    ],
  },
  {
    id: "video", name: "Video, Film & Animation", icon: "videocam",
    description: "Briefs for explainer videos, commercials, documentaries, and more",
    templates: [
      T("explainer-video", "Explainer Video Brief", "Brief for animated explainer and product demo videos", 56),
      T("commercial-video", "Commercial Video Brief", "Brief for TV ads, social video, and promotional content", 38),
      T("documentary", "Documentary Brief", "Brief for short documentaries, brand stories, and case studies", 19),
      T("music-production", "Music Production Brief", "Brief for composition, sound design, and licensing", 14),
      T("motion-graphics", "Motion Graphics Brief", "Brief for title sequences, social assets, and graphics", 31),
      T("live-action", "Live Action Video Brief", "Brief for interview-style, event coverage, and testimonials", 22),
    ],
  },
];

export function getAllTemplates() {
  return templateCategories.flatMap((cat) =>
    cat.templates.map((t) => ({ ...t, category: cat.name, categoryId: cat.id, categoryIcon: cat.icon }))
  );
}

export function getTemplateById(id) {
  return getAllTemplates().find((t) => t.id === id);
}
