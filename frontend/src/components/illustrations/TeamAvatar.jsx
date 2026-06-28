export default function TeamAvatar({ initials, color = "from-primary to-blue-500", size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`avatar-grad-${initials}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#004ac6" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <rect width="80" height="80" rx="40" fill={`url(#avatar-grad-${initials})`} />
      <circle cx="40" cy="32" r="12" fill="rgba(255,255,255,0.85)" />
      <ellipse cx="40" cy="66" rx="20" ry="18" fill="rgba(255,255,255,0.85)" />
    </svg>
  );
}
