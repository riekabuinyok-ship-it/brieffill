export default function EmptyState({ type = "briefs" }) {
  if (type === "search") {
    return (
      <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full max-w-[200px] mx-auto">
        <rect x="50" y="30" width="100" height="80" rx="12" stroke="#c3c6d7" strokeWidth="2" fill="none" />
        <line x1="70" y1="55" x2="130" y2="55" stroke="#c3c6d7" strokeWidth="2" strokeLinecap="round" />
        <line x1="70" y1="70" x2="115" y2="70" stroke="#c3c6d7" strokeWidth="2" strokeLinecap="round" />
        <line x1="70" y1="85" x2="100" y2="85" stroke="#c3c6d7" strokeWidth="2" strokeLinecap="round" />
        <circle cx="135" cy="125" r="18" stroke="#c3c6d7" strokeWidth="2" fill="none" />
        <line x1="148" y1="138" x2="160" y2="150" stroke="#c3c6d7" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full max-w-[200px] mx-auto">
      <rect x="45" y="25" width="110" height="85" rx="12" stroke="#c3c6d7" strokeWidth="2" fill="none" />
      <rect x="55" y="35" width="90" height="65" rx="8" stroke="#e2e8f0" strokeWidth="1.5" fill="#f8fafc" />
      <line x1="70" y1="50" x2="120" y2="50" stroke="#c3c6d7" strokeWidth="2" strokeLinecap="round" />
      <line x1="70" y1="62" x2="110" y2="62" stroke="#c3c6d7" strokeWidth="2" strokeLinecap="round" />
      <line x1="70" y1="74" x2="100" y2="74" stroke="#c3c6d7" strokeWidth="2" strokeLinecap="round" />
      <line x1="70" y1="86" x2="105" y2="86" stroke="#c3c6d7" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 3" />
      <line x1="85" y1="86" x2="90" y2="86" stroke="#004ac6" strokeWidth="2" strokeLinecap="round" />
      <circle cx="100" cy="140" r="12" fill="#dbe1ff" />
      <path d="M95 140h10M100 135v10" stroke="#004ac6" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
