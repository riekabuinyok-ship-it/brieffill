export default function ScoreGauge({ score = 0, size = 192 }) {
  const clamped = Math.max(0, Math.min(100, score));
  const r = 88;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (clamped / 100) * circumference;
  const color = clamped > 80 ? "text-primary" : clamped >= 60 ? "text-yellow-600" : "text-error";
  const stripe = clamped > 80 ? "border-primary" : clamped >= 60 ? "border-yellow-500" : "border-error";

  return (
    <div className="relative inline-flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="text-surface-container-high dark:text-surface-dim" stroke="currentColor" strokeWidth="12" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          className={`gauge-ring ${color}`}
          stroke="currentColor"
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-display text-display ${color}`}>{clamped}%</span>
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Complete</span>
      </div>
    </div>
  );
}
