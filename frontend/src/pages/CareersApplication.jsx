import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import Icon from "../components/Icon";

const positions = {
  engineer: { title: "Full Stack Engineer", dept: "Engineering", location: "Remote", type: "Full-time", salary: "$120k-160k", desc: "We're looking for a talented full-stack engineer to help build the future of creative collaboration." },
  product: { title: "Product Manager", dept: "Product", location: "Remote", type: "Full-time", salary: "$110k-150k", desc: "Lead product strategy and execution for our core platform." },
  designer: { title: "Senior Product Designer", dept: "Design", location: "Remote", type: "Full-time", salary: "$100k-140k", desc: "Shape the product experience for thousands of creative professionals." },
  marketing: { title: "Marketing Lead", dept: "Marketing", location: "Remote", type: "Full-time", salary: "$90k-120k", desc: "Drive growth and brand awareness for BriefFill." },
};

export default function CareersApplication() {
  const { id } = useParams();
  const position = positions[id];
  const [form, setForm] = useState({ name: "", email: "", phone: "", linkedin: "", portfolio: "", coverLetter: "", resume: null });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (!position) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-on-surface-variant">Position not found</p>
          <Link to="/careers" className="text-primary font-semibold hover:underline mt-2 inline-block">&larr; Back to Careers</Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-surface-container-low flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-sm border border-outline-variant">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-on-surface mb-2">Application Submitted!</h2>
          <p className="text-on-surface-variant mb-6">Thanks for applying to {position.title}. We'll review your application and get back to you within 3-5 business days.</p>
          <Link to="/careers" className="text-primary font-semibold hover:underline">&larr; Back to Careers</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-low py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Link to="/careers" className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition mb-6">
          <Icon name="arrow_back" className="text-[16px]" />
          Back to Careers
        </Link>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-outline-variant">
          <h1 className="text-2xl font-bold text-on-surface">Apply for {position.title}</h1>
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-on-surface-variant">
            <span className="flex items-center gap-1"><Icon name="language" className="text-[14px]" />{position.location}</span>
            <span className="flex items-center gap-1"><Icon name="schedule" className="text-[14px]" />{position.type}</span>
            <span className="flex items-center gap-1"><Icon name="payments" className="text-[14px]" />{position.salary}</span>
            <span className="text-outline">&bull;</span>
            <span className="text-primary font-semibold">{position.dept}</span>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1">Full Name *</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary" placeholder="Your full name" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1">Email Address *</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1">Phone Number</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary" placeholder="+1 (555) 000-0000" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1">LinkedIn Profile</label>
              <input type="url" value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary" placeholder="https://linkedin.com/in/yourprofile" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1">Portfolio / Website</label>
              <input type="url" value={form.portfolio} onChange={(e) => setForm({ ...form, portfolio: e.target.value })}
                className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary" placeholder="https://yourportfolio.com" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1">Cover Letter</label>
              <textarea rows={4} value={form.coverLetter} onChange={(e) => setForm({ ...form, coverLetter: e.target.value })}
                className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary resize-y" placeholder="Tell us why you're interested in this role..." />
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1">Resume *</label>
              <input type="file" required accept=".pdf,.doc,.docx" onChange={(e) => setForm({ ...form, resume: e.target.files[0] })}
                className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary" />
              <p className="text-xs text-outline mt-1">PDF, DOC, or DOCX (max 5MB)</p>
            </div>
            <button type="submit"
              className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition flex items-center justify-center gap-2">
              <Icon name="send" className="text-[16px]" />
              Submit Application
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
