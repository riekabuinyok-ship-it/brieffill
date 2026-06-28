import { Link } from "react-router-dom";
import { LogoIcon } from "./Logo";
import Icon from "./Icon";

const productLinks = [
  { name: "Features", href: "/features" },
  { name: "How It Works", href: "/how-it-works" },
  { name: "Pricing", href: "/pricing" },
  { name: "Templates", href: "/templates" },
  { name: "Integrations", href: "/integrations" },
  { name: "Changelog", href: "/docs" },
];

const templateLinks = [
  { name: "Advertising", href: "/templates?cat=advertising" },
  { name: "Design", href: "/templates?cat=design" },
  { name: "Development", href: "/templates?cat=development" },
  { name: "Marketing", href: "/templates?cat=marketing" },
  { name: "UX/UI", href: "/templates?cat=ux-ui" },
  { name: "Video", href: "/templates?cat=video" },
];

const resourceLinks = [
  { name: "User Guide", href: "/guide" },
  { name: "FAQ", href: "/faq" },
  { name: "Community", href: "/community" },
];

const companyLinks = [
  { name: "About Us", href: "/team" },
  { name: "Our Values", href: "/values" },
  { name: "Careers", href: "/careers" },
  { name: "Press Kit", href: "/press" },
];

const supportLinks = [
  { name: "Help Center", href: "/help" },
  { name: "Contact", href: "mailto:support@brieffill.com" },
  { name: "Privacy", href: "/privacy" },
  { name: "Terms", href: "/referral-terms" },
];

const socialLinks = [
  { icon: "alternate_email", href: "https://twitter.com/brieffill", label: "Twitter" },
  { icon: "work", href: "https://linkedin.com/company/brieffill", label: "LinkedIn" },
  { icon: "play_circle", href: "https://youtube.com/@brieffill", label: "YouTube" },
  { icon: "code", href: "https://github.com/brieffill", label: "GitHub" },
];

function FooterColumn({ title, links }) {
  return (
    <div>
      <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{title}</h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.name}>
            {link.href.startsWith("http") || link.href.startsWith("mailto") ? (
              <a href={link.href} className="text-sm text-outline hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
                {link.name}
              </a>
            ) : (
              <Link to={link.href} className="text-sm text-outline hover:text-white transition-colors">
                {link.name}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#0f172a] text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          <FooterColumn title="Product" links={productLinks} />
          <FooterColumn title="Templates" links={templateLinks} />
          <FooterColumn title="Resources" links={resourceLinks} />
          <FooterColumn title="Company" links={companyLinks} />
          <FooterColumn title="Support" links={supportLinks} />
        </div>

        {/* Newsletter */}
        <div className="border-t border-gray-800 mt-10 pt-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-white font-semibold">Stay Updated</h4>
              <p className="text-sm text-gray-400">Get product updates and tips</p>
            </div>
            <div className="flex w-full md:w-auto">
              <input type="email" placeholder="Email address"
                className="flex-1 md:w-64 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-l-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary" />
              <button className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-r-lg hover:bg-primary/90 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <LogoIcon size={20} className="brightness-0 invert" />
            <span className="text-sm text-gray-400">&copy; {new Date().getFullYear()} BriefFill Inc. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            {socialLinks.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors" aria-label={s.label}>
                <Icon name={s.icon} className="text-[20px]" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
