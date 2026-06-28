export default function DocAnalyzeIllustration({ variant = 1 }) {
  if (variant === 2) return (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full max-w-[120px]">
      <rect x="15" y="5" width="90" height="65" rx="10" stroke="#2563eb" strokeWidth="1.5" fill="rgba(37,99,235,0.05)" />
      <line x1="30" y1="22" x2="85" y2="22" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="30" y1="35" x2="75" y2="35" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="30" y1="48" x2="65" y2="48" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="45" y="62" width="30" height="25" rx="6" stroke="#22c55e" strokeWidth="1.5" fill="rgba(34,197,94,0.08)" />
      <path d="M55 75l5 5 10-10" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (variant === 3) return (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full max-w-[120px]">
      <rect x="15" y="5" width="90" height="65" rx="10" stroke="#2563eb" strokeWidth="1.5" fill="rgba(37,99,235,0.05)" />
      <line x1="30" y1="22" x2="85" y2="22" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="30" y1="35" x2="75" y2="35" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="30" y1="48" x2="65" y2="48" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="60" cy="78" r="14" stroke="#f59e0b" strokeWidth="1.5" fill="rgba(245,158,11,0.08)" />
      <path d="M60 72v6M60 84v-2" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
  return (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full max-w-[120px]">
      <rect x="15" y="5" width="90" height="65" rx="10" stroke="#2563eb" strokeWidth="1.5" fill="rgba(37,99,235,0.05)" />
      <line x1="30" y1="22" x2="85" y2="22" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="30" y1="35" x2="75" y2="35" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="30" y1="48" x2="65" y2="48" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="60" cy="82" r="12" stroke="#2563eb" strokeWidth="1.5" fill="rgba(37,99,235,0.08)" />
      <path d="M55 82h10M60 77v10" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function HeroDocumentIllustration() {
  return (
    <svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="hero-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(37,99,235,0.08)" />
          <stop offset="100%" stopColor="rgba(37,99,235,0.02)" />
        </linearGradient>
        <linearGradient id="check-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
      </defs>
      {/* Background card */}
      <rect x="40" y="30" width="320" height="220" rx="20" fill="url(#hero-bg)" stroke="#e2e8f0" strokeWidth="1" />
      {/* Score badge */}
      <rect x="280" y="45" width="65" height="28" rx="14" fill="#2563eb" />
      <text x="312" y="64" textAnchor="middle" fill="white" fontSize="12" fontFamily="Inter" fontWeight="600">92%</text>
      {/* Document */}
      <rect x="65" y="55" width="130" height="100" rx="10" fill="white" stroke="#e2e8f0" strokeWidth="1" />
      <rect x="78" y="70" width="105" height="4" rx="2" fill="#e2e8f0" />
      <rect x="78" y="82" width="90" height="4" rx="2" fill="#e2e8f0" />
      <rect x="78" y="94" width="75" height="4" rx="2" fill="#e2e8f0" />
      <rect x="78" y="110" width="100" height="4" rx="2" fill="#e2e8f0" />
      <rect x="78" y="122" width="85" height="4" rx="2" fill="#e2e8f0" />
      <rect x="78" y="134" width="95" height="4" rx="2" fill="#e2e8f0" />
      <rect x="78" y="146" width="60" height="4" rx="2" fill="#e2e8f0" />
      {/* Checkmarks */}
      <circle cx="250" cy="70" r="14" fill="rgba(34,197,94,0.12)" />
      <path d="M245 71l3 3 7-7" stroke="url(#check-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="250" cy="105" r="14" fill="rgba(34,197,94,0.12)" />
      <path d="M245 106l3 3 7-7" stroke="url(#check-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="250" cy="140" r="14" fill="rgba(239,68,68,0.12)" />
      <path d="M245 141l3-3 7 7" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots connecting */}
      <line x1="210" y1="70" x2="236" y2="70" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="210" y1="105" x2="236" y2="105" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="210" y1="140" x2="236" y2="140" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
      {/* Mini chart */}
      <rect x="65" y="170" width="280" height="60" rx="10" fill="white" stroke="#e2e8f0" strokeWidth="1" />
      <polyline points="85,210 120,190 155,205 190,180 225,195 260,175 295,188 325,170" stroke="#2563eb" strokeWidth="2" fill="none" strokeLinejoin="round" />
      <circle cx="85" cy="210" r="3" fill="#2563eb" />
      <circle cx="325" cy="170" r="3" fill="#2563eb" />
    </svg>
  );
}
