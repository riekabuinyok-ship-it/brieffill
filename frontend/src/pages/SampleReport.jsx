import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';

const fields = [
  { name: 'Project Overview', status: 'present' },
  { name: 'Target Audience', status: 'present' },
  { name: 'Core Problem', status: 'partial' },
  { name: 'Solution/Offer', status: 'partial' },
  { name: 'Key Benefits', status: 'partial' },
  { name: 'Tone of Voice', status: 'present' },
  { name: 'Timeline', status: 'present' },
  { name: 'Call to Action', status: 'missing' },
];

const questions = [
  { number: '01', text: 'Could you specify the core problem from the customer\'s perspective? Is it operational cost, speed, or reliability that current solutions lack?', color: 'primary' },
  { number: '02', text: 'Regarding the \'Solution\'—could you provide more technical specifics on the AI-driven learning algorithms to strengthen the differentiator slide?', color: 'primary' },
  { number: '03', text: 'What are the top 3 key benefits for the end-user? We have the market size, but specific user outcomes would improve the pitch narrative.', color: 'primary' },
  { number: '04', text: 'What is the desired \'Call to Action\' for the investors at the end of the presentation? (e.g., Book a demo, request deep-dive data room access, etc.)', color: 'secondary' },
];

export default function SampleReport() {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(emailContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fieldIcon = (status) => {
    switch (status) {
      case 'present': return <Icon name="check_circle" className="!text-xl text-green-600" />;
      case 'partial': return <Icon name="pending" className="!text-xl text-amber-500" />;
      case 'missing': return <Icon name="block" className="!text-xl text-error" />;
      default: return null;
    }
  };

  const fieldLabel = (status) => {
    switch (status) {
      case 'present': return <span className="font-label-sm text-green-600 bg-green-50 px-2 py-0.5 rounded">Present</span>;
      case 'partial': return <span className="font-label-sm text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Partial</span>;
      case 'missing': return <span className="font-label-sm text-error bg-error-container/20 px-2 py-0.5 rounded">Missing</span>;
      default: return null;
    }
  };

  const emailContent = `Hi Thomas,

I've reviewed the brief for the Quantum Robotics Series A Pitch Deck. The traction and team info is excellent. To ensure we deliver the highest quality slides, I just need a quick expansion on 4 points:

1. What specific customer pain point are we solving better than Boston Dynamics?
2. Can you provide a bit more detail on the AI learning algorithms?
3. What are the top 3 outcome-based benefits for the users?
4. What is the single most important action you want investors to take after viewing the deck?

Let me know whenever you have a moment.

Best regards,
[Your Name]`;

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-container-max mx-auto px-4 md:px-gutter py-stack-lg">
        <section className="mb-stack-lg text-center md:text-left">
          <h1 className="font-display text-display text-primary mb-2">
            Sample Brief Analysis
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            See exactly what BriefFill does — no sign-up required.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-card p-6 rounded-xl shadow-sm flex items-center justify-between"
              style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.3)' }}>
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant mb-1 uppercase">Client</p>
                <p className="font-headline-md text-headline-md text-on-surface">Thomas Mueller</p>
              </div>
              <div className="text-right">
                <p className="font-label-sm text-label-sm text-on-surface-variant mb-1 uppercase">Project</p>
                <p className="font-body-md text-body-md font-semibold text-primary">Quantum Robotics — Pitch Deck</p>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant">
              <div className="flex items-center gap-2 mb-4 text-primary">
                <Icon name="description" className="!text-2xl" />
                <h2 className="font-headline-md text-headline-md text-on-surface">Original Brief</h2>
              </div>
              <div className="font-body-md text-body-md leading-relaxed text-on-surface-variant bg-surface-container-low p-6 rounded-lg" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                Creating a pitch deck for "Quantum Robotics" — Series A funding round ($5M). Target audience: venture capital firms and angel investors. Need 15-18 slides covering: problem, solution, market size ($50B), traction (300 customers, 200% YoY growth), team (ex-MIT, ex-Google), competitive landscape, financial projections ($10M ARR in Year 3), and use of funds. Brand guidelines attached. Tone: confident, data-driven, innovative. Competitors: Boston Dynamics, inVia Robotics. Differentiator: AI-driven learning algorithms, 40% cheaper. Deadline: 3 weeks. Budget: $7,000. Need both presentation and PDF formats.
              </div>
            </div>

            <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant">
              <div className="flex items-center gap-2 mb-6 text-primary">
                <Icon name="quiz" className="!text-2xl" />
                <h2 className="font-headline-md text-headline-md text-on-surface">AI Clarification Questions</h2>
              </div>
              <div className="space-y-4">
                {questions.map((q) => (
                  <div
                    key={q.number}
                    className="flex gap-4 p-4 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors"
                    style={{ borderLeft: `4px solid ${q.color === 'primary' ? 'var(--color-primary, #004ac6)' : 'var(--color-secondary, #712ae2)'}` }}
                  >
                    <span className={`font-label-sm text-lg shrink-0 ${q.color === 'primary' ? 'text-primary' : 'text-secondary'}`}>
                      {q.number}
                    </span>
                    <p className="font-body-md text-on-surface-variant">{q.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-primary text-on-primary p-8 rounded-xl shadow-lg relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
              <div className="relative z-10 text-center">
                <p className="font-label-sm uppercase tracking-widest opacity-80 mb-4">Brief Readiness Score</p>
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
                      <circle className="opacity-20" cx="80" cy="80" fill="transparent" r="70" stroke="currentColor" strokeWidth="8" />
                      <circle className="text-white drop-shadow-md" cx="80" cy="80" fill="transparent" r="70" stroke="currentColor" strokeDasharray="440" strokeDashoffset="36" strokeLinecap="round" strokeWidth="12" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-display text-4xl font-extrabold" style={{ fontSize: '2.25rem', lineHeight: 1 }}>91.7%</span>
                      <span className="font-label-sm uppercase text-xs mt-1">AI READY</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 bg-white/20 px-4 py-1 rounded-full inline-block">
                  <span className="font-body-md font-semibold">Status: Excellent</span>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant">
              <h3 className="font-headline-md text-headline-md mb-4 text-on-surface">Field Breakdown</h3>
              <ul className="space-y-1">
                {fields.map((f) => (
                  <li key={f.name} className="flex items-center justify-between p-3 hover:bg-surface-container-low rounded transition-colors group">
                    <div className="flex items-center gap-3">
                      {fieldIcon(f.status)}
                      <span className={`font-body-md ${f.status === 'missing' ? 'text-error' : 'text-on-surface-variant'}`}>
                        {f.name}
                      </span>
                    </div>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                      {fieldLabel(f.status)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <section className="mt-stack-lg">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
            <div className="bg-surface-container-high px-6 py-4 flex items-center justify-between border-b border-outline-variant">
              <div className="flex items-center gap-2">
                <Icon name="drafts" className="!text-xl text-on-surface-variant" />
                <h3 className="font-headline-md text-headline-md text-on-surface">Clarification Draft</h3>
              </div>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
            </div>
            <div className="p-8">
              <div className="mb-6 space-y-2 pb-4 border-b border-outline-variant">
                <p className="font-body-md text-on-surface-variant">
                  <span className="font-semibold">Subject:</span> Clarification for Quantum Robotics Pitch Deck Project
                </p>
                <p className="font-body-md text-on-surface-variant">
                  <span className="font-semibold">To:</span> Thomas Mueller
                </p>
              </div>
              <div className="font-body-md text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                {emailContent}
              </div>
              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  onClick={handleCopyEmail}
                  className="bg-primary text-on-primary px-6 py-2.5 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity font-semibold"
                >
                  <Icon name={copied ? 'check' : 'content_copy'} className="!text-lg" />
                  {copied ? 'Copied!' : 'Copy Email'}
                </button>
                <button className="border border-primary text-primary px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-primary/5 transition-colors font-semibold">
                  <Icon name="picture_as_pdf" className="!text-lg" />
                  Download PDF
                </button>
                <button className="border border-primary text-primary px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-primary/5 transition-colors font-semibold">
                  <Icon name="send" className="!text-lg" />
                  Send in Gmail
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-20 mb-12 text-center max-w-2xl mx-auto">
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-4">Analyze your first brief for free</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
            Stop chasing clients for basic info. Let BriefFill find the gaps so you can start working immediately.
          </p>
          <Link
            to="/register"
            className="inline-block bg-primary-container text-on-primary-container text-xl px-12 py-4 rounded-full font-bold shadow-lg hover:scale-105 transition-transform active:scale-95 mb-8"
          >
            Start Free Trial
          </Link>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <span className="flex items-center gap-2">
              <Icon name="verified_user" className="!text-lg text-green-600" />
              <span className="font-label-sm text-label-sm">14-Day Money-Back Guarantee</span>
            </span>
            <span className="flex items-center gap-2">
              <Icon name="lock" className="!text-lg text-green-600" />
              <span className="font-label-sm text-label-sm">Secure Data Encryption</span>
            </span>
            <span className="flex items-center gap-2">
              <Icon name="bolt" className="!text-lg text-green-600" />
              <span className="font-label-sm text-label-sm">Instant AI Processing</span>
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}
