import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';

export default function SampleReport() {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(emailContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const sampleBrief = `Creating a pitch deck for "Quantum Robotics" — Series A funding round ($5M). Target audience: venture capital firms and angel investors. Need 15-18 slides covering: problem, solution, market size ($50B), traction (300 customers, 200% YoY growth), team (ex-MIT, ex-Google), competitive landscape, financial projections ($10M ARR in Year 3), and use of funds. Brand guidelines attached. Tone: confident, data-driven, innovative. Competitors: Boston Dynamics, inVia Robotics. Differentiator: AI-driven learning algorithms, 40% cheaper. Deadline: 3 weeks. Budget: $7,000. Need both presentation and PDF formats.`;

  const fields = [
    { name: 'Project Overview', status: 'present' },
    { name: 'Target Audience', status: 'present' },
    { name: 'Core Problem', status: 'partial' },
    { name: 'Solution/Offer', status: 'partial' },
    { name: 'Key Benefits', status: 'partial' },
    { name: 'Tone of Voice', status: 'present' },
    { name: 'Brand Guidelines', status: 'present' },
    { name: 'Deliverables', status: 'present' },
    { name: 'Timeline', status: 'present' },
    { name: 'Budget', status: 'present' },
    { name: 'Competitors', status: 'present' },
    { name: 'Call to Action', status: 'missing' }
  ];

  const questions = [
    'What specific pain points or challenges do your robotics solutions address for your customers, and how do these align with the needs of the venture capital firms and angel investors you\'re targeting?',
    'Can you elaborate on how your AI-driven learning algorithms work and what specific benefits they provide to customers?',
    'How do your solutions\' 40% cost savings and AI-driven learning algorithms translate into key benefits for your target audience, such as increased efficiency or productivity?',
    'What specific action or investment do you want the venture capital firms and angel investors to take after reviewing your pitch deck?'
  ];

  const emailContent = `Subject: A Few Clarifying Questions Regarding Quantum Robotics Pitch Deck

Hi Thomas,

Thank you for sending over the brief for the Quantum Robotics Pitch Deck. I'm excited to get started!

After reviewing the brief, I have a few clarifying questions to ensure I fully understand your vision:

1. What specific pain points or challenges do your robotics solutions address for your customers, and how do these align with the needs of the venture capital firms and angel investors you're targeting?

2. Can you elaborate on how your AI-driven learning algorithms work and what specific benefits they provide to customers?

3. How do your solutions' 40% cost savings and AI-driven learning algorithms translate into key benefits for your target audience, such as increased efficiency or productivity?

4. What specific action or investment do you want the venture capital firms and angel investors to take after reviewing your pitch deck?

Once I have these details, I'll be able to provide you with a more accurate timeline and scope for the project.

Looking forward to working with you!

Best regards,
[Your Name]
[Your Title/Company]`;

  const StatusIcon = ({ status }) => {
    switch (status) {
      case 'present':
        return <Icon name="check_circle" className="text-green-500 !text-xl" />;
      case 'partial':
        return <Icon name="warning" className="text-yellow-500 !text-xl" />;
      case 'missing':
        return <Icon name="cancel" className="text-red-500 !text-xl" />;
      default:
        return null;
    }
  };

  const StatusText = ({ status }) => {
    switch (status) {
      case 'present':
        return <span className="text-green-600">Present</span>;
      case 'partial':
        return <span className="text-yellow-600">Partial</span>;
      case 'missing':
        return <span className="text-red-600">Missing</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Icon name="auto_awesome" className="text-white !text-3xl" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            📊 Sample Brief Analysis
          </h1>
          <p className="text-xl text-indigo-100 max-w-2xl mx-auto mb-8">
            See exactly what BriefFill does — no sign-up required.
          </p>
          <Link 
            to="/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:shadow-lg transition"
          >
            Try It Yourself
            <Icon name="arrow_forward" className="!text-lg" />
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">📋 Client</p>
              <p className="font-semibold text-gray-900">Thomas Mueller</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">📝 Project</p>
              <p className="font-semibold text-gray-900">Quantum Robotics — Pitch Deck</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-2">Original Brief</p>
            <p className="text-sm text-gray-600 leading-relaxed">{sampleBrief}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-500">AI READY</span>
              <Icon name="check_circle" className="text-green-600 !text-2xl" />
              <span className="text-2xl font-bold text-gray-900">91.7%</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                Complete
              </span>
            </div>
            <span className="px-4 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-full">
              🟢 Excellent
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Field-by-Field Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fields.map((field, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <StatusIcon status={field.status} />
                  <span className="text-sm font-medium text-gray-700">{field.name}</span>
                </div>
                <StatusText status={field.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">❓ AI Clarification Questions</h2>
          <div className="space-y-3">
            {questions.map((question, index) => (
              <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-indigo-600 flex-shrink-0">Q{index + 1}:</span>
                <p className="text-sm text-gray-600">{question}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📧 Generated Clarification Email</h2>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="whitespace-pre-wrap text-sm text-gray-600 font-mono leading-relaxed">
              {emailContent}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <button 
              onClick={handleCopyEmail}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
            >
              {copied ? '✅ Copied!' : <><Icon name="content_copy" className="!text-base" /> Copy Email</>}
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition">
              <Icon name="download" className="!text-base" />
              Download PDF
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition">
              <Icon name="mail" className="!text-base" />
              Send in Gmail
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">🚀 Ready to get started?</h2>
          <p className="text-indigo-100 mb-6">Analyze your first brief for free — no credit card required.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:shadow-lg transition"
            >
              Start Free Trial
              <Icon name="arrow_forward" className="!text-lg" />
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-indigo-200 text-sm">
            <span className="flex items-center gap-1">
              <Icon name="verified" className="!text-base" />
              14-Day Money-Back Guarantee
            </span>
            <span className="w-px h-4 bg-indigo-400/30" />
            <span>No credit card required</span>
            <span className="w-px h-4 bg-indigo-400/30" />
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
}
