import { Link } from "react-router-dom";
import Icon from "../components/Icon";

const values = [
  {
    id: "clarity",
    icon: "lightbulb",
    title: "Clarity First",
    description: "We believe that every project deserves a clear starting point. Our mission is to help freelancers and agencies uncover what's missing in their briefs before they start working.",
    quote: "Clarity isn't just about what you know — it's about what you don't know yet. We're here to uncover the gaps.",
    border: "border-indigo-200",
    bg: "bg-indigo-50",
    iconBg: "text-indigo-600",
  },
  {
    id: "transparency",
    icon: "shield",
    title: "Trust Through Transparency",
    description: "We're honest about what we can do and what we can't. No hidden fees, no fine print, no surprises. What you see is what you get — and we're proud of it.",
    quote: "The best relationships are built on trust. We earn yours by being transparent, always.",
    border: "border-green-200",
    bg: "bg-green-50",
    iconBg: "text-green-600",
  },
  {
    id: "ship",
    icon: "rocket_launch",
    title: "Ship, Learn, Repeat",
    description: "We move fast, listen to our users, and never stop improving. Every feature we ship is informed by real feedback from real freelancers and agencies.",
    quote: "We're not afraid to iterate. The best products are built by listening, learning, and shipping again.",
    border: "border-purple-200",
    bg: "bg-purple-50",
    iconBg: "text-purple-600",
  },
  {
    id: "empathy",
    icon: "favorite",
    title: "Empathy in Action",
    description: "We understand the pressure of client work, tight deadlines, and unclear expectations. We build tools that make your life easier, not harder.",
    quote: "We've been where you are. We build BriefFill for the person we used to be — the freelancer who deserved better tools.",
    border: "border-rose-200",
    bg: "bg-rose-50",
    iconBg: "text-rose-600",
  },
  {
    id: "impact",
    icon: "auto_awesome",
    title: "Small Team, Big Impact",
    description: "We're a lean team that moves fast. We measure success not by how many features we ship, but by how much we help you achieve.",
    quote: "Great things in business are never done by one person. They're done by a team of people who share a mission.",
    border: "border-orange-200",
    bg: "bg-orange-50",
    iconBg: "text-orange-600",
  },
];

export default function Values() {
  return (
    <div className="bg-background min-h-screen">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-white text-sm font-medium mb-6">
            <Icon name="favorite" filled className="text-[16px]" />
            Our Values
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            The principles that guide everything we do.
          </h1>
          <p className="text-xl text-indigo-100 max-w-2xl mx-auto mb-8">
            Built by freelancers, for freelancers. These values shape every decision we make at BriefFill.
          </p>
          <Link to="/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:shadow-lg transition">
            Start Free Trial
            <Icon name="arrow_forward" filled className="text-[18px]" />
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid gap-8">
          {values.map((v) => (
            <div key={v.id} className={`rounded-2xl p-8 border ${v.bg} ${v.border} transition hover:shadow-md`}>
              <div className="flex items-start gap-6">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-white shadow-sm ${v.iconBg}`}>
                  <Icon name={v.icon} filled className="text-[28px]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-on-surface mb-2">{v.title}</h3>
                  <p className="text-on-surface-variant text-base leading-relaxed mb-3">{v.description}</p>
                  <div className="bg-white/70 rounded-lg p-4 border border-outline-variant">
                    <p className="text-on-surface-variant text-sm italic">&ldquo;{v.quote}&rdquo;</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface-container-low py-16 border-t border-outline-variant">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-on-surface mb-4">Ready to start with clarity?</h2>
          <p className="text-lg text-on-surface-variant mb-8 max-w-2xl mx-auto">
            Join thousands of freelancers and agencies who start every project with absolute clarity.
          </p>
          <Link to="/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition shadow-sm">
            Start Your Free Trial
            <Icon name="arrow_forward" filled className="text-[18px]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
