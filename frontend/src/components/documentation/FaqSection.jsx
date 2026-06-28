import { useState, useMemo } from "react";
import Icon from "../Icon";

const FAQS = [
  { q: "What file formats does BriefFill support?", a: "BriefFill accepts plain text, PDF, DOCX, URLs, and pasted content. Simply copy and paste your brief or upload the file directly." },
  { q: "How is the completeness score calculated?", a: "The score (0-100%) measures how many of the 12 critical fields are present in your brief. Each field is weighted equally. Fields like budget, timeline, and scope carry additional context weight." },
  { q: "Can I share briefs with my team?", a: "Yes! Team and Agency plans support team collaboration. You can invite members, assign roles, and share briefs across your organization." },
  { q: "Is there a free trial?", a: "The Free plan is our trial — you get 5 briefs per month at no cost. No credit card required to sign up." },
  { q: "Can I cancel my subscription?", a: "Yes. Cancel anytime from the Billing page. You keep access until the end of the current billing period." },
  { q: "What happens when I reach my brief limit?", a: "On the Free plan, analysis is blocked until the counter resets on the 1st of the next month. Upgrade to Pro for unlimited briefs." },
  { q: "Is my data secure?", a: "Yes. All data is encrypted in transit (TLS) and at rest. Brief content is stored securely and only accessible to your account and authorized team members." },
  { q: "How do I get API access?", a: "API access is available on Team and Agency plans. Generate your API key from the Documentation page." },
];

export default function FaqSection({ searchQuery = "" }) {
  const [open, setOpen] = useState(null);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return FAQS;
    const q = searchQuery.toLowerCase();
    return FAQS.filter((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
  }, [searchQuery]);

  return (
    <div>
      <h2 className="font-headline-md text-headline-md mb-2">Frequently Asked Questions</h2>
      <p className="text-on-surface-variant mb-6">Quick answers to common questions.</p>

      {filtered.length === 0 ? (
        <p className="text-sm text-on-surface-variant text-center py-8">No results found for "{searchQuery}"</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((faq, i) => (
            <div key={i} className="rounded-xl border border-outline-variant overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-4 bg-surface-container-lowest hover:bg-surface-container transition-colors text-left"
              >
                <span className="text-sm font-medium text-on-surface pr-4">{faq.q}</span>
                <Icon name={open === i ? "expand_less" : "expand_more"} className="shrink-0 text-on-surface-variant" />
              </button>
              {open === i && (
                <div className="px-4 pb-4 bg-surface-container-lowest">
                  <p className="text-sm text-on-surface-variant">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
